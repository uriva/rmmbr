import {
  bufferToHex,
  hexToBuffer,
} from "https://deno.land/x/hextools@v1.0.0/mod.ts";
import { Buffer } from "node:buffer";
import { sha256 } from "npm:js-sha256";

const algo = "AES-CBC";

const getKey = (scope: "encrypt" | "decrypt", key: string) =>
  crypto.subtle.importKey("raw", Buffer.from(key, "base64url"), algo, true, [
    scope,
  ]);

export const hash = (x: string): string => {
  const hasher = sha256.create();
  hasher.update(x);
  return hasher.hex();
};

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
