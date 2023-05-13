import { decrypt, encrypt, hash } from "./crypto.ts";

import { dirname } from "https://deno.land/std@0.179.0/path/mod.ts";
import jsonStableStringify from "npm:json-stable-stringify";

const writeStringToFile = (filePath: string, s: string) =>
  Deno.mkdir(dirname(filePath), { recursive: true }).then(() =>
    Deno.writeTextFile(filePath, s)
  );

const pathToCache = (name: string) => `.rmmbr/${name}.json`;

// We would have wanted to do something like that, but can't because of
// https://github.com/microsoft/TypeScript/issues/1897#issuecomment-1415776159
// export type JSONValue =
//   | string
//   | number
//   | boolean
//   | { [x: string]: JSONValue }
//   | Array<JSONValue>;

export type JSONValue = unknown;

const serialize = (x: Cache) => JSON.stringify(Object.entries(x));

const readFileWithDefault = <T>(defaultF: () => T, filePath: string) =>
  Deno.readTextFile(filePath).catch(defaultF);

const deserialize = (str: string): Cache =>
  Object.fromEntries(
    JSON.parse(str).map(([k, v]: [string, JSONValue]) => [k, v]),
  );

type JSONArr = readonly JSONValue[];

export type Func<X extends JSONArr, Y> = (...x: X) => Promise<Y>;

type AbstractCacheParams<X extends JSONArr, Y> = {
  key: (...x: X) => string;
  f: Func<X, Y>;
  read: (key: string) => Promise<Y | null>;
  write: (key: string, value: Y) => Promise<void>;
};

type Cache = Record<string, JSONValue>;

const newCache = (): Cache => ({});

const makeLocalReadWrite = (name: string) => {
  let cache: null | Cache = null;
  const getCache = () =>
    cache
      ? Promise.resolve(cache)
      : readFileWithDefault(() => serialize(newCache()), pathToCache(name))
        .then((x) => x.toString())
        .then(deserialize)
        .then((newCache) => {
          cache = newCache;
          return newCache;
        });
  return {
    read: (key: string) =>
      getCache().then((cache: Cache) => (key in cache ? cache[key] : null)),
    write: async (key: string, value: JSONValue) => {
      const cache = await getCache();
      cache[key] = value;
      return writeStringToFile(pathToCache(name), serialize(cache));
    },
  };
};

const abstractCache = <X extends JSONArr, Y>({
  key,
  f,
  read,
  write,
}: AbstractCacheParams<X, Y>): Func<X, Y> =>
(...x: X) => {
  const keyResult = key(...x);
  return read(keyResult).then((value: Y | null) =>
    value !== null
      ? value
      : f(...x).then((y) => write(keyResult, y).then(() => y))
  );
};

const inputToCacheKey = (secret: string) => (...x: JSONArr): string =>
  hash(jsonStableStringify(x) + secret);

export const memCache = <X extends JSONArr, Y extends JSONValue>(
  f: Func<X, Y>,
) => {
  const cache: Record<string, Y> = {};
  return abstractCache({
    key: inputToCacheKey(""),
    f,
    read: (key: string) => Promise.resolve(key in cache ? cache[key] : null),
    write: (key, value) => {
      cache[key] = value;
      return Promise.resolve();
    },
  });
};

export const localCache =
  <X extends JSONArr, Y extends JSONValue>({ id }: { id: string }) =>
  (f: Func<X, Y>) =>
    abstractCache({ key: inputToCacheKey(""), f, ...makeLocalReadWrite(id) });

const callAPI = (
  url: string,
  token: string,
  method: "set" | "get",
  params: JSONValue,
) =>
  fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ method, params }),
  }).then((x) => x.json());

const setRemote =
  ({ cacheId, url, token, ttl }: CloudParams) =>
  (key: string, value: JSONValue) =>
    callAPI(url, token, "set", { key, value, ttl, cacheId });

const getRemote = ({ url, token, cacheId }: CloudParams) => (key: string) =>
  callAPI(url, token, "get", { key, cacheId });

export type CloudParams = {
  token: string;
  cacheId: string;
  url: string;
  ttl?: number;
  encryptionKey?: string;
};

export const cloudCache =
  <X extends JSONArr, Y extends JSONValue>(params: CloudParams) =>
  (f: Func<X, Y>) =>
    abstractCache({
      key: inputToCacheKey(params.encryptionKey || ""),
      f,
      read: params.encryptionKey
        ? async (key) => {
          const value = await getRemote(params)(key);
          return (
            value &&
            JSON.parse(await decrypt(params.encryptionKey as string)(value))
          );
        }
        : getRemote(params),
      write: params.encryptionKey
        ? async (key, value) =>
          setRemote(params)(
            key,
            await encrypt(params.encryptionKey as string)(
              jsonStableStringify(value),
            ),
          )
        : setRemote(params),
    });
