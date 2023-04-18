import { redisGet, redisSet } from "./redis.ts";

import { serve } from "https://deno.land/std@0.182.0/http/server.ts";

const oneWeekInSeconds = 7 * 24 * 60 * 60;

serve(
  async (request) => {
    if (request.method === "POST") {
      const { method, params } = await request.json();
      if (method === "get") {
        const { key, id } = params;
        return new Response((await redisGet(id + key)) || "null");
      }
      if (method === "set") {
        const { key, value, id, ttl } = params;
        const ttlOrDefault = ttl || oneWeekInSeconds;
        await redisSet(
          id + key,
          value,
          ttlOrDefault > oneWeekInSeconds ? oneWeekInSeconds : ttlOrDefault,
        );
        return new Response(JSON.stringify({}));
      }
    }
    return new Response();
  },
  { port: parseInt(Deno.env.get("PORT") as string) },
);
