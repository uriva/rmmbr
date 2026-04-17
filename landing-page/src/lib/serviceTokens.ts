const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const randomString = (length: number) => {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => ALPHABET[b % ALPHABET.length])
    .join("");
};

const bytesToHex = (bytes: Uint8Array) =>
  Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

export const generateServiceToken = () =>
  `rmmbr_sk_${randomString(6)}_${randomString(28)}`;

export const tokenPrefix = (token: string) => token.slice(0, 16);

export const sha256Hex = async (value: string) => {
  const encoded = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return bytesToHex(new Uint8Array(digest));
};
