import { assertEquals } from "https://deno.land/std@0.174.0/testing/asserts.ts";
import { inputToCacheKey } from "./crypto.ts";

Deno.test("hash stability", () =>
    assertEquals(
        inputToCacheKey("my secret", undefined)("hello"),
        "413ddc7b60b9f03f95a4091496d05d785478a8b2ac36907c635076879f2d73c3",
    ));
