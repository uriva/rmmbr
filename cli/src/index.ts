import { apiToken } from "./apiToken.ts";
import { login } from "./login.ts";

import yargs from "https://deno.land/x/yargs@v17.7.2-deno/deno.ts";
import { randomBytes } from "node:crypto";

const args = yargs(Deno.args)
  .scriptName("rmmbr")
  .command("login", "Authenticate the CLI")
  .command(
    "api-token",
    "Manage API tokens",
    (yargs: any) =>
      yargs.option("get", {
        alias: "g",
        description: "(Default) Get or create the first API token",
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
        ({ g, c, d, l }: any) => {
          return [g, c, d, l].filter((o) => o != undefined).length == 1
            ? true
            : "Choose one option";
        },
      ),
  )
  .command("secret", "Generate a secret key")
  .command("update", "Update the CLI")
  .strictCommands()
  .demandCommand(1)
  .version("0.1")
  .parse();

const command = args._[0];
const commands: Record<string, () => Promise<string>> = {
  login,
  "api-token": () => apiToken(args),
  secret: () => Promise.resolve(randomBytes(32).toString("base64url") + "="),
};

commands[command]().then(console.log).catch((msg) => {
  console.error(msg);
  Deno.exit(1);
});
