import { cache, type CacheParams, waitAllWrites } from "./index.ts";

import { assertEquals } from "https://deno.land/std@0.174.0/testing/asserts.ts";
import { config } from "https://deno.land/x/dotenv@v3.2.2/mod.ts";
import { connect } from "https://deno.land/x/redis@v0.29.2/mod.ts";

const sleep = (seconds: number) =>
  new Promise((resolve) => setTimeout(resolve, seconds * 1000));

const testCache = async (
  instanceSpecificCache: boolean,
  expiresAfter2Seconds: boolean,
  cacheParams: CacheParams,
) => {
  let i = 0;
  for (const innerLogic of [(x: any) => ({ result: x }), (x: any) => x]) {
    await testCacheHelper(
      { ...cacheParams, cacheId: cacheParams.cacheId + i },
      innerLogic,
      expiresAfter2Seconds,
      instanceSpecificCache,
    );
    i++;
  }
};

const testCacheHelper = async (
  cacheParams: CacheParams,
  innerLogic: (x: any) => any,
  expiresAfter2Seconds: boolean,
  instanceSpecificCache: boolean,
) => {
  const cacher = cache(cacheParams);
  let nCalled = 0;
  const f = (x: number) => {
    nCalled++;
    return Promise.resolve(innerLogic(x));
  };
  const fCached = cacher(f);
  assertEquals(await fCached(3), innerLogic(3));
  await waitAllWrites();
  const results = [];
  const inputs = [3, 3, 2, 1];
  for (const n of inputs) {
    results.push(await fCached(n));
    await waitAllWrites();
  }
  assertEquals(results, inputs.map(innerLogic));
  assertEquals(await cacher(f)(3), innerLogic(3));
  await waitAllWrites();
  assertEquals(nCalled, instanceSpecificCache ? 4 : 3);
  nCalled = 0;
  await sleep(2);
  assertEquals(await fCached(3), innerLogic(3));
  await waitAllWrites();
  assertEquals(nCalled, expiresAfter2Seconds ? 1 : 0);
};

const testVariadic = async (cacher: any) => {
  const f2 = (x: number, y: string) => Promise.resolve(x.toString() + y);
  const f3 = (x: number, y: string, z: boolean) =>
    Promise.resolve(x.toString().concat(y, z ? "✅" : "❌"));
  const f2Cached = cacher(f2);
  const f3Cached = cacher(f3);
  assertEquals(await f2Cached(2, " params"), "2 params");
  await waitAllWrites();
  assertEquals(await f3Cached(3, " params ", true), "3 params ✅");
  await waitAllWrites();
};

Deno.test("local cache", () => testCache(false, false, { cacheId: "some-id" }));

Deno.test("custom key function", async () => {
  let nCalled = 0;
  const f = cache({
    cacheId: "some id",
    customKeyFn: (x, y) => x % 2 === 0,
  })((x: number, y: number) => {
    nCalled++;
    return Promise.resolve(x);
  });
  await f(1, 1);
  await waitAllWrites();
  await f(1, 1); // should not cause a call
  assertEquals(nCalled, 1);
  await f(3, 1); // should also not cause a call
  assertEquals(nCalled, 1);
  await f(2, 1);
  assertEquals(nCalled, 2);
  await waitAllWrites();
});

const cleanRedis = async () => {
  const { REDIS_PASSWORD, REDIS_URL, REDIS_PORT } = config();
  const redisClient = await connect({
    password: REDIS_PASSWORD,
    hostname: REDIS_URL,
    port: REDIS_PORT,
  });
  await redisClient.flushall();
  await redisClient.set("api-token:some-token", "testing|my-uid");
  await redisClient.quit();
};

const mockBackendUrl = "http://localhost:" + config().PORT;

Deno.test("remote cache", async () => {
  await cleanRedis();
  return testCache(
    false,
    false,
    {
      token: "some-token",
      cacheId: "some name for the cache",
      url: mockBackendUrl,
    },
  );
});

Deno.test("remote cache encryption", async () => {
  await cleanRedis();
  return testCache(
    false,
    false,
    {
      url: mockBackendUrl,
      token: "some-token",
      cacheId: "some name for the cache",
      encryptionKey: "cddn22Nf1tWB1f5vbJCxl3ix5vCFKxXAcwQbFMtRdV4=",
    },
  );
});

Deno.test("remote cache timeout", async () => {
  await cleanRedis();
  return testCache(
    false,
    true,
    {
      url: mockBackendUrl,
      token: "some-token",
      cacheId: "some name for the cache",
      ttl: 1,
    },
  );
});

Deno.test("local variadic cache", () =>
  testVariadic(cache({ cacheId: "some-id" })));

Deno.test("remote variadic cache", async () => {
  await cleanRedis();
  return testVariadic(
    cache({
      token: "some-token",
      cacheId: "some name for the cache",
      url: mockBackendUrl,
    }),
  );
});
