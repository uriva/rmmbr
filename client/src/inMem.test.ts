import { cache } from "./index.ts";
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
