import { callServer } from "./rpc.ts";

const list = callServer("api-token/", "GET", undefined);
const create = callServer("api-token/", "POST", { action: "create" });

export const apiTokenCommands = {
  create,
  list,
  delete: (tokenId: string) =>
    callServer("api-token/", "POST", { action: "delete", tokenId }),
  get: (secret: string) =>
    list(secret).then((tokens: string[]) => tokens[0] || create(secret)),
};
