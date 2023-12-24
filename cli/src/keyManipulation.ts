import { getAccessToken } from "./accessToken.ts";

const commandMapping: Record<
  string,
  ((..._: string[]) => (_: string) => Promise<string>)
> = {
  delete: (apiToken: string) => (secretAndKey: string) =>
    Promise.resolve("not yet implemented"),
  get: (apiToken: string) => (secretAndKey: string) =>
    Promise.resolve("not yet implemented"),
};

type APITokenInterface =
  | { delete: string }
  | { get: true };

export const keyManipulation = (cmd: APITokenInterface) => {
  const [action, args] =
    Object.entries(cmd).find(([action]) => action in commandMapping) ||
    Deno.exit();
  return getAccessToken()
    .then(commandMapping[action](args));
};
