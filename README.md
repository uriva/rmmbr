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

There is also a `memCache`, if you are feeling nostalgic 😉 and just want to store stuff in memory.

If you want to persist across devices, we offer a free to use cloud service:

```js
const cacher = cloudCache({
  token: "service-token",
  url: "https://uriva-rmmbr.deno.dev",
});
```

At the moment this service is with no guarantees, but we are working on a production tier as well. Please contact us or post an issue if you want to try it out!

We also accept issues for feature requests 👩‍🔧

## Python

```sh
pip install rmmbr
```

The python api mimicks the js one, with exported decorators named `mem_cache`, `local_cache` and `cloud_cache`.
