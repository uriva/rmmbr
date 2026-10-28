const distDir = new URL("../dist", import.meta.url).pathname;
await Deno.mkdir(distDir, { recursive: true });

const workerOut = `${distDir}/worker.js`;

const cmd = new Deno.Command("deno", {
  args: [
    "bundle",
    "--minify",
    "--platform",
    "browser",
    "--external",
    "cloudflare:workers",
    "--external",
    "node:*",
    "-o",
    workerOut,
    "server/src/worker.ts",
  ],
  stdout: "inherit",
  stderr: "inherit",
});

const status = await cmd.output();
if (!status.success) {
  Deno.exit(status.code);
}

let code = await Deno.readTextFile(workerOut);

// Strip embedded BPE rank blobs in js-tiktoken
code = code.replace(
  /var [a-zA-Z0-9_$]+="[A-Za-z0-9+/=]{10000,}?";/g,
  (match) => {
    const eqIdx = match.indexOf("=");
    return `${match.slice(0, eqIdx)}="";`;
  },
);

// Zod v4 jitless mode for Cloudflare Workers
code = code.replaceAll(/![a-zA-Z0-9_$]+\.jitless/g, "false");

// Force Gaxios to use native Worker fetch instead of node-fetch
code = code.replaceAll("window.fetch", "globalThis.fetch");
code = code.replaceAll('typeof window<"u"&&!!window', "true");

const nodeBuiltins = new Set([
  "assert",
  "assert/strict",
  "async_hooks",
  "buffer",
  "child_process",
  "cluster",
  "console",
  "constants",
  "crypto",
  "dgram",
  "diagnostics_channel",
  "dns",
  "dns/promises",
  "domain",
  "events",
  "fs",
  "fs/promises",
  "http",
  "http2",
  "https",
  "inspector",
  "module",
  "net",
  "os",
  "path",
  "path/posix",
  "path/win32",
  "perf_hooks",
  "process",
  "punycode",
  "querystring",
  "readline",
  "repl",
  "stream",
  "stream/consumers",
  "stream/promises",
  "stream/web",
  "string_decoder",
  "sys",
  "timers",
  "timers/promises",
  "tls",
  "tty",
  "url",
  "util",
  "util/types",
  "v8",
  "vm",
  "wasi",
  "worker_threads",
  "zlib",
]);

code = code.replace(
  /\bfrom\s*["']([^"']+)["']/g,
  (match, spec) => {
    if (nodeBuiltins.has(spec)) return `from "node:${spec}"`;
    return match;
  },
);

code = code.replace(
  /throw Error\(`Dynamic require of "\$\{[a-zA-Z0-9_$]+\}" is not supported`\)/g,
  "return globalThis.__cf_safe_require(arguments[0])",
);

