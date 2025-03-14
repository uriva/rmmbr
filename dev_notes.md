# Developer notes

## Tests

Tests will pass if redis is run:

```sh
redis-server --port 6666 --requirepass 12345
```

And a local server:

```sh
deno task server
```

also remove local `.rmmbr` directory

### Interacting with local redis

Open a REPL that's configured like the local server and interact with redis:

```sh
deno task server-repl
```

## Deployment

### pypi

Modify the version in `setup.py` and push to main with commit message
`deploy-pypi`.

### npm

Modify the version in `client/build_npm.ts` and push to main with commit message
`deploy-npm`.

### deno.land

`gh release create` > "Create a new tag" > ... > Publish release
