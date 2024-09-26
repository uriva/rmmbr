import {
  bufferToHex,
  hexToBuffer,
} from "https://deno.land/x/hextools@v1.0.0/mod.ts";
import { jsonStringify } from "https://deno.land/x/stable_stringify@v0.2.1/jsonStringify.ts";

import { decode as base64UrlDecode } from "https://deno.land/std@0.82.0/encoding/base64url.ts";
import { sha256 } from "https://denopkg.com/chiefbiiko/sha256@v1.0.0/mod.ts";

const algo = "AES-CBC";

const getKey = (scope: "encrypt" | "decrypt", key: string) =>
  crypto.subtle.importKey("raw", base64UrlDecode(key), algo, true, [scope]);

const hash = (x: string): string => sha256(x, "utf8", "hex") as string;

export const encrypt =
  (key: string) => async (plainText: string): Promise<Encrypted> => {
    const iv = crypto.getRandomValues(new Uint8Array(16));
    return {
      cipher: bufferToHex(
        new Uint8Array(
          await crypto.subtle.encrypt(
            { name: algo, iv },
            await getKey("encrypt", key),
            new TextEncoder().encode(plainText),
          ),
        ),
      ),
      iv: bufferToHex(iv),
    };
  };

type Encrypted = {
  iv: string;
  cipher: string;
};

export const decrypt = (key: string) => async ({ iv, cipher }: Encrypted) =>
  new TextDecoder().decode(
    new Uint8Array(
      await crypto.subtle.decrypt(
        { name: "AES-CBC", iv: hexToBuffer(iv) },
        await getKey("decrypt", key), // can optimize by factoring this out.
        hexToBuffer(cipher),
      ),
    ),
  );

// deno-lint-ignore no-explicit-any
export type CustomKeyFn = (..._: any[]) => any;

export const jsonStableStringify = <Args>(x: Args) =>
  jsonStringify(x) as string;

export const inputToCacheKey =
  // deno-lint-ignore no-explicit-any
  <Args extends any[]>(secret: string, customKeyFn: CustomKeyFn | undefined) =>
  (...x: Args): string =>
    hash(jsonStableStringify(customKeyFn ? customKeyFn(...x) : x) + secret);
