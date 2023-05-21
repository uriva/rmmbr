import { Path } from "https://deno.land/x/path@v3.0.0/mod.ts";
import homeDir from "https://deno.land/x/dir@1.5.1/home_dir/mod.ts";

export type AccessTokenError = string;

const getAccessTokenPathHelper =
  (dirName: string, accessTokenName: string) => async (): Promise<Path> => {
    const home = homeDir();
    if (home === null) {
      return Promise.reject("Couldn't find your home directory.");
    }
    const configPath = new Path(home).push(dirName);
    return configPath.exists || (await configPath.mkDir())
      ? configPath.push(accessTokenName)
      : Promise.reject(`Couldn't create the "${dirName}" directory`);
  };

export const getAccessTokenPath = getAccessTokenPathHelper(
  ".rmmbr",
  "access_token",
);
