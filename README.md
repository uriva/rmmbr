`rmmbr` gives you a decorator you can place around async functions to have them be cached, locally or in the cloud.

Usage:

```sh
npm i rmmbr
```

```js
import { cloudCache, localCache } from "rmmbr";

const cacher = await localCache({ id: "some-id" });

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

If you want to persist across devices, there is also a free to use cloud service:

```js
const cacher = cloudCache({
  token: "service-token",
  url: "https://uriva-rmmbr.deno.dev",
});
```

As a free service, it comes with no guarantees, best effort only.

There is also a `memCache`, if you are feeling nostalgic 😉 and just want to store stuff in memory.

We accept issues for feature requests and SLA requests.

## Python

```sh
pip install rmmbr
```

Python largely works the same, with `mem_cache`, `local_cache` and `cloud_cache`.
