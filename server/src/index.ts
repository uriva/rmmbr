import { redisGet, redisSet } from "./redis.ts";

import { load } from "https://deno.land/std@0.182.0/dotenv/mod.ts";
import { serve } from "https://deno.land/std@0.182.0/http/server.ts";

const envVariables = await load();

serve(
  async (request) => {
    if (request.method === "POST") {
      const { method, params } = await request.json();
      if (method === "get") {
        const { key, id } = params;
        return new Response((await redisGet(id + key)) || "null");
      }
      if (method === "set") {
        const { key, value, id } = params;
        await redisSet(id + key, value);
        return new Response(JSON.stringify({}));
      }
    }
    return new Response();
  },
  { port: parseInt(envVariables.PORT as string) },
);
