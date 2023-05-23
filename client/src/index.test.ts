import { cloudCache, localCache, memCache, waitAllWrites } from "./index.ts";

import { assertEquals } from "https://deno.land/std@0.174.0/testing/asserts.ts";
import { config } from "https://deno.land/x/dotenv@v3.2.2/mod.ts";
import { connect } from "https://deno.land/x/redis@v0.29.2/mod.ts";

const sleep = (seconds: number) =>
  new Promise((resolve) => setTimeout(resolve, seconds * 1000));

const testCache =
  (instanceSpecificCache: boolean, expiresAfter2Seconds: boolean) =>
  async (cacher: any) => {
    let nCalled = 0;
    const f = (x: number) => {
      nCalled++;
      return Promise.resolve(x);
    };
    const fCached = cacher(f);

    assertEquals(await fCached(3), 3);
    const results = [];
    for (const n of [3, 3, 2, 1]) {
      await waitAllWrites();
      results.push(await fCached(n));
    }
    assertEquals(
      results,
      [3, 3, 2, 1],
    );
    assertEquals(await cacher(f)(3), 3);
    assertEquals(nCalled, instanceSpecificCache ? 4 : 3);
    nCalled = 0;
    await sleep(2);
    assertEquals(await fCached(3), 3);
    assertEquals(nCalled, expiresAfter2Seconds ? 1 : 0);
  };

const testVariadic = async (cacher: any) => {
  const f2 = (x: number, y: string) => {
    return Promise.resolve(x.toString() + y);
  };
  const f3 = (x: number, y: string, z: boolean) => {
    return Promise.resolve(x.toString().concat(y, z ? "✅" : "❌"));
  };

  const f2Cached = cacher(f2);
  const f3Cached = cacher(f3);
  assertEquals(await f2Cached(2, " params"), "2 params");
  assertEquals(await f3Cached(3, " params ", true), "3 params ✅");
};

Deno.test("local cache", () =>
  testCache(false, false)(localCache({ id: "some-id" })));

Deno.test("memory cache", () => testCache(true, false)(memCache({})));
Deno.test("memory cache ttl", () =>
  testCache(true, true)(memCache({ ttl: 1 })));

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
  )(
    cloudCache({
      token: "some-token",
      cacheId: "some name for the cache",
      url: mockBackendUrl,
    }),
  );
});

Deno.test("remote cache encryption", async () => {
  await cleanRedis();
  return testCache(
    false,
    false,
  )(
    cloudCache({
      url: mockBackendUrl,
      token: "some-token",
      cacheId: "some name for the cache",
      encryptionKey: "cddn22Nf1tWB1f5vbJCxl3ix5vCFKxXAcwQbFMtRdV4=",
    }),
  );
});

Deno.test("remote cache timeout", async () => {
  await cleanRedis();
  return testCache(
    false,
    true,
  )(
    cloudCache({
      url: mockBackendUrl,
      token: "some-token",
      cacheId: "some name for the cache",
      ttl: 1,
    }),
  );
});

Deno.test("local variadic cache", () =>
  testVariadic(localCache({ id: "some-id" })));

Deno.test("memory variadic cache", () => testVariadic(memCache({})));

Deno.test("remote variadic cache", async () => {
  await cleanRedis();
  return testVariadic(
    cloudCache({
      token: "some-token",
      cacheId: "some name for the cache",
      url: mockBackendUrl,
    }),
  );
});
