export const bufferToHex = (buffer: ArrayBuffer): string =>
  Array.prototype.map
    .call(new Uint8Array(buffer), (b: number) => b.toString(16).padStart(2, "0"))
    .join("");

export const hexToBuffer = (hex: string): ArrayBuffer => {
  if (hex.length % 2 !== 0) {
    throw new TypeError(
      "Expecting an even number of characters in the hexString",
    );
  }
  const pairs = hex.match(/[\dA-F]{2}/gi);
  const integers = pairs!.map((s) => parseInt(s, 16));
  return new Uint8Array(integers).buffer;
};
