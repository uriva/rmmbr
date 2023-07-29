import { decrypt, encrypt, hash } from "./crypto.ts";

import { dirname } from "https://deno.land/std@0.179.0/path/mod.ts";
import { jsonStringify } from "https://deno.land/x/stable_stringify@v0.2.1/jsonStringify.ts";

const jsonStableStringify = <Args>(x: Args) => jsonStringify(x) as string;

const writeStringToFile = (filePath: string, s: string) =>
  Deno.mkdir(dirname(filePath), { recursive: true }).then(() =>
    Deno.writeTextFile(filePath, s)
  );

const pathToCache = (name: string) => `.rmmbr/${name}.json`;
const serialize = <Output>(x: Cache<Output>) =>
  JSON.stringify(Object.entries(x));

const readFileWithDefault = <T>(defaultF: () => T, filePath: string) =>
  Deno.readTextFile(filePath).catch(defaultF);

// deno-lint-ignore no-explicit-any
type CachedFunctionOutput = any;

const deserialize = <Output>(str: string): Cache<Output> =>
  Object.fromEntries(
    JSON.parse(str).map(([k, v]: [string, CachedFunctionOutput]) => [k, v]),
  );

// deno-lint-ignore no-explicit-any
type Func = (...x: any[]) => Promise<CachedFunctionOutput>;

type AbstractCacheParams<F extends Func> = {
  key: (...x: Parameters<F>) => string;
  f: F;
  read: (key: string) => ReturnType<F>;
  write: (key: string, value: Awaited<ReturnType<F>>) => Promise<void>;
};

type Cache<Output> = Record<string, Output>;

const newCache = <Output>(): Cache<Output> => ({});

const makeLocalReadWrite = <Output>(name: string) => {
  let cache: null | Cache<Output> = null;
  const getCache = () =>
    cache ? Promise.resolve(cache) : readFileWithDefault(
      () => serialize(newCache<Output>()),
      pathToCache(name),
    )
      .then((x) => x.toString())
      .then(deserialize<Output>)
      .then((newCache) => {
        cache = newCache;
        return newCache;
      });
  return {
    read: (key: string) =>
      getCache().then((cache: Cache<Output>) =>
        key in cache ? cache[key] : Promise.reject()
      ),
    write: async (key: string, value: Output) => {
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

const abstractCache = <F extends Func>({
  key,
  f,
  read,
  write,
}: AbstractCacheParams<F>): F =>
  ((...x: Parameters<F>) => {
    const keyResult = key(...x);
    return read(keyResult).catch(() =>
      f(...x).then((y) => {
        enrollPromise(write(keyResult, y));
        return y;
      })
    );
  }) as F;

export const waitAllWrites = () => Promise.all(writePromises);

const inputToCacheKey =
  // deno-lint-ignore no-explicit-any
  <Args extends any[]>(secret: string) => (...x: Args): string =>
    hash(jsonStableStringify(x) + secret);

type MemParams = { ttl?: number };

export const memCache = ({ ttl }: MemParams) => <F extends Func>(f: F) => {
  const keyToValue: Record<string, Awaited<ReturnType<F>>> = {};
  const keyToTimestamp: Record<string, number> = {};
  return abstractCache({
    key: inputToCacheKey<Parameters<F>>(""),
    f,
    // @ts-expect-error Promise<Awaited<Awaited<X>>> is just Promise<X>
    read: (key: string) => {
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
    write: (key: string, value: Awaited<ReturnType<F>>) => {
      keyToValue[key] = value;
      keyToTimestamp[key] = Date.now();
      return Promise.resolve();
    },
  });
};

const localCache = ({ cacheId }: LocalCacheParams) => <F extends Func>(f: F) =>
  // @ts-expect-error Promise+Awaited = nothing
  abstractCache({
    key: inputToCacheKey<Parameters<F>>(""),
    f,
    ...makeLocalReadWrite<Awaited<ReturnType<F>>>(cacheId),
  });

// deno-lint-ignore no-explicit-any
type ServerParams = any;

const callAPI = (
  url: string,
  token: string,
  method: "set" | "get",
  params: ServerParams,
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
  ({ cacheId, url, token, ttl }: CloudCacheParams) =>
  (key: string, value: CachedFunctionOutput) =>
    callAPI(
      assertString(url, urlParamMissing),
      assertString(token, tokenParamMissing),
      "set",
      { key, value, ttl, cacheId },
    );

const getRemote =
  ({ url, token, cacheId }: CloudCacheParams) => (key: string) =>
    callAPI(
      assertString(url, urlParamMissing),
      assertString(token, tokenParamMissing),
      "get",
      { key, cacheId },
    );

export type CacheParams = LocalCacheParams | CloudCacheParams;

type LocalCacheParams = { cacheId: string };

type CloudCacheParams = {
  cacheId: string;
  token: string;
  url: string;
  ttl?: number;
  encryptionKey?: string;
};

export const cache = (params: CacheParams) =>
  "token" in params ? cloudCache(params) : localCache(params);

const cloudCache = (params: CloudCacheParams) => <F extends Func>(f: F) =>
  abstractCache({
    key: inputToCacheKey<Parameters<F>>(params.encryptionKey || ""),
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
        ) as ReturnType<F>,
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
