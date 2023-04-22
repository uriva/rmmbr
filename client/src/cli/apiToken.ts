import {
  AccessTokenError,
  getRmmbrAccessTokenPath,
} from "./rmmbrAccessToken.ts";
import { err, ok, Result } from "./deps.ts";

const rmmbrServer = Deno.env.get("RMMBR_SERVER");

export const apiToken = async () => {
  const result: Result<string, AccessTokenError> = await (
    await getAccessToken()
  ).match({
    Err: (e) => Promise.resolve(err(e)),
    Ok: (accessToken) => getOrCreateApiToken(accessToken),
  });
  reportAndExit(result);
};

const reportAndExit = (result: Result<string, AccessTokenError>) => {
  result.match({
    Ok: (value) => {
      console.log(value);
      Deno.exit(0);
    },
    Err: (e) => {
      console.error(e);
      Deno.exit(1);
    },
  });
};

const apiTokenRequest = (accessToken: string, method: "GET" | "POST") =>
  fetch(`${rmmbrServer}/api-token/`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    method,
  });

const getAccessToken = async (): Promise<Result<string, AccessTokenError>> =>
  (await getRmmbrAccessTokenPath()).match({
    Err: (e) => Promise.resolve(err(e)),
    Ok: async (path) =>
      path.exists
        ? ok(await Deno.readTextFile(path.toString()))
        : err('Not logged-in, run the "login" command first.'),
  });

const getOrCreateApiToken = async (
  accessToken: string,
): Promise<Result<string, AccessTokenError>> => {
  const getResponse = await apiTokenRequest(accessToken, "GET");

  if (getResponse.status == 200) {
    return ok(await getResponse.text());
  }

  const createResponse = await apiTokenRequest(accessToken, "POST");
  return createResponse.status == 200
    ? ok(await createResponse.text())
    : err('Login expired, run the "login" command again.');
};
