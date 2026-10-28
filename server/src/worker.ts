import { handleRequest } from "./index.ts";

// deno-lint-ignore no-explicit-any
const syncEnv = (env: Record<string, any>) => {
  // deno-lint-ignore no-explicit-any
  const g = globalThis as any;
  g.process ??= { env: {} };
  g.process.env ??= {};
  for (const [k, v] of Object.entries(env)) {
    if (typeof v === "string") {
      g.process.env[k] = v;
    }
  }
};

export default {
  // deno-lint-ignore no-explicit-any
  async fetch(req: Request, env: Record<string, any>, _ctx: any) {
    syncEnv(env);
    return await handleRequest(req);
  },
};
