import { build, emptyDir } from "jsr:@deno/dnt@0.41.3";

const outDir = "./dist";

await emptyDir(outDir);

await build({
  typeCheck: false,
  test: false,
  entryPoints: ["./client/src/index.ts"],
  outDir,
  shims: { deno: true },
  package: {
    name: "rmmbr",
    version: "0.0.26",
    description: "Easy caching.",
    license: "MIT",
    repository: {
      type: "git",
      url: "git+https://github.com/uriva/rmmbr.git",
    },
    bugs: {
      url: "https://github.com/uriva/rmmbr/issues",
    },
  },
  postBuild() {
    Deno.copyFileSync("./LICENSE", outDir + "/LICENSE");
    Deno.copyFileSync("./README.md", outDir + "/README.md");
  },
});
