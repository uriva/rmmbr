import { getAccessTokenPath } from "./accessTokenPath.ts";

const serverURL = Deno.env.get("RMMBR_SERVER");

export const apiToken = () =>
  getAccessToken()
    .then(getOrCreateApiToken)
    .then(console.log);

const apiTokenRequest = (accessToken: string, method: "GET" | "POST") =>
  fetch(`${serverURL}/api-token/`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    method,
  });

const getAccessToken = (): Promise<string> =>
  getAccessTokenPath().then(
    (path) =>
      path.exists
        ? Deno.readTextFile(path.toString())
        : Promise.reject('Not logged-in, run the "login" command first.'),
  );

const getOrCreateApiToken = async (
  accessToken: string,
): Promise<string> => {
  const getResponse = await apiTokenRequest(accessToken, "GET");
  if (getResponse.status === 200) return getResponse.text();
  const createResponse = await apiTokenRequest(accessToken, "POST");
  return createResponse.status === 200
    ? createResponse.text()
    : Promise.reject('Login expired, run the "login" command again.');
};
