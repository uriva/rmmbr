import { serve } from "https://deno.land/std@0.182.0/http/server.ts";

import * as jose from "https://deno.land/x/jose@v4.14.1/index.ts";

import { redisClient } from "./redis.ts";
import { app, authenticated, Response404 } from "./webFramework.ts";

const oneWeekInSeconds = 7 * 24 * 60 * 60;

const auth0Tenant = "https://dev-gy4q5ggc5zaobhym.us.auth0.com/";
const Auth0JKWS = jose.createRemoteJWKSet(
  new URL(`${auth0Tenant}.well-known/jwks.json`)
);

serve(
  app({
    "/": {
      POST: authenticated(verifyApiToken)(async (request, uid) => {
        const { method, params } = await request.json();
        if (method === "get") {
          return new Response(
            (await redisClient.get(`${uid}:${params.key}`)) || "null"
          );
        }
        if (method === "set") {
          const { key, value, ttl } = params;
          const ttlOrDefault = ttl || oneWeekInSeconds;
          await redisClient.set(`${uid}:${key}`, JSON.stringify(value), {
            ex:
              ttlOrDefault > oneWeekInSeconds ? oneWeekInSeconds : ttlOrDefault,
          });
          return new Response(JSON.stringify({}));
        }
        return new Response("Unknown method", { status: 400 });
      }),
    },
    "/api-token/": {
      GET: authenticated(verifyAuth0)(async (_request, uid) => {
        const token = await redisClient.get(`user-api-token:${uid}`);
        return token ? new Response(token) : Response404();
      }),
      POST: authenticated(verifyAuth0)(async (_request, uid) => {
        const oldToken = await redisClient.get(`user-api-token:${uid}`);
        if (oldToken != null) {
          await redisClient.del(`api-token:${oldToken}`);
        }

        const token = crypto.randomUUID();
        await Promise.all([
          redisClient.set(`user-api-token:${uid}`, token),
          redisClient.set(`api-token:${token}`, uid),
        ]);
        return new Response(token);
      }),
    },
  }),
  { port: parseInt(Deno.env.get("PORT") as string) }
);

function getBearer(request: Request) {
  return request.headers.get("Authorization")?.split("Bearer ")[1];
}

export async function verifyAuth0(request: Request) {
  const jwt = getBearer(request);
  if (!jwt) {
    return null;
  }

  const { payload } = await jose.jwtVerify(jwt, Auth0JKWS, {
    issuer: auth0Tenant,
    audience: "rmmbr",
  });

  return payload.sub;
}

export function verifyApiToken(request: Request) {
  const token = getBearer(request);
  return token && redisClient.get(`api-token:${token}`);
}
