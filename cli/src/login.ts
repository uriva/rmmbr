import { AccessTokenError, getAccessTokenPath } from "./accessTokenPath.ts";
import { err, ok, Result, Unit } from "./deps.ts";

import { delay } from "https://deno.land/std@0.50.0/async/delay.ts";
import open from "npm:open@9.1.0";

const clientId = "ARXipK0k64GivxcX9UVUWMp9g7ywQsqO";
const auth0Tenant = "https://dev-gy4q5ggc5zaobhym.us.auth0.com";
const audience = "rmmbr";

export const login = async () => {
  const response = await fetch(`${auth0Tenant}/oauth/device/code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      scope: "profile",
      client_id: clientId,
      audience,
    }),
  });

  const { device_code, interval, verification_uri_complete } = await response
    .json();

  await open(verification_uri_complete);

  console.log(
    `Visit:

  ${verification_uri_complete}

and confirm to finish the login.
`,
  );

  console.log("Waiting...");

  while (true) {
    await delay(interval * 1000);
    const response = await fetch(`${auth0Tenant}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "urn:ietf:params:oauth:grant-type:device_code",
        device_code,
        client_id: clientId,
      }),
    });

    const { access_token, error } = await response.json();
    if (access_token) {
      (await storeAccessToken(access_token)).match({
        Ok: () => {
          console.log("Now logged in.");
          Deno.exit(0);
        },
        Err: (e) => {
          console.log(e);
          Deno.exit(1);
        },
      });
    }
    if (error === "authorization_pending") {
      // User hasn't authenticated yet, wait and try again:
      continue;
    } else if (error === "expired_token") {
      console.error("Waited too long, try again.");
    } else {
      console.error(
        `Unexpected error while waiting for authentication: ${error}`,
      );
    }
    Deno.exit(1);
  }
};

export const storeAccessToken = async (
  accessToken: string,
): Promise<Result<Unit, AccessTokenError>> => {
  const accessTokenPath = await getAccessTokenPath();
  if (accessTokenPath.isErr) {
    return err(accessTokenPath.error);
  }
  await Deno.writeTextFile(accessTokenPath.value.toString(), accessToken);
  return ok();
};
