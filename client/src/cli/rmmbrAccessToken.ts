import { getAccessTokenPath } from "./accessTokenPath.ts";
export type { AccessTokenError } from "./accessTokenPath.ts";

export const getRmmbrAccessTokenPath = getAccessTokenPath(
  ".rmmbr",
  "access_token",
);
