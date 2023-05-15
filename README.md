# rmmbr

![rmmbr](https://media.tenor.com/NcnMXggTODAAAAAC/yeah-i-member-memberberries.gif)

`rmmbr` is the simplest way to cache your async functions, locally or in the
cloud.

## Usage

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

There is also a `memCache`, if you are feeling nostalgic 😉 and just want to
store stuff in memory.

## Cross device caching

To persist the cache across devices, you can use our cloud service, which is free up to a quota.

To use it, you can install the CLI tool:

`source <(curl -s https://raw.githubusercontent.com/uriva/rmmbr/main/cli/install.sh)`

Then

```sh
rmmbr login
rmmbr api-token
```

Use your token with the API as follows:

```js
const cacher = cloudCache({
  token: "service-token",
  cacheId: "some name for the cache",
  url: "https://uriva-rmmbr.deno.dev",
  ttl: 60 * 60 * 24, // Values will expire after one day. Omission implies max (one week).
});
```

### Pricing

| Tier        | Requests  | Total data stored | Max entry size | # Entries |
| ----------- | --------- | ----------------- | -------------- | --------- |
| Free        | 10,000    | 10 MB             | 1 KB           | 1000      |
| \$100/month | 1,000,000 | 1 GB              | 100 KB         | Unlimited |

### End to end encryption

For sensitive data, you can e2e encrypt it by adding an `encryptionKey`
parameter.

To produce an encryption key:

```sh
rmmbr secret
```

Then use it like so:

```js
const cacher = cloudCache({
  token: "your-service-token",
  cacheId: "some name for the cache",
  url: "https://uriva-rmmbr.deno.dev",
  encryptionKey: "your-encryption-key",
});
```

## Python

```sh
pip install rmmbr
```

The python api mimicks the js one, with exported decorators named `mem_cache`,
`local_cache` and `cloud_cache`.
