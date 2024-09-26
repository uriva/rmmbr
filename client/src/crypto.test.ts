import { assertEquals } from "https://deno.land/std@0.174.0/testing/asserts.ts";
import { hash } from "./crypto.ts";

Deno.test("hash stability", () => assertEquals(hash("hello"), "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824"));
