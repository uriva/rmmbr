import { Path } from "x/path";
import homeDir from "x/dir";

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
