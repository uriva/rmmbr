import { Path } from "https://deno.land/x/path@v3.0.0/mod.ts";
import homeDir from "https://deno.land/x/dir@1.5.1/home_dir/mod.ts";

const rejectError = (msg: string) => Promise.reject(new Error(msg));

const pathToFileInHomeDir =
  (dirName: string, filename: string) => async (): Promise<Path> => {
    const home = homeDir();
    if (home === null) {
      return rejectError("Couldn't find your home directory.");
    }
    const configPath = new Path(home).push(dirName);
    return configPath.exists || (await configPath.mkDir())
      ? configPath.push(filename)
      : rejectError(`Couldn't create the "${dirName}" directory`);
  };

const getAccessTokenPath = pathToFileInHomeDir(".rmmbr", "access_token");

export const writeAccessToken = (accessToken: string) =>
  getAccessTokenPath()
    .then((path) => Deno.writeTextFile(path.toString(), accessToken));

export const getAccessToken = (): Promise<string> =>
  getAccessTokenPath().then(
    (path) =>
      path.exists
        ? Deno.readTextFile(path.toString())
        : rejectError('Not logged-in, run the "login" command first.'),
  );
