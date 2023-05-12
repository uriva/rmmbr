`rmmbr` is the simplest way to cache your async functions, locally or in the cloud.

Usage:

```sh
npm i rmmbr
```

```js
import { cloudCache, localCache } from "rmmbr";

const cacher = localCache({ id: "name of cache for my function" });

let nCalled = 0;
const f = (x: number) => {
  nCalled++;
  return Promise.resolve(x);
};
const fCached = cacher(f);
await fCached(3);
await fCached(3);
// nCalled is 1 here
```

The local cache stores data in a text file under a `.rmmbr` directory.

There is also a `memCache`, if you are feeling nostalgic 😉 and just want to store stuff in memory.

To persist the cache across devices, we offer a use cloud service, which is free to use up to a quota.

To use it, you can install the CLI tool:

`source <(curl -s https://raw.githubusercontent.com/uriva/rmmbr/main/cli/install.sh)`

Then

```sh
rmmbr login
rmmbr api-token
```

You can then use your token with the API as follows:

```js
const cacher = cloudCache({
  token: "service-token",
  cacheId: "some name for the cache",
  url: "https://uriva-rmmbr.deno.dev",
  ttl: 60 * 60 * 24, // Values will expire after one day, omission of this field implies max.
});
```

If your data is sensitive, you can e2e encrypt it by adding an `encryptionKey` parameter.

To produce an encryption key:

```sh
rmmbr secret
```

Then use it like so:

```js
const cacher = cloudCache({
  token: "service-token",
  cacheId: "some name for the cache",
  url: "https://uriva-rmmbr.deno.dev",
  encryptionKey: "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
});
```

## Python

```sh
pip install rmmbr
```

The python api mimicks the js one, with exported decorators named `mem_cache`, `local_cache` and `cloud_cache`.
