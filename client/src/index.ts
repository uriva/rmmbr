import {
  type CustomKeyFn,
  decrypt,
  encrypt,
  inputToCacheKey,
  jsonStableStringify,
} from "./crypto.ts";

import { dirname } from "@std/path";

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
export type Func = (...x: any[]) => Promise<CachedFunctionOutput>;

/** A function that wraps an async function with caching behavior, preserving its type signature. */
export type CacheWrapper = <F extends Func>(f: F) => F;

type AbstractCacheParams<F extends Func> = {
  key: (...x: Parameters<F>) => string;
  f: F;
  read: (key: string) => ReturnType<F>;
  write: (key: string, value: Awaited<ReturnType<F>>) => Promise<void>;
  forceWrite?: boolean;
  maxInMemKeys?: number;
};

type Cache<Output> = Record<string, Output>;

const newCache = <Output>(): Cache<Output> => ({});

const makeLocalReadWrite = <Output>(name: string): {
  read: (key: string) => Promise<Output>;
  write: (key: string, value: Output) => Promise<void>;
} => {
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
        key in cache
          ? cache[key]
          : Promise.reject(new Error("key not in cache"))
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
  forceWrite,
  maxInMemKeys = 100,
}: AbstractCacheParams<F>): F => {
  const inMemory = new Map<string, ReturnType<F>>();
  const inFlight = new Map<string, ReturnType<F>>();

  const setInMemory = (k: string, promise: ReturnType<F>) => {
    if (maxInMemKeys <= 0) return;
    if (inMemory.has(k)) {
      inMemory.delete(k);
    }
    inMemory.set(k, promise);
    while (inMemory.size > maxInMemKeys) {
      const oldest = inMemory.keys().next().value;
      if (oldest !== undefined) inMemory.delete(oldest);
    }
  };

  const getFromMemory = (k: string): ReturnType<F> | undefined => {
    if (!inMemory.has(k)) return undefined;
    const promise = inMemory.get(k)!;
    inMemory.delete(k);
    inMemory.set(k, promise);
    return promise;
  };

  return ((...x: Parameters<F>) => {
    const keyResult = key(...x);
    if (!forceWrite) {
      const cached = getFromMemory(keyResult);
      if (cached) return cached;
      if (inFlight.has(keyResult)) {
        return inFlight.get(keyResult)!;
      }
    }

    const promise = (
      forceWrite
        ? Promise.reject(new Error("forced write is on"))
        : read(keyResult)
    )
      .then((value) => {
        const resolved = Promise.resolve(value) as ReturnType<F>;
        setInMemory(keyResult, resolved);
        return value;
      })
      .catch(() =>
        f(...x).then((y) => {
          enrollPromise(
            write(keyResult, y).catch((e) => {
              console.error("failed writing to rmmbr cache", e);
            }),
          );
          const resolved = Promise.resolve(y) as ReturnType<F>;
          setInMemory(keyResult, resolved);
          return y;
        })
      )
      .finally(() => {
        inFlight.delete(keyResult);
      }) as ReturnType<F>;

    if (!forceWrite) {
      inFlight.set(keyResult, promise);
    }
    return promise;
  }) as unknown as F;
};

/** Waits for all pending cache write operations to complete. */
export const waitAllWrites = async (): Promise<void> => {
  while (writePromises.size) {
    await Promise.all(Array.from(writePromises));
  }
};

type MemParams = {
  ttl?: number;
  customKeyFn?: CustomKeyFn;
  forceWrite?: boolean;
};

/** In-memory cache with optional TTL (in seconds). */
export const memCache =
  ({ ttl, customKeyFn, forceWrite }: MemParams): CacheWrapper =>
  <F extends Func>(f: F): F => {
    const keyToValue: Record<string, Awaited<ReturnType<F>>> = {};
    const keyToTimestamp: Record<string, number> = {};
    return abstractCache({
      key: inputToCacheKey<Parameters<F>>("", customKeyFn),
      f,
      // @ts-expect-error Promise<Awaited<Awaited<X>>> is just Promise<X>
      read: (key: string) => {
        if (!(key in keyToValue)) {
          return Promise.reject(new Error());
        }
        if (ttl && Date.now() - keyToTimestamp[key] > ttl * 1000) {
          delete keyToTimestamp[key];
          delete keyToValue[key];
          return Promise.reject(new Error());
        }
        return Promise.resolve(keyToValue[key]);
      },
      write: (key: string, value: Awaited<ReturnType<F>>) => {
        keyToValue[key] = value;
        keyToTimestamp[key] = Date.now();
        return Promise.resolve();
      },
      forceWrite,
    });
  };

