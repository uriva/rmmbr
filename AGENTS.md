# Agent Rules

## Lockfile policy

- `deno.lock` must always be committed and kept in sync with the code and dependency graph.
- If npm is used in this repository, `package.json` and `package-lock.json` must both be committed and kept in sync with each other and the codebase.
- Do not leave lockfile or manifest changes uncommitted after dependency updates.
