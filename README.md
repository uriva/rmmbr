# rmmbr

![rmmbr](https://media.tenor.com/NcnMXggTODAAAAAC/yeah-i-member-memberberries.gif)

`rmmbr` is the simplest way to persistently cache async functions, locally or in the
cloud with end to end encryption (e2ee).

## Motivation

Caching is a great way to save costs and time calling remote APIs.

Most programming languages already have solutions for in-memory caching. These work well if your service is long-running on one machine. However, if your service restarts, then you lose your cache. In addition if you are running more than one instance, they don't share caches.

Making caches persistent across runs requires deploying another service which writes to disk or to a database. This means to set it up is a substantial context switch for the developer. The last thing you want to think of while doing unrelated work is another service to maintain, and how to write code to communicate to this service.

As this use case is quite common, it would be desired to have an easy way to do it, right from your command line and code editor, and without any context switching.

## Usage

`rmmbr` provides three APIs, in python and javascript.

1. cloud caching - persist the cache across devices
1. local file caching - persist on one device in a text file under a `.rmmbr` directory
1. In memory caching - no persistence, if you are feeling nostalgic 😉

The cloud cache is free up to a quota. To use it, install the CLI tool:

```sh
curl -s https://raw.githubusercontent.com/uriva/rmmbr/main/cli/install.sh | sudo bash
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

```python
from rmmbr import cloud_cache

n_called = 0

@cloud_cache(
    "https://rmmbr.net",
    "your-service-token",
    "some name for the cache",
    60 * 60 * 24, # TTL is one day.
    "Cqq33cbHu9AEUaP_wS3LCDQN7wy40XKWzALoPHbU5S8=",
)
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
  url: "https://rmmbr.net",
  ttl: 60 * 60 * 24, // Values will expire after one day. Omission implies max (one week).
  encryptionKey: "your-encryption-key", // This can be omitted if you don't need e2ee.
});
```

## Pricing

| Tier        | Requests  | Total data stored | Max entry size | # Entries |
| ----------- | --------- | ----------------- | -------------- | --------- |
| Free        | 10,000    | 10 MB             | 1 KB           | 1000      |
| \$100/month | 1,000,000 | 1 GB              | 100 KB         | Unlimited |

## Regions

We currently deploy a backend in us-east region. Please post an issue if you have a need to configure this.

## Legal

- [Terms of service](legal/terms_of_service.md)
- [Privacy policy](legal/privacy_policy.md)
- [Service level agreement](legal/service_level_agreement.md)

## FAQ

### How do I sign up?

Download the cli and run:

```sh
rmmbr login
```

### How do I change tier?

We will contact you when your exceeds the free tier.
