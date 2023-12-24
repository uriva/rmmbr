import { getAccessToken } from "./accessToken.ts";

const serverURL = Deno.env.get("RMMBR_SERVER");

type APITokenInterface =
  | { create: true }
  | { delete: string }
  | { list: true }
  | { get: true };

export const apiToken = (
  cmd: APITokenInterface,
) => {
  const [action, args] =
    Object.entries(cmd).find(([action]) => action in commandMapping) ||
    Deno.exit();
  return getAccessToken().then(commandMapping[action](args));
};

const apiTokenRequest = (
  method: "GET" | "POST",
  body: undefined | Record<string, string>,
) =>
(accessToken: string) =>
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

const createApiToken = apiTokenRequest("POST", { action: "create" });
const listApiTokens = apiTokenRequest("GET", undefined);

const getOrCreateApiToken = (
  accessToken: string,
): Promise<string> =>
  listApiTokens(accessToken).then(
    (tokens) => tokens.length == 0 ? createApiToken(accessToken) : tokens[0],
  );

const commandMapping: Record<
  string,
  ((..._: string[]) => (_: string) => Promise<string>)
> = {
  create: () => createApiToken,
  delete: (tokenId: string) =>
    apiTokenRequest("POST", { action: "delete", tokenId }),
  list: () => listApiTokens,
  get: () => getOrCreateApiToken,
};
