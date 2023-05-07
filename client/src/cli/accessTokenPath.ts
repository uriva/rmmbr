import homeDir from "https://deno.land/x/dir@1.5.1/home_dir/mod.ts";
import { Path } from "https://deno.land/x/path@v3.0.0/mod.ts";
import { err, ok, Result } from "./deps.ts";

export type AccessTokenError = string;

export const getAccessTokenPath =
  (dirName: string, accessTokenName: string) =>
  async (): Promise<Result<Path, AccessTokenError>> => {
    const home = homeDir();
    if (home === null) {
      return err("Couldn't find your home directory.");
    }

    const configPath = new Path(home).push(dirName);
    return configPath.exists || (await configPath.mkDir())
      ? ok(configPath.push(accessTokenName))
      : err(`Couldn't create the "${dirName}" directory`);
  };
