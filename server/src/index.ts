import { app, authenticated, Response404 } from "./webFramework.ts";
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

const joinColon = (prefix: string) => (suffix: string) => prefix + ":" + suffix;

const redisKey = {
  userToApiTokenSet: joinColon("user-api-token-set"),
  apiTokenToUser: joinColon("api-token"),
};

const verifyApiToken = (token: string) =>
  redisClient.get(redisKey.apiTokenToUser(token));

const verifyAuth0 = (token: string): Promise<string | null> =>
  jwtVerify(token, Auth0JKWS, {
    issuer: auth0Tenant,
    audience: "rmmbr",
  }).then((x) => x.payload.sub || null).catch(() => null);

type ApiTokenAction = { action: "create" } | {
  action: "delete";
  tokenId: string;
};

const rootHandler = async (request: Request, uid: string) => {
  const { method, params } = await request.json();
  console.log("incoming request", method, params);
  if (method === "get") {
    const { cacheId, key } = params;
    return new Response(
      (await redisClient.get(`${uid}:${cacheId}:${key}`)) ||
        JSON.stringify(null),
    );
  }
  if (method === "delete") {
    const { cacheId, key } = params;
    return new Response(
      JSON.stringify(await redisClient.del(`${uid}:${cacheId}:${key}`)),
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
};

const apiTokenPostHandler = (request: Request, uid: string) =>
  request.json().then(
    (call: ApiTokenAction) => {
      if (call.action === "create") {
        const token = crypto.randomUUID();
        const tx = redisClient.tx();
        tx.rpush(redisKey.userToApiTokenSet(uid), token);
        tx.set(redisKey.apiTokenToUser(token), uid);
        return tx.flush().then(() => new Response(JSON.stringify(token)));
      }
      if (call.action === "delete") {
        return getApiTokens(uid).then((tokens) => {
          const tokensToDelete = tokens.filter((t) =>
            t.startsWith(call.tokenId)
          );
          if (tokensToDelete.length == 0) {
            return Response404();
          } else if (tokensToDelete.length > 1) {
            return new Response("Ambiguous token ID", { status: 403 });
          }
          const deletedToken = tokensToDelete[0];
          const tx = redisClient.tx();
          tx.lrem(
            redisKey.userToApiTokenSet(uid),
            1,
            deletedToken,
          );
          tx.del(redisKey.apiTokenToUser(deletedToken));
          return tx.flush().then(() =>
            new Response(JSON.stringify(deletedToken))
          );
        });
      }
      return new Response("Unknown command", { status: 403 });
    },
  );

const getApiTokens = (uid: string) =>
  redisClient.lrange(redisKey.userToApiTokenSet(uid), 0, -1);

serve(
  app({
    "/": {
      POST: authenticated(
        memCache({ ttl: 60 * 5 })(verifyApiToken),
        rootHandler,
      ),
      GET: () =>
        new Response(null, {
          status: 302,
          headers: { Location: "https://hi.rmmbr.net/" },
        }),
    },
    "/api-token/": {
      GET: authenticated(
        verifyAuth0,
        (_, uid) =>
          getApiTokens(uid).then((tokens) =>
            new Response(JSON.stringify(tokens))
          ),
      ),
      POST: authenticated(verifyAuth0, apiTokenPostHandler),
    },
  }),
  { port: parseInt(Deno.env.get("PORT") as string) },
);
