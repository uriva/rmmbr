import { serve } from "https://deno.land/std@0.182.0/http/server.ts";

import * as jose from "https://deno.land/x/jose@v4.14.1/index.ts";

import { redisGet, redisSet, redisClient } from "./redis.ts";
import { app, authenticated, Response404 } from "./framework.ts";

const oneWeekInSeconds = 7 * 24 * 60 * 60;

const auth0Tenant = "https://dev-gy4q5ggc5zaobhym.us.auth0.com/";
const Auth0JKWS = jose.createRemoteJWKSet(
  new URL(`${auth0Tenant}.well-known/jwks.json`)
);

serve(
  app({
    "/": {
      POST: async (request) => {
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
            ttlOrDefault > oneWeekInSeconds ? oneWeekInSeconds : ttlOrDefault
          );
          return new Response(JSON.stringify({}));
        }
        return new Response("Unknown method", { status: 400 });
      },
    },
    "/api-token/": {
      GET: authenticated(auth0)(async (_request, auth) => {
        const token = await redisClient.get(`user-api-token:${auth.uid}`);
        if (token == null) {
          return Response404();
        }
        return new Response(token);
      }),
      POST: authenticated(auth0)(async (_request, auth) => {
        const old_token = await redisClient.get(`user-api-token:${auth.uid}`);
        if (old_token != null) {
          await redisClient.del(`api-token:${old_token}`);
        }

        const token = crypto.randomUUID();
        await redisClient.set(`user-api-token:${auth.uid}`, token);
        await redisClient.set(`api-token:${token}`, auth.uid);
        return new Response(token);
      }),
    },
  }),
  { port: parseInt(Deno.env.get("PORT") as string) }
);

export async function auth0(request: Request) {
  const jwt = request.headers.get("Authorization")?.split("Bearer ")[1];
  if (!jwt) {
    return null;
  }

  const { payload, protectedHeader } = await jose.jwtVerify(jwt, Auth0JKWS, {
    issuer: auth0Tenant,
    audience: "rmmbr",
  });

  const uid = payload.sub;
  if (!uid) {
    return null;
  }

  return {
    jwt,
    uid,
    payload,
    protectedHeader,
  };
}
