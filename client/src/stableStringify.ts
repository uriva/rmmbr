// deno-lint-ignore no-explicit-any
export const jsonStringify = (data: any): string | undefined => {
  const seen = new Set();
  return (function stringify(node): string | undefined {
    if (node && node.toJSON && typeof node.toJSON === "function") {
      node = node.toJSON();
    }
    if (node === undefined) return undefined;
    if (node === null) return "null";
    if (typeof node === "number") return isFinite(node) ? "" + node : "null";
    if (typeof node !== "object") return JSON.stringify(node);
    if (Array.isArray(node)) {
      return "[" + node.map((x) => stringify(x) || "null").join(",") + "]";
    }
    if (seen.has(node)) {
      throw new TypeError("Converting circular structure to JSON");
    }
    seen.add(node);
    const out = Object.keys(node)
      .sort()
      .reduce((acc, key) => {
        const value = stringify(node[key]);
        return value ? (acc ? acc + "," : "") + `"${key}":${value}` : acc;
      }, "");
    seen.delete(node);
    return `{${out}}`;
  })(data);
};
