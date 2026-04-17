# rmmbr

![rmmbr](https://media.tenor.com/NcnMXggTODAAAAAC/yeah-i-member-memberberries.gif)

`rmmbr` is the simplest way to persistently cache async functions, locally or in
the cloud with end to end encryption (e2ee).

Most importantly, it does not require any DevOps work, or cloud configurations.
It just works.

## Motivation

Caching is a great way to save costs and time calling remote APIs.

Most programming languages already have solutions for in-memory caching. These
work well if your service is long-running on one machine. However, if your
service restarts, then you lose your cache. In addition if you are running more
than one instance, they don't share caches.

Making caches persistent across runs requires deploying another service which
writes to disk or to a database. This means to set it up is a substantial
context switch for the developer. The last thing you want to think of while
doing unrelated work is another service to maintain, and how to write code to
communicate to this service.

As this use case is quite common, it would be desired to have an easy way to do
it, right from your command line and code editor, and without any context
switching.

## Usage

`rmmbr` provides APIs in Python and JavaScript/TypeScript.

If token is provided, the library will persist the cache across devices,
otherwise everything would be stored in a file under a `.rmmbr` directory.

Install the CLI tool:

```sh
curl -s https://raw.githubusercontent.com/uriva/rmmbr/main/cli/install.sh | sudo bash
```

Produce a service token:

```sh
rmmbr login
rmmbr token -g
```

For sensitive data, you can e2e encrypt it by adding an encryption key
parameter.

Produce an encryption key:

```sh
rmmbr secret
```

### Python

Here's a python example showing use with OpenAI's API.

Try running this twice. In the second time you will notice no print occurs.

```sh
pip install rmmbr
pip install openai
```

```python
import asyncio
import openai
import rmmbr

openai.api_key = "<your openai api key>"


@rmmbr.cache(
    "grammar checks cache",
    60 * 60 * 24, # TTL is one day.
    "Cqq33cbHu9AEUaP_wS3LCDQN7wy40XKWzALoPHbU5S8=",  # encryption key, or None if not required
    "https://rmmbr.net",
    "<your rmmbr api key>",
)
async def fix_grmmar(sentence: str):
    print("sending request to openai")
    return await openai.Completion.acreate(
        model="text-davinci-003",
        prompt="Correct this to standard English:\n\n" + sentence,
        temperature=0,
        max_tokens=60,
        top_p=1.0,
        frequency_penalty=0.0,
        presence_penalty=0.0,
    )


async def main():
    print(await fix_grmmar("She no went to the market."))
    # This is required only if you want to make sure a cache write occurs before
    # the program ends.
    await rmmbr.wait_all_writes()


asyncio.run(main())
```

If you're writing tests and get a message about unresolved promises, this can
happen if your tests end before all writes.

In these cases you can use

```py
from rmmbr import wait_all_writes
# After test completion
await wait_all_writes()
```

### Javascript / Typescript

Add to your `deno.json` imports:

```json
{
  "imports": {
    "rmmbr": "jsr:@uri/rmmbr@0.1.0"
  }
}
```

```js
import { cache } from "rmmbr";

const cacher = cache({
  cacheId: "some name for the cache",
  ttl: 60 * 60 * 24, // Values will expire after one day. Omission implies max (one week).
  token: "service-token",
  url: "https://rmmbr.net",
  encryptionKey: "your-encryption-key", // This can be omitted if you don't need e2ee.
});

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

If you're writing tests and get a message about unresolved promises, this can
happen if your tests end before all writes.

In these cases you can use

```js
import { waitAllWrites } from "rmmbr";
// After test completion
await waitAllWrites();
```

#### Custom key function

By default, `rmmbr` will generate a cache key for you, from any serializable
simple json object. If you want to override this behaviour, you can give your
own key function, which should get the same parameters as your function, and
return any simple json object.

For example:

```ts
const f = cache({
  cacheId: "some id",
  customKeyFn: (x) => x % 2 === 0, // check if x is even or odd
})((x: number, y: number) => Promise.resolve(x));

await f(1);
await f(1); // identical call, will use cache
await f(3); // odd number, and the custom ket function treats it the same as `1`, so will use the cache
await f(2); // would cause a call, because 2 is even
```

## Pricing

| Tier        | Requests  | Total data stored | Max entry size | # Entries |
| ----------- | --------- | ----------------- | -------------- | --------- |
| Free        | 10,000    | 10 MB             | 1 KB           | 1000      |
| \$100/month | 1,000,000 | 1 GB              | 100 KB         | Unlimited |

## Regions

We currently deploy a backend in us-east region. Please post an issue if you
have a need to configure this.

## Legal

- [Terms of service](legal/terms_of_service.md)
- [Privacy policy](legal/privacy_policy.md)
- [Service level agreement](legal/service_level_agreement.md)

## InstantDB token registry

New token management should treat InstantDB as the source of truth for user-owned
service tokens.

The initial InstantDB model lives in [landing-page/instant.schema.ts](landing-page/instant.schema.ts)
and [landing-page/instant.perms.ts](landing-page/instant.perms.ts).

Current shape:

- `$users` is the identity owner table provided by InstantDB auth
- `serviceTokens` stores token hashes and token metadata
- each `serviceTokens` record belongs to exactly one `$users` record

Raw token values should be returned once at creation time and never stored in
plaintext. Redis should remain the hot-path cache for token validation and cache
payloads.

### Token manager UI

The landing page now includes a token manager at `/tokens`.

It supports:

- email magic-code auth via InstantDB
- creating service tokens (stores hash only)
- listing and revoking existing tokens
- deleting tokens

Required frontend env var:

- `VITE_INSTANT_APP_ID` (in `landing-page/.env.local`)

Optional frontend env var:

- `VITE_INSTANTDB_APP_URL` (defaults to `/tokens`)

### Backend verification path

Server auth for cache operations now follows this order:

1. Legacy Redis token map (`api-token:<raw-token>`) for backward compatibility
2. Redis auth cache for InstantDB token hashes
3. InstantDB admin query for cache misses

If an InstantDB token is valid, the resolved user id is cached in Redis to avoid
querying InstantDB on every cache request.

Required server env vars for Instant-backed verification:

- `INSTANT_APP_ID`
- `INSTANT_ADMIN_TOKEN`

Optional env vars:

- `INSTANT_TOKEN_CACHE_TTL_SECONDS` (default `300`)

## InstantDB schema CI

This repository includes a GitHub Actions workflow at
`.github/workflows/instantdb-schema.yml` that pushes InstantDB schema and
permissions updates.

It runs automatically on pushes to `main` when an `instant.schema.ts` or
`instant.perms.ts` file changes, and can also be triggered manually from the
Actions tab.

Required repository secrets:

- `INSTANT_APP_ID`: your Instant app id
- `INSTANT_CLI_TOKEN`: an auth token from `npx instant-cli login --print`

Manual run option:

- `instant_dir`: optional directory containing `instant.schema.ts` and `instant.perms.ts`

## FAQ

### How do I sign up?

Download the cli and run:

```sh
rmmbr login
```

### How do I change tier?

We will contact you when your exceeds the free tier.
