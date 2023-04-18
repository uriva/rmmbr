from rmmbr import cloud_cache, local_cache, mem_cache
import redis.asyncio as redis

import asyncio
import dotenv
import pathlib


def _cache_test_helper(n):
    async def inner(cacher):
        n_called = 0

        async def f(x):
            nonlocal n_called
            n_called += 1
            return await asyncio.sleep(0, x)

        f_cached = cacher(f)
        await f_cached(3)
        results = await asyncio.gather(*map(f_cached, [3, 3, 2, 1]))
        assert results == [3, 3, 2, 1]
        await cacher(f)(3)
        assert n_called == n

    return inner


def _rmdir(directory):
    directory = pathlib.Path(directory)
    for item in directory.iterdir():
        if item.is_dir():
            _rmdir(item)
        else:
            item.unlink()
    directory.rmdir()


async def test_local_cache():
    cacher = local_cache("some-id")
    await _cache_test_helper(3)(cacher)
    _rmdir("./.rmmbr")


async def test_memory_cache():
    await _cache_test_helper(4)(mem_cache)


def _env_param(s: str) -> str:
    value = dotenv.dotenv_values(".env")[s]
    assert value
    return value


async def _get_client():
    return await redis.Redis(
        password=_env_param("REDIS_PASSWORD"),
        host=_env_param("REDIS_URL"),
        port=int(_env_param("REDIS_PORT")),
    )


async def test_cloud_cache():
    redis_client = await _get_client()
    await redis_client.flushall()
    port = _env_param("PORT")
    await _cache_test_helper(3)(cloud_cache("some-token", f"http://localhost:{port}"))
