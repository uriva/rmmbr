import { cloudCache, localCache } from "./index.ts";

import { assertEquals } from "https://deno.land/std@0.174.0/testing/asserts.ts";
import { config } from "https://deno.land/x/dotenv@v3.2.2/mod.ts";
import { connect } from "https://deno.land/x/redis@v0.29.2/mod.ts";

const testCache = async (cacher: any) => {
  let nCalled = 0;
  const f = (x: number) => {
    nCalled++;
    return Promise.resolve(x);
  };
  const fCached = cacher(f);
  await fCached(3);
  await Promise.all([fCached(3), fCached(3), fCached(2), fCached(1)]);
  await cacher(f)(3);
  assertEquals(nCalled, 3);
};

Deno.test("local cache", () => localCache({ id: "some-id" }).then(testCache));

Deno.test("remote cache", async () => {
  const { REDIS_PASSWORD, REDIS_URL, REDIS_PORT, PORT } = config();
  const redisClient = await connect({
    password: REDIS_PASSWORD,
    hostname: REDIS_URL,
    port: REDIS_PORT,
  });
  await redisClient.flushall();
  await redisClient.quit();
  return testCache(
    cloudCache({ token: "some-token", url: "http://localhost:" + PORT }),
  );
});