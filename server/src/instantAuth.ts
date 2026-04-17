import { init } from "npm:@instantdb/admin";
import { redisClient } from "./redis.ts";

const joinColon = (prefix: string) => (suffix: string) => prefix + ":" + suffix;

const redisKey = {
  instantTokenAuth: joinColon("instant-token-auth"),
};

const instantAppId = Deno.env.get("INSTANT_APP_ID");
const instantAdminToken = Deno.env.get("INSTANT_ADMIN_TOKEN");
const tokenCacheTtlSeconds = parseInt(
  Deno.env.get("INSTANT_TOKEN_CACHE_TTL_SECONDS") || "300",
);

const instantAdminDb = (instantAppId && instantAdminToken)
  ? init({ appId: instantAppId, adminToken: instantAdminToken })
  : null;

const bytesToHex = (bytes: Uint8Array) =>
  Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");

const hashToken = async (token: string): Promise<string> => {
  const bytes = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return bytesToHex(new Uint8Array(digest));
};

type ServiceTokenRecord = {
  status?: string;
  revokedAt?: string | number | null;
  expiresAt?: string | number | null;
  $user?: { id?: string } | Array<{ id?: string }>;
};

const isActiveToken = (token: ServiceTokenRecord) => {
  if (token.status !== "active") return false;
  if (token.revokedAt) return false;
  if (!token.expiresAt) return true;
  const expiryTime = new Date(token.expiresAt).getTime();
  return Number.isFinite(expiryTime) && expiryTime > Date.now();
};

export const verifyInstantToken = async (token: string): Promise<string | null> => {
  if (!instantAdminDb) return null;

  const tokenHash = await hashToken(token);
  const redisCachedUid = await redisClient.get(redisKey.instantTokenAuth(tokenHash));
  if (redisCachedUid) return redisCachedUid;

  const queryResult = await instantAdminDb.query({
    serviceTokens: {
      $: {
        where: {
          tokenHash,
        },
      },
      $user: {},
    },
  });

  const tokenEntity = queryResult.serviceTokens?.[0] as ServiceTokenRecord | undefined;
  const owner = Array.isArray(tokenEntity?.$user)
    ? tokenEntity?.$user[0]
    : tokenEntity?.$user;
  const uid = owner?.id;

  if (!tokenEntity || !uid || !isActiveToken(tokenEntity)) return null;

  await redisClient.set(
    redisKey.instantTokenAuth(tokenHash),
    uid,
    { ex: tokenCacheTtlSeconds },
  );
  return uid;
};
