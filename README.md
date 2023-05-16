# rmmbr

![rmmbr](https://media.tenor.com/NcnMXggTODAAAAAC/yeah-i-member-memberberries.gif)

`rmmbr` is the simplest way to persistently cache async functions, locally or in the
cloud with end to end encryption (e2ee).

## Usage

`rmmbr` provides three APIs, in python and javascript.

1. cloud caching - persist the cache across devices
1. local file caching - persist on one device in a text file under a `.rmmbr` directory
1. In memory caching - no persistence, if you are feeling nostalgic 😉

The cloud cache is free up to a quota. To use it, install the CLI tool:

```sh
source <(curl -s https://raw.githubusercontent.com/uriva/rmmbr/main/cli/install.sh)
```

To produce a service token:

```sh
rmmbr login
rmmbr api-token
```

For sensitive data, you can e2e encrypt it by adding an encryption key parameter.

To produce an encryption key:

```sh
rmmbr secret
```

### Python

```sh
pip install rmmbr
```

The python api mimicks the js one, with exported decorators named `mem_cache`,
`local_cache` and `cloud_cache`.

```python
import cloud_cache from "rmmbr"

cacher = cloud_cache(
    "https://uriva-rmmbr.deno.dev",
    "your-service-token",
    "some name for the cache",
    60 * 60 * 24, # TTL is one day.
    "Cqq33cbHu9AEUaP_wS3LCDQN7wy40XKWzALoPHbU5S8=",
)

n_called = 0

@cacher
async def f(x: int):
  nonlocal n_called
  n_called += 1
  return x

await f(3)
await f(3)
# nCalled is 1 here
```

### Javascript / Typescript

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

Cloud cache example:

```js
const cacher = cloudCache({
  token: "service-token",
  cacheId: "some name for the cache",
  url: "https://uriva-rmmbr.deno.dev",
  ttl: 60 * 60 * 24, // Values will expire after one day. Omission implies max (one week).
  encryptionKey: "your-encryption-key", // This can be omitted if you don't need e2ee.
});
```

## Pricing

| Tier        | Requests  | Total data stored | Max entry size | # Entries |
| ----------- | --------- | ----------------- | -------------- | --------- |
| Free        | 10,000    | 10 MB             | 1 KB           | 1000      |
| \$100/month | 1,000,000 | 1 GB              | 100 KB         | Unlimited |