const header = `import { env as __cf_env } from "cloudflare:workers";
import { createRequire as __cf_createRequire } from "node:module";
const __cf_require = __cf_createRequire("file:///worker.js");
globalThis.__dirname = "/";
globalThis.__filename = "/worker.js";
if (typeof globalThis.process === "undefined") {
  globalThis.process = { env: {} };
}
globalThis.process.env ??= {};
if (__cf_env && typeof __cf_env === "object") {
  for (const [k, v] of Object.entries(__cf_env)) {
    if (typeof v === "string") globalThis.process.env[k] = v;
  }
}
const __cf_safe_require = function(spec) {
  if (spec === "node:process" || spec === "process") return globalThis.process;
  try {
    const mod = __cf_require(spec);
    return mod ?? {};
  } catch (_err) {
    return {};
  }
};
globalThis.require = __cf_safe_require;
globalThis.__cf_safe_require = __cf_safe_require;
if (typeof globalThis.addEventListener === "undefined") {
  globalThis.addEventListener = () => {};
}
if (typeof globalThis.fetch === "function") {
  globalThis.fetch = globalThis.fetch.bind(globalThis);
}
if (typeof globalThis.clearTimeout === "function") {
  globalThis.clearTimeout = globalThis.clearTimeout.bind(globalThis);
}
if (typeof globalThis.clearInterval === "function") {
  globalThis.clearInterval = globalThis.clearInterval.bind(globalThis);
}
if (typeof globalThis.crypto !== "undefined" && globalThis.crypto.randomUUID) {
  const __orig_randomUUID = globalThis.crypto.randomUUID.bind(globalThis.crypto);
  let __uuid_counter = 0;
  globalThis.crypto.randomUUID = function() {
    try {
      return __orig_randomUUID();
    } catch (_err) {
      __uuid_counter++;
      return "00000000-0000-4000-8000-" + String(__uuid_counter).padStart(12, "0");
    }
  };
}
if (typeof globalThis.crypto !== "undefined" && globalThis.crypto.getRandomValues) {
  const __orig_getRandomValues = globalThis.crypto.getRandomValues.bind(globalThis.crypto);
  let __rv_counter = 1;
  globalThis.crypto.getRandomValues = function(arr) {
    try {
      return __orig_getRandomValues(arr);
    } catch (_err) {
      if (arr && typeof arr.length === "number") {
        for (let i = 0; i < arr.length; i++) {
          __rv_counter = (__rv_counter * 1664525 + 1013904223) >>> 0;
          arr[i] = __rv_counter & 0xff;
        }
      }
      return arr;
    }
  };
}
if (typeof globalThis.setTimeout !== "undefined") {
  const __orig_setTimeout = globalThis.setTimeout.bind(globalThis);
  globalThis.setTimeout = function(fn, ms, ...args) {
    try {
      return __orig_setTimeout(fn, ms, ...args);
    } catch (_err) {
      return 0;
    }
  };
}
if (typeof globalThis.setInterval !== "undefined") {
  const __orig_setInterval = globalThis.setInterval.bind(globalThis);
  globalThis.setInterval = function(fn, ms, ...args) {
    try {
      return __orig_setInterval(fn, ms, ...args);
    } catch (_err) {
      return 0;
    }
  };
}
if (typeof globalThis.Deno === "undefined") {
  globalThis.Deno = {
    env: {
      get(key) {
        return globalThis.process?.env?.[key] ?? __cf_env?.[key];
      },
      set(key, value) {
        if (globalThis.process?.env) globalThis.process.env[key] = String(value);
      },
      delete(key) {
        if (globalThis.process?.env) delete globalThis.process.env[key];
      },
      has(key) {
        return (globalThis.process?.env?.[key] ?? __cf_env?.[key]) !== undefined;
      },
      toObject() {
        return { ...(__cf_env || {}), ...(globalThis.process?.env || {}) };
      },
    },
    args: [],
    version: { deno: "2.0.0", v8: "0.0.0", typescript: "5.0.0" },
    build: {
      target: "x86_64-unknown-linux-gnu",
      arch: "x86_64",
      os: "linux",
      vendor: "unknown",
      env: "gnu",
    },
    errors: {
      NotFound: class NotFound extends Error {},
      AlreadyExists: class AlreadyExists extends Error {},
      PermissionDenied: class PermissionDenied extends Error {},
    },
    serve: () => ({ finished: new Promise(() => {}) }),
    cron: () => {},
    readFile: async () => new Uint8Array(),
    readTextFile: async () => "",
    readTextFileSync: () => "",
    writeFile: async () => {},
    writeTextFile: async () => {},
    mkdir: async () => {},
    remove: async () => {},
    stat: async () => ({ isFile: false, isDirectory: false }),
    exit: (code) => {
      throw new Error("Deno.exit(" + code + ")");
    },
  };
}
`;

code = header + "\n" + code;

await Deno.writeTextFile(workerOut, code);
console.log(
  `Successfully built and patched ${workerOut} for Cloudflare Workers (${
    Math.round(code.length / 1024)
  } KB)`,
);
