import { cloudCache, localCache, memCache } from "./index.ts";

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
    assertEquals(
      await Promise.all([fCached(3), fCached(3), fCached(2), fCached(1)]),
      [3, 3, 2, 1],
    );
    assertEquals(await cacher(f)(3), 3);
    assertEquals(nCalled, instanceSpecificCache ? 4 : 3);
    nCalled = 0;
    await sleep(2);
    assertEquals(await fCached(3), 3);
    assertEquals(nCalled, expiresAfter2Seconds ? 1 : 0);
  };

Deno.test("local cache", () =>
  testCache(false, false)(localCache({ id: "some-id" })),
);

Deno.test("memory cache", () => testCache(true, false)(memCache));

const cleanRedis = async () => {
  const { REDIS_PASSWORD, REDIS_URL, REDIS_PORT } = config();
  const redisClient = await connect({
    password: REDIS_PASSWORD,
    hostname: REDIS_URL,
    port: REDIS_PORT,
  });
  await redisClient.flushall();
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
      encryptionKey: "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
      token: "some-token",
      url: mockBackendUrl,
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
      ttl: 1,
      token: "some-token",
      url: mockBackendUrl,
    }),
  );
});
