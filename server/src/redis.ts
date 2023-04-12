import { connect } from "https://deno.land/x/redis@v0.29.2/mod.ts";
import { load } from "https://deno.land/std@0.182.0/dotenv/mod.ts";
const envVariables = await load();

const redisClient = await connect({
  password: envVariables.REDIS_PASSWORD,
  hostname: envVariables.REDIS_URL as string,
  port: envVariables.REDIS_PORT,
});

export const redisGet = (key: string) => redisClient.get(key);

export const redisSet = (key: string, value: string) =>
  redisClient.set(key, JSON.stringify(value));
