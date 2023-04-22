import { login } from "./cli/login.ts";
import { apiToken } from "./cli/apiToken.ts";

import { parse } from "https://deno.land/std@0.182.0/flags/mod.ts";

const handleDefault = (value: string): boolean => {
  if (["login", "api-token", "secret"].includes(value)) {
    return true;
  }
  help();
  Deno.exit(1);
};

const help = () => {
  console.log(`cli [--help]

Commands:

  login         Authenticate the CLI
  api-token     Get or generate an api-token
  secret        Generate a secret key
`);
};

const args = parse(Deno.args, {
  boolean: ["help"],
  unknown: handleDefault,
});

if (args.help || args._.length != 1) {
  help();
  Deno.exit(args.help ? 0 : 1);
}

const command = args._[0];

if (command == "login") {
  await login();
} else if (command == "api-token") {
  await apiToken();
} else {
  console.error("Not implemented");
  Deno.exit(1);
}
