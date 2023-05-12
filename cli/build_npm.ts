import { build, emptyDir } from "https://deno.land/x/dnt@0.33.1/mod.ts";

const outDir = "./dist";

await emptyDir(outDir);

await build({
  typeCheck: false,
  entryPoints: ["./cli/src/index.ts"],
  outDir,
  shims: { deno: true },
  package: {
    name: "rmmbr-cli",
    version: "0.0.2",
    description: "Easy caching.",
    license: "MIT",
    repository: {
      type: "git",
      url: "git+https://github.com/uriva/rmmbr.git",
    },
    bugs: {
      url: "https://github.com/uriva/rmmbr/issues",
    },
    bin: {
      "rmmbr-cli": "src/index.js",
    },
  },
  postBuild() {
    Deno.copyFileSync("./LICENSE", outDir + "/LICENSE");
    Deno.copyFileSync("./README.md", outDir + "/README.md");
  },
});
