import {
  bufferToHex,
  hexToBuffer,
} from "hextools";
import { jsonStringify } from "stable_stringify";
import sjcl from "sjcl";
import { decode as base64UrlDecode } from "@std/encoding/base64url";

const algo = "AES-CBC";

const getKey = (scope: "encrypt" | "decrypt", key: string) =>
  crypto.subtle.importKey("raw", base64UrlDecode(key), algo, true, [scope]);

const sha256 = (x: string) => sjcl.codec.hex.fromBits(sjcl.hash.sha256.hash(x));

export const encrypt =
  (key: string) => async (plainText: string): Promise<Encrypted> => {
    const iv = crypto.getRandomValues(new Uint8Array(16));
    return {
      cipher: bufferToHex(
        await crypto.subtle.encrypt(
          { name: algo, iv },
          await getKey("encrypt", key),
          new TextEncoder().encode(plainText),
        ),
      ),
      iv: bufferToHex(iv.buffer),
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
    sha256(jsonStableStringify(customKeyFn ? customKeyFn(...x) : x) + secret);
