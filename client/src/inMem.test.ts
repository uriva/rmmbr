import { cache, memCache } from "./index.ts";
import { assertEquals } from "@std/testing/asserts";

Deno.test("in-flight request coalescing and maxInMemKeys", async () => {
  let calls = 0;
  const slowFn = async (x: number) => {
    calls++;
    await new Promise((r) => setTimeout(r, 50));
    return x * 2;
  };

  const cachedFn = cache({ cacheId: `test-coalesce-${Date.now()}`, maxInMemKeys: 2 })(slowFn);

  // 1. In-flight coalescing: 3 concurrent calls for input 5 should only execute inner function once
  const [res1, res2, res3] = await Promise.all([
    cachedFn(5),
    cachedFn(5),
    cachedFn(5),
  ]);
  assertEquals(res1, 10);
  assertEquals(res2, 10);
  assertEquals(res3, 10);
  assertEquals(calls, 1);

  // 2. Subsequent call reads from in-memory cache
  const res4 = await cachedFn(5);
  assertEquals(res4, 10);
  assertEquals(calls, 1);

  // 3. Populate up to limit (maxInMemKeys: 2)
  await cachedFn(6); // in memory: 5, 6
  assertEquals(calls, 2);

  await cachedFn(7); // in memory evicted 5, now: 6, 7
  assertEquals(calls, 3);

  // 4. Accessing 5 again reads from file cache, so inner function calls remains 3
  const res5 = await cachedFn(5);
  assertEquals(res5, 10);
  assertEquals(calls, 3);
});

Deno.test("maxInMemKeys: 0 disables in-memory caching while keeping in-flight coalescing", async () => {
  let calls = 0;
  const slowFn = async (x: number) => {
    calls++;
    await new Promise((r) => setTimeout(r, 30));
    return x + 10;
  };

  const cachedFn = cache({ cacheId: `test-no-inmem-${Date.now()}`, maxInMemKeys: 0 })(slowFn);

  // Concurrent calls still coalesce into 1 execution
  const [r1, r2] = await Promise.all([cachedFn(1), cachedFn(1)]);
  assertEquals(r1, 11);
  assertEquals(r2, 11);
  assertEquals(calls, 1);

  // Once settled, maxInMemKeys: 0 means in-memory cache was skipped.
  // Next call reads from persistent storage (calls remains 1 if found in local file).
  const r3 = await cachedFn(1);
  assertEquals(r3, 11);
  assertEquals(calls, 1);
});

Deno.test("memCache evicts least recently used entries beyond maxInMemKeys", async () => {
  let calls = 0;
  const fn = memCache({ maxInMemKeys: 3 })((x: number) => {
    calls++;
    return Promise.resolve(x * 2);
  });

  assertEquals(await fn(1), 2);
  assertEquals(await fn(2), 4);
  assertEquals(await fn(3), 6);
  assertEquals(await fn(4), 8);
  assertEquals(calls, 4);

  // 1 was evicted from the backing store, so it has to be recomputed.
  assertEquals(await fn(1), 2);
  assertEquals(calls, 5);
});

Deno.test("memCache refreshes recency on read, not just on write", async () => {
  let calls = 0;
  const fn = memCache({ maxInMemKeys: 2 })((x: number) => {
    calls++;
    return Promise.resolve(x * 2);
  });

  await fn(1);
  await fn(2);
  assertEquals(await fn(1), 2);
  assertEquals(calls, 2);

  // True LRU evicts 2 (least recently used); insertion-order eviction would
  // evict 1 and force a recompute below.
  assertEquals(await fn(3), 6);
  assertEquals(calls, 3);
  assertEquals(await fn(1), 2);
  assertEquals(calls, 3);
});

Deno.test("memCache bounds the backing store by default", async () => {
  let calls = 0;
  const fn = memCache({})((x: number) => {
    calls++;
    return Promise.resolve(x);
  });

  await Promise.all(Array.from({ length: 120 }, (_, i) => fn(i)));
  assertEquals(calls, 120);

  await fn(0);
  assertEquals(calls, 121);
});

Deno.test("memCache drops write-once entries once ttl passes", async () => {
  let calls = 0;
  const fn = memCache({ ttl: 0.05, maxInMemKeys: 100 })((x: number) => {
    calls++;
    return Promise.resolve(x * 2);
  });

  assertEquals(await fn(1), 2);
  assertEquals(calls, 1);

  // Let the ttl lapse. Key 1 is never read again, so only the expiry sweep
  // triggered by an unrelated write can reclaim it.
  await new Promise((resolve) => setTimeout(resolve, 120));
  assertEquals(await fn(2), 4);
  assertEquals(calls, 2);

  assertEquals(await fn(1), 2);
  assertEquals(calls, 3);
});

Deno.test("memCache keeps entries that are still within ttl", async () => {
  let calls = 0;
  const fn = memCache({ ttl: 60, maxInMemKeys: 100 })((x: number) => {
    calls++;
    return Promise.resolve(x * 2);
  });

  assertEquals(await fn(1), 2);
  await new Promise((resolve) => setTimeout(resolve, 20));
  assertEquals(await fn(1), 2);
  assertEquals(calls, 1);
});

Deno.test("memCache does not cache rejections", async () => {
  let calls = 0;
  const fn = memCache({ maxInMemKeys: 10 })((x: number) => {
    calls++;
    return calls === 1
      ? Promise.reject(new Error("boom"))
      : Promise.resolve(x * 2);
  });

  await fn(1).catch(() => null);
  assertEquals(await fn(1), 2);
  assertEquals(calls, 2);
});
