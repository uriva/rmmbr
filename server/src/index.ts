import { serve } from "https://deno.land/std@0.182.0/http/server.ts";

import * as jose from "https://deno.land/x/jose@v4.14.1/index.ts";

import { redisGet, redisSet, redisClient } from "./redis.ts";
import { app, authenticated, Response404 } from "./webFramework.ts";

const oneWeekInSeconds = 7 * 24 * 60 * 60;

const auth0Tenant = "https://dev-gy4q5ggc5zaobhym.us.auth0.com/";
const Auth0JKWS = jose.createRemoteJWKSet(
  new URL(`${auth0Tenant}.well-known/jwks.json`)
);

serve(
  app({
    "/": {
      POST: authenticated(api_token)(async (request, { uid }) => {
        const { method, params } = await request.json();
        if (method === "get") {
          return new Response(
            (await redisGet(`${uid}:${params.key}`)) || "null"
          );
        }
        if (method === "set") {
          const { key, value, ttl } = params;
          const ttlOrDefault = ttl || oneWeekInSeconds;
          await redisSet(
            `${uid}:${key}`,
            value,
            ttlOrDefault > oneWeekInSeconds ? oneWeekInSeconds : ttlOrDefault
          );
          return new Response(JSON.stringify({}));
        }
        return new Response("Unknown method", { status: 400 });
      }),
    },
    "/api-token/": {
      GET: authenticated(auth0)(async (_request, { uid }) => {
        const token = await redisClient.get(`user-api-token:${uid}`);
        if (token == null) {
          return Response404();
        }
        return new Response(token);
      }),
      POST: authenticated(auth0)(async (_request, { uid }) => {
        const old_token = await redisClient.get(`user-api-token:${uid}`);
        if (old_token != null) {
          await redisClient.del(`api-token:${old_token}`);
        }

        const token = crypto.randomUUID();
        await redisClient.set(`user-api-token:${uid}`, token);
        await redisClient.set(`api-token:${token}`, uid);
        return new Response(token);
      }),
    },
  }),
  { port: parseInt(Deno.env.get("PORT") as string) }
);

function getBearer(request: Request) {
  return request.headers.get("Authorization")?.split("Bearer ")[1];
}

export async function auth0(request: Request) {
  const jwt = getBearer(request);
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

export async function api_token(request: Request) {
  const token = getBearer(request);
  if (token == null) {
    return null;
  }

  const uid = await redisClient.get(`api-token:${token}`);
  if (uid == null) {
    return null;
  }

  return {
    uid,
  };
}
