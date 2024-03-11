import { apiTokenCommands } from "./apiToken.ts";
import { getAccessToken } from "./accessToken.ts";
import { keyManipulations } from "./keyManipulation.ts";
import { login } from "./login.ts";
import { randomBytes } from "node:crypto";
import yargs from "https://deno.land/x/yargs@v17.7.2-deno/deno.ts";

const args = yargs(Deno.args)
  .scriptName("rmmbr")
  .command("login", "Authenticate the CLI")
  // deno-lint-ignore no-explicit-any
  .command("key", "Manage cache keys", (yargs: any) =>
    yargs
      .option("get", {
        alias: "g",
        description:
          "Get a value for a given key: `<token> <cacheId> <jsonString>`",
        string: true,
      })
      .option("delete", {
        alias: "d",
        description:
          "Deletes a value for a given key: `<token> <cacheId> <jsonString>`",
        string: true,
      }))
  .command(
    "token",
    "Manage API tokens",
    // deno-lint-ignore no-explicit-any
    (yargs: any) =>
      yargs.option("get", {
        alias: "g",
        description: "Get or create the first API token",
        boolean: true,
      }).option(
        "create",
        {
          alias: "c",
          description: "Create a new API token",
          boolean: true,
        },
      ).option(
        "delete",
        {
          alias: "d",
          description: "Delete an API token",
          string: true,
        },
      ).option("list", {
        alias: "l",
        description: "List API tokens",
        boolean: true,
      }).strict().check(
        // deno-lint-ignore no-explicit-any
        ({ g, c, d, l }: any) =>
          [g, c, d, l].filter((o) => o != undefined).length == 1
            ? true
            : "Choose one option",
      ),
  )
  .command("secret", "Generate a secret key")
  .command("update", "Update the CLI")
  .strictCommands()
  .demandCommand(1)
  .version("0.1")
  .parse();

type YargsInstance = ReturnType<typeof yargs>;
type Handler = (
  // deno-lint-ignore no-explicit-any
  cmdInput: any,
) => (accessToken: string) => Promise<string>;

const pickAndRunCommand =
  (availableCmds: Record<string, Handler>) => (cmdInput: YargsInstance) => {
    const [action, args] =
      Object.entries(cmdInput).find(([action]) => action in availableCmds) ||
      Deno.exit();
    return getAccessToken().then(availableCmds[action](args));
  };

// deno-lint-ignore no-explicit-any
const commands: Record<string, (args: any) => Promise<string>> = {
  login,
  key: pickAndRunCommand(keyManipulations),
  token: pickAndRunCommand(apiTokenCommands),
  secret: () => Promise.resolve(randomBytes(32).toString("base64url") + "="),
};

commands[args._[0]](args).then(console.log).catch((msg) => {
  console.error(msg);
  Deno.exit(1);
});
