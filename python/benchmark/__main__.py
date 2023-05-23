import asyncio
import math
import os
import time
from functools import partial
from random import randrange

import rmmbr


def async_timeit(func):
    async def wrapper(*args, **kwargs):
        start_time = time.time()
        await func(*args, **kwargs)
        return time.time() - start_time

    return wrapper


cache = rmmbr.cloud_cache(
    "https://rmmbr.net",
    os.environ["RMMBR_API_KEY"],
    cache_id="my_function",
    encryption_key="vJuto475vumPorwvP2mFxRwqGq4aoqA2WP0vB1DMbVc=",
    ttl=None,
)


@async_timeit
@cache
async def mock_api_call(wait_time, in_str):
    await asyncio.sleep(wait_time)
    return in_str


async def count_time(func, iterations):
    return math.fsum([(await func()) for _ in range(iterations)]) * (1000 / iterations)


async def benchmark(input_strategy, iterations):
    print(
        f"   {iterations} iterations, cloud cached:    ",
        await count_time(lambda: mock_api_call(1, input_strategy()), iterations),
    )


IO_SIZE = 1024


def get_random_string():
    return "".join(chr(randrange(0, 256)) for _ in range(IO_SIZE))


aaaa = "A" * IO_SIZE

benchmark_all_read = partial(benchmark, lambda: aaaa)
benchmark_all_write = partial(benchmark, get_random_string)

if __name__ == "__main__":
    print("All read:")
    asyncio.run(benchmark_all_read(50))
    print("All write:")
    asyncio.run(benchmark_all_write(50))
