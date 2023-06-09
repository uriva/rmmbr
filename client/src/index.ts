import { decrypt, encrypt, hash } from "./crypto.ts";

import { dirname } from "https://deno.land/std@0.179.0/path/mod.ts";
import { jsonStringify } from "https://deno.land/x/stable_stringify@v0.2.1/jsonStringify.ts";

const jsonStableStringify = (x: any) => jsonStringify(x) as string;

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
  read: (key: string) => Promise<Y>;
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
      getCache().then((cache: Cache) =>
        key in cache ? cache[key] : Promise.reject()
      ),
    write: async (key: string, value: JSONValue) => {
      const cache = await getCache();
      cache[key] = value;
      return writeStringToFile(pathToCache(name), serialize(cache));
    },
  };
};

const writePromises = new Set<Promise<void>>();

const enrollPromise = (writePromise: Promise<void>) => {
  writePromises.add(writePromise);
  writePromise.finally(() => writePromises.delete(writePromise));
};

const abstractCache = <X extends JSONArr, Y>({
  key,
  f,
  read,
  write,
}: AbstractCacheParams<X, Y>): Func<X, Y> =>
(...x: X) => {
  const keyResult = key(...x);
  return read(keyResult).catch(() =>
    f(...x).then((y) => {
      enrollPromise(write(keyResult, y));
      return y;
    })
  );
};

export const waitAllWrites = () => Promise.all(writePromises);

const inputToCacheKey = (secret: string) => (...x: JSONArr): string =>
  hash(jsonStableStringify(x) + secret);

type MemParams = { ttl?: number };

export const memCache =
  ({ ttl }: MemParams) =>
  <X extends JSONArr, Y extends JSONValue>(f: Func<X, Y>) => {
    const keyToValue: Record<string, Y> = {};
    const keyToTimestamp: Record<string, number> = {};
    return abstractCache({
      key: inputToCacheKey(""),
      f,
      read: (key: string): Promise<Y> => {
        if (!(key in keyToValue)) {
          return Promise.reject();
        }
        if (ttl && Date.now() - keyToTimestamp[key] > ttl * 1000) {
          delete keyToTimestamp[key];
          delete keyToValue[key];
          return Promise.reject();
        }
        return Promise.resolve(keyToValue[key]);
      },
      write: (key: string, value: Y) => {
        keyToValue[key] = value;
        keyToTimestamp[key] = Date.now();
        return Promise.resolve();
      },
    });
  };

const localCache =
  ({ cacheId }: CacheParams) =>
  <X extends JSONArr, Y extends JSONValue>(f: Func<X, Y>) =>
    abstractCache({
      key: inputToCacheKey(""),
      f,
      ...makeLocalReadWrite(cacheId),
    });

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

const assertString = (
  s: string | null | undefined,
  message: string,
): string => {
  if (!s) throw message;
  return s;
};

const urlParamMissing =
  'Missing `url` parameter for backend. Try with "https://rmmbr.net".';
const tokenParamMissing =
  "Missing `token` parameter. You can produce a token using `rmmbr token -g` command.";

const setRemote =
  ({ cacheId, url, token, ttl }: CacheParams) =>
  (key: string, value: JSONValue) =>
    callAPI(
      assertString(url, urlParamMissing),
      assertString(token, tokenParamMissing),
      "set",
      { key, value, ttl, cacheId },
    );

const getRemote = ({ url, token, cacheId }: CacheParams) => (key: string) =>
  callAPI(
    assertString(url, urlParamMissing),
    assertString(token, tokenParamMissing),
    "get",
    { key, cacheId },
  );

export type CacheParams = {
  cacheId: string;
  token?: string;
  url?: string;
  ttl?: number;
  encryptionKey?: string;
};

export const cache = (params: CacheParams) =>
  params.token ? cloudCache(params) : localCache(params);

const cloudCache =
  (params: CacheParams) =>
  <X extends JSONArr, Y extends JSONValue>(f: Func<X, Y>) =>
    abstractCache({
      key: inputToCacheKey(params.encryptionKey || ""),
      f,
      read: (key) =>
        getRemote(params)(key)
          .then((value) =>
            value
              ? params.encryptionKey
                ? decrypt(params.encryptionKey as string)(value).then(
                  JSON.parse,
                )
                : value
              : Promise.reject()
          ),
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