const localCache =
  ({ cacheId, customKeyFn, forceWrite, maxInMemKeys }: LocalCacheParams): CacheWrapper =>
  <F extends Func>(f: F): F =>
    // @ts-expect-error Promise+Awaited = nothing
    abstractCache({
      forceWrite,
      maxInMemKeys,
      key: inputToCacheKey<Parameters<F>>("", customKeyFn),
      f,
      ...makeLocalReadWrite<Awaited<ReturnType<F>>>(cacheId),
    });

// deno-lint-ignore no-explicit-any
type ServerParams = any;

const defaultTimeoutMs = 1000;

const resolveTimeoutMs = (params: CloudCacheParams): number =>
  params.timeoutMs ??
  (params.timeout !== undefined ? params.timeout * 1000 : defaultTimeoutMs);

const callAPI = (
  url: string,
  token: string,
  method: "set" | "get",
  params: ServerParams,
  timeoutMs: number = defaultTimeoutMs,
): Promise<CachedFunctionOutput> =>
  fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ method, params }),
    signal: AbortSignal.timeout(timeoutMs),
  }).then((x) => {
    if (!x.ok) {
      throw new Error(`rmmbr ${method} HTTP ${x.status} ${x.statusText}`);
    }
    return x.text();
  }).then(parseWithDiagnostics(method));

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
  (params: CloudCacheParams) =>
  (key: string, value: CachedFunctionOutput): Promise<CachedFunctionOutput> =>
    callAPI(
      assertString(params.url, urlParamMissing),
      assertString(params.token, tokenParamMissing),
      "set",
      { key, value, ttl: params.ttl, cacheId: params.cacheId },
      resolveTimeoutMs(params),
    );

const getRemote = (params: CloudCacheParams) => (key: string) =>
  callAPI(
    assertString(params.url, urlParamMissing),
    assertString(params.token, tokenParamMissing),
    "get",
    { key, cacheId: params.cacheId },
    resolveTimeoutMs(params),
  );

export type CacheParams = LocalCacheParams | CloudCacheParams;

type LocalCacheParams = {
  cacheId: string;
  forceWrite?: boolean;
  customKeyFn?: CustomKeyFn;
  maxInMemKeys?: number;
};

type CloudCacheParams = {
  cacheId: string;
  token: string;
  url: string;
  ttl?: number;
  encryptionKey?: string;
  customKeyFn?: CustomKeyFn;
  forceWrite?: boolean;
  maxInMemKeys?: number;
  timeout?: number;
  timeoutMs?: number;
};

/** Cache function results locally (file system) or remotely (rmmbr server), with optional encryption. */
export const cache = (params: CacheParams): CacheWrapper =>
  "token" in params ? cloudCache(params) : localCache(params);

const cloudCache =
  (params: CloudCacheParams): CacheWrapper => <F extends Func>(f: F): F =>
    abstractCache({
      forceWrite: params.forceWrite,
      maxInMemKeys: params.maxInMemKeys,
      key: inputToCacheKey<Parameters<F>>(
        params.encryptionKey || "",
        params.customKeyFn,
      ),
      f,
      read: (key) =>
        getRemote(params)(key)
          .then((value) =>
            value
              ? params.encryptionKey
                ? decrypt(params.encryptionKey!)(value).then(
                  JSON.parse,
                )
                : value
              : Promise.reject(new Error())
          ) as ReturnType<F>,
      write: params.encryptionKey
        ? async (key, value) =>
          setRemote(params)(
            key,
            await encrypt(params.encryptionKey!)(
              jsonStableStringify(value),
            ),
          )
        : setRemote(params),
    });

// --- KV API ---

