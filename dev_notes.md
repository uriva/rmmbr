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

## Deployment

### pypi

Modify the version in `setup.py` and push to main with commit message `deploy-pypi`.

### npm

Modify the version in `build_npm.ts` and push to main with commit message `deploy-npm`.
