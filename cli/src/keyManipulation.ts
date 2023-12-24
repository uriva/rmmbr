import { callServer } from "./rpc.ts";
import { inputToCacheKey } from "../../client/src/index.ts";

const parseCacheIdAndKey = (hashKey: (...xs: any[]) => string, x: string) => {
  const [cacheId, key] = x.split(" ");
  return { cacheId, key: hashKey(...JSON.parse(key)) };
};
const actOnKey = (action: string) => (args: string) => (secret: string) =>
  callServer("", "GET", {
    action,
    ...parseCacheIdAndKey(inputToCacheKey(secret, undefined), args),
  })(
    secret,
  );

export const keyManipulations = {
  delete: actOnKey("delete"),
  get: actOnKey("get"),
};
