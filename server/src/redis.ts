import { connect } from "https://deno.land/x/redis@v0.29.2/mod.ts";

const redisClient = await connect({
  password: Deno.env.get("REDIS_PASSWORD"),
  hostname: Deno.env.get("REDIS_URL") as string,
  port: Deno.env.get("REDIS_PORT"),
});

export const redisGet = (key: string) => redisClient.get(key);

export const redisSet = (key: string, value: any) =>
  redisClient.set(key, JSON.stringify(value), { ex: 7 * 24 * 60 * 60 });
