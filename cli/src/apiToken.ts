import { getAccessTokenPath } from "./accessTokenPath.ts";

const serverURL = Deno.env.get("RMMBR_SERVER");

type APITokenInterface =
  | { create: true }
  | { delete: string }
  | { list: true }
  | { get: true }
  | Record<string, never>;

export const apiToken = (
  cmd: APITokenInterface,
) => {
  const action: (_: string) => Promise<unknown> = "create" in cmd
    ? createApiToken
    : "delete" in cmd
    ? deleteApiToken(cmd["delete"])
    : "list" in cmd
    ? listApiTokens
    : getOrCreateApiToken; // The default action is "get or create"

  return getAccessToken()
    .then(action)
    .then(console.log);
};

const apiTokenRequest = (
  accessToken: string,
  method: "GET" | "POST",
  body?: unknown,
) =>
  fetch(`${serverURL}/api-token/`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    method,
    body: JSON.stringify(body),
  }).then(
    async (response) =>
      response.status === 200
        ? response.json()
        : Promise.reject(await response.text()),
  );

const getAccessToken = (): Promise<string> =>
  getAccessTokenPath().then(
    (path) =>
      path.exists
        ? Deno.readTextFile(path.toString())
        : Promise.reject('Not logged-in, run the "login" command first.'),
  );

const createApiToken = (accessToken: string): Promise<string> =>
  apiTokenRequest(accessToken, "POST", {
    action: "create",
  });

const listApiTokens = (accessToken: string): Promise<Array<string>> =>
  apiTokenRequest(accessToken, "GET");

const getOrCreateApiToken = (
  accessToken: string,
): Promise<string> =>
  listApiTokens(accessToken).then(
    (tokens) => tokens.length == 0 ? createApiToken(accessToken) : tokens[0],
  );

const deleteApiToken =
  (tokenId: string) => (accessToken: string): Promise<string> =>
    apiTokenRequest(accessToken, "POST", { action: "delete", tokenId });
