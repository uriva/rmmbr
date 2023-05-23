import { Response404, app, authenticated } from "./webFramework.ts";
import {
  createRemoteJWKSet,
  jwtVerify,
} from "https://deno.land/x/jose@v4.14.1/index.ts";

import { memCache } from "../../client/src/index.ts";
import { redisClient } from "./redis.ts";
import { serve } from "https://deno.land/std@0.182.0/http/server.ts";

const oneWeekInSeconds = 7 * 24 * 60 * 60;

const auth0Tenant = "https://dev-gy4q5ggc5zaobhym.us.auth0.com/";
const Auth0JKWS = createRemoteJWKSet(
  new URL(`${auth0Tenant}.well-known/jwks.json`),
);

const verifyApiToken = (token: string) => redisClient.get(`api-token:${token}`);

const verifyAuth0 = (token: string): Promise<string> =>
  jwtVerify(token, Auth0JKWS, {
    issuer: auth0Tenant,
    audience: "rmmbr",
  }).then((x) => x.payload.sub || "");

const joinColon = (prefix: string) => (suffix: string) => prefix + ":" + suffix;

const redisKey = {
  userToApiToken: joinColon("user-api-token"),
  apiTokenToUser: joinColon("api-token"),
};

serve(
  app({
    "/": {
      POST: authenticated(
        memCache({ ttl: 60 * 5 })(verifyApiToken),
        async (request, uid) => {
          const { method, params } = await request.json();
          if (method === "get") {
            const { cacheId, key } = params;
            return new Response(
              (await redisClient.get(`${uid}:${cacheId}:${key}`)) ||
                JSON.stringify(null),
            );
          }
          if (method === "set") {
            const { cacheId, key, value, ttl } = params;
            await redisClient.set(
              `${uid}:${cacheId}:${key}`,
              JSON.stringify(value),
              {
                ex: (ttl > oneWeekInSeconds || !ttl) ? oneWeekInSeconds : ttl,
              },
            );
            return new Response(JSON.stringify({}));
          }
          return new Response("Unknown method", { status: 400 });
        },
      ),
    },
    "/api-token/": {
      GET: authenticated(verifyAuth0, async (_, uid) => {
        const token = await redisClient.get(redisKey.userToApiToken(uid));
        return token ? new Response(token) : Response404();
      }),
      POST: authenticated(verifyAuth0, async (_, uid) => {
        const oldToken = await redisClient.get(redisKey.userToApiToken(uid));
        if (oldToken) {
          await redisClient.del(redisKey.apiTokenToUser(oldToken));
        }
        const token = crypto.randomUUID();
        return Promise.all([
          redisClient.set(redisKey.userToApiToken(uid), token),
          redisClient.set(redisKey.apiTokenToUser(token), uid),
        ]).then(() => new Response(token));
      }),
    },
  }),
  { port: parseInt(Deno.env.get("PORT") as string) },
);
