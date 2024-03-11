import { callServer } from "./rpc.ts";
import { inputToCacheKey } from "../../client/src/index.ts";

const actOnKey = (method: string) => (args: string) => () => {
  const [token, cacheId, key] = args.split(" ");
  return callServer("", "POST", {
    method,
    params: {
      cacheId,
      key: inputToCacheKey(token, undefined)(...JSON.parse(key)),
    },
  })(token);
};

export const keyManipulations = {
  delete: actOnKey("delete"),
  get: actOnKey("get"),
};
