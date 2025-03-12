import { inputToCacheKey } from "../../client/src/crypto.ts";
import { callServer } from "./rpc.ts";

const actOnKey = (method: string) => (args: string) => () => {
  const [token, cacheId, jsonString] = args.split(" ");
  return callServer("", "POST", {
    method,
    params: {
      cacheId,
      key: inputToCacheKey("", undefined)(...JSON.parse(jsonString)),
    },
  })(token);
};

export const keyManipulations = {
  delete: actOnKey("delete"),
  get: actOnKey("get"),
};
