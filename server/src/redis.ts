import { connect } from "redis";

export const redisClient = await connect({
  password: Deno.env.get("REDIS_PASSWORD"),
  hostname: Deno.env.get("REDIS_URL") as string,
  port: Deno.env.get("REDIS_PORT"),
});