const parseWithDiagnostics =
  (method: string) => (text: string): CachedFunctionOutput => {
    try {
      return JSON.parse(text);
    } catch (e) {
      throw new Error(
        `rmmbr ${method} response not valid JSON. body length=${text.length}, body=${
          JSON.stringify(text.slice(0, 500))
        }, original error: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  };

const kvCallAPI = (
  url: string,
  token: string,
  method: "kv:get" | "kv:set" | "kv:del" | "kv:mget",
  params: ServerParams,
  timeoutMs: number = defaultTimeoutMs,
): Promise<CachedFunctionOutput> =>
  fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ method, params }),
    signal: AbortSignal.timeout(timeoutMs),
  }).then((x) => {
    if (!x.ok) {
      throw new Error(`rmmbr ${method} HTTP ${x.status} ${x.statusText}`);
    }
    return x.text();
  }).then(parseWithDiagnostics(method));

const kvGetRaw = (params: CloudCacheParams) => (key: string) =>
  kvCallAPI(
    assertString(params.url, urlParamMissing),
    assertString(params.token, tokenParamMissing),
    "kv:get",
    { key, cacheId: params.cacheId },
    resolveTimeoutMs(params),
  );

const kvSetRaw =
  (params: CloudCacheParams) => (key: string, value: CachedFunctionOutput) =>
    kvCallAPI(
      assertString(params.url, urlParamMissing),
      assertString(params.token, tokenParamMissing),
      "kv:set",
      { key, value, ttl: params.ttl, cacheId: params.cacheId },
      resolveTimeoutMs(params),
    );

const kvDelRaw = (params: CloudCacheParams) => (key: string) =>
  kvCallAPI(
    assertString(params.url, urlParamMissing),
    assertString(params.token, tokenParamMissing),
    "kv:del",
    { key, cacheId: params.cacheId },
    resolveTimeoutMs(params),
  );

const kvMgetRaw = (params: CloudCacheParams) => (keys: string[]) =>
  kvCallAPI(
    assertString(params.url, urlParamMissing),
    assertString(params.token, tokenParamMissing),
    "kv:mget",
    { keys, cacheId: params.cacheId },
    resolveTimeoutMs(params),
  );

const decryptValue = (encryptionKey: string) => (value: unknown) =>
  value && typeof value === "object" && value !== null &&
    "cipher" in value && "iv" in value
    ? decrypt(encryptionKey)(value as { cipher: string; iv: string }).then(
      JSON.parse,
    )
    : Promise.resolve(value);

const encryptValue = (encryptionKey: string) => (value: unknown) =>
  encrypt(encryptionKey)(jsonStableStringify(value));

export const kvGet =
  (params: CloudCacheParams) => (key: string): Promise<unknown> =>
    kvGetRaw(params)(key).then((value) =>
      value && params.encryptionKey
        ? decryptValue(params.encryptionKey)(value)
        : value
    ).catch((e) => {
      console.error("rmmbr kv:get failed; returning cache miss", e);
      return null;
    });

export const kvSet =
  (params: CloudCacheParams) => (key: string, value: unknown): Promise<void> =>
    (params.encryptionKey
      ? encryptValue(params.encryptionKey)(value).then((encrypted) =>
        kvSetRaw(params)(key, encrypted)
      )
      : kvSetRaw(params)(key, value))
      .then(() => {})
      .catch((e) => {
        console.error("rmmbr kv:set failed", e);
      });

export const kvDel =
  (params: CloudCacheParams) => (key: string): Promise<void> =>
    kvDelRaw(params)(key).then(() => {}).catch((e) => {
      console.error("rmmbr kv:del failed", e);
    });

export const kvMget =
  (params: CloudCacheParams) => (keys: string[]): Promise<unknown[]> =>
    kvMgetRaw(params)(keys).then((values) => {
      const parsed = (values as (string | null)[]).map((v) =>
        v ? JSON.parse(v) : null
      );
      return params.encryptionKey
        ? Promise.all(parsed.map(decryptValue(params.encryptionKey)))
        : parsed;
    }).catch((e) => {
      console.error("rmmbr kv:mget failed; returning cache misses", e);
      return keys.map(() => null);
    });
