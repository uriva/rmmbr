import { decrypt, encrypt } from "./crypto.ts";

import { dirname } from "https://deno.land/std@0.179.0/path/mod.ts";
import jsonStableStringify from "npm:json-stable-stringify";
import { sha256 } from "npm:js-sha256";

const writeStringToFile = (filePath: string, s: string) =>
  Deno.mkdir(dirname(filePath), { recursive: true }).then(() =>
    Deno.writeTextFile(filePath, s),
  );

const pathToCache = (name: string) => `.rmmbr/${name}.json`;
const hash = (x: string): string => {
  const hasher = sha256.create();
  hasher.update(x);
  return hasher.hex();
};

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

export type Unary<X, Y> = (x: X) => Promise<Y>;

type AbstractCacheParams<X, Y> = {
  key: (x: X) => string;
  f: Unary<X, Y>;
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

const abstractCache =
  <X, Y>({ key, f, read, write }: AbstractCacheParams<X, Y>): Unary<X, Y> =>
  (x: X) => {
    const keyResult = key(x);
    return read(keyResult).then((value: Y | null) =>
      value !== null
        ? value
        : f(x).then((y) => write(keyResult, y).then(() => y)),
    );
  };

const key = (x: JSONValue): string => hash(jsonStableStringify(x));

export const memCache = <X extends JSONValue, Y extends JSONValue>(
  f: Unary<X, Y>,
) => {
  const cache: Record<string, Y> = {};
  return abstractCache({
    key,
    f,
    read: (key: string) => Promise.resolve(key in cache ? cache[key] : null),
    write: (key, value) => {
      cache[key] = value;
      return Promise.resolve();
    },
  });
};

export const localCache =
  <X extends JSONValue, Y extends JSONValue>({ id }: { id: string }) =>
  (f: Unary<X, Y>) =>
    abstractCache({ key, f, ...makeLocalReadWrite(id) });

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

const setRemote = (params: CloudParams) => (key: string, value: JSONValue) =>
  callAPI(params.url, params.token, "set", { key, value, ...params });

const getRemote = (token: string, url: string) => (key: string) =>
  callAPI(url, token, "get", { key });

export type CloudParams = {
  token: string;
  url: string;
  ttl?: number;
  encryptionKey?: string;
};

export const cloudCache =
  <X extends JSONValue, Y extends JSONValue>(params: CloudParams) =>
  (f: Unary<X, Y>) =>
    abstractCache({
      key,
      f,
      read: params.encryptionKey
        ? async (key) => {
            const value = await getRemote(params.token, params.url)(key);
            return (
              value &&
              JSON.parse(await decrypt(params.encryptionKey as string)(value))
            );
          }
        : getRemote(params.token, params.url),
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
