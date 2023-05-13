import { apiToken } from "./apiToken.ts";
import { login } from "./login.ts";
import { parse } from "https://deno.land/std@0.182.0/flags/mod.ts";
import { randomBytes } from "node:crypto";

const handleDefault = (value: string): boolean => {
  if (["login", "api-token", "secret"].includes(value)) {
    return true;
  }
  console.log(`${value} is not a valid command.`);
  help();
  Deno.exit(1);
};

const help = () => {
  console.log(`Commands:

  login         Authenticate the CLI
  api-token     Get or generate an api-token
  secret        Generate a secret key
`);
};

const args = parse(Deno.args, {
  boolean: ["help"],
  unknown: handleDefault,
});

if (args.help) {
  help();
  Deno.exit(0);
}

if (!args._.length) {
  console.error("No command given.");
  help();
  Deno.exit(1);
}

const command = args._[0];
const commands: Record<string, () => void> = {
  login,
  "api-token": apiToken,
  secret: () => {
    console.log(randomBytes(16).toString("hex"));
  },
};
const fallback = () => {
  console.error(`Unrecognized command: ${command}`);
  Deno.exit(1);
};
(commands[command] || fallback)();
