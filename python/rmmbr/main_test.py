import asyncio
import pathlib

import dotenv
import redis.asyncio as redis

from rmmbr import cache, wait_all_writes


def _cache_test_helper(instance_implies_new_cache: bool, expires_after_2_seconds: bool):
    async def inner(cacher):
        n_called = 0

        async def f(x):
            nonlocal n_called
            n_called += 1
            return await asyncio.sleep(0, x)

        f_cached = cacher(f)
        await f_cached(3)
        results = []
        for n in [3, 3, 2, 1]:
            await wait_all_writes()
            results.append(await f_cached(n))
        assert results == [3, 3, 2, 1]
        await cacher(f)(3)
        await wait_all_writes()
        assert n_called == (4 if instance_implies_new_cache else 3)
        n_called = 0
        await asyncio.sleep(2)
        await f_cached(3)
        await wait_all_writes()
        assert n_called == (1 if expires_after_2_seconds else 0)

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
    await _cache_test_helper(False, False)(cache("some-id", None, None, None, None))
    _rmdir("./.rmmbr")


def _env_param(s: str) -> str:
    value = dotenv.dotenv_values(".env")[s]
    assert value
    return value


async def _clean_redis():
    redis_client = await redis.Redis(
        password=_env_param("REDIS_PASSWORD"),
        host=_env_param("REDIS_URL"),
        port=int(_env_param("REDIS_PORT")),
    )
    await redis_client.flushall()
    await redis_client.set("api-token:some-token", "testing|my-uid")


_port = _env_param("PORT")
_mock_backend_url = f"http://localhost:{_port}"


async def test_cloud_cache():
    await _clean_redis()
    await _cache_test_helper(False, False)(
        cache(
            "my_function_name",
            None,
            None,
            _mock_backend_url,
            "some-token",
        )
    )


async def test_cloud_cache_expiration():
    await _clean_redis()
    await _cache_test_helper(False, True)(
        cache("my_function_name", 1, None, _mock_backend_url, "some-token")
    )


async def test_cloud_cache_encryption():
    await _clean_redis()
    await _cache_test_helper(False, False)(
        cache(
            "my_function_name",
            None,
            "Cqq33cbHu9AEUaP_wS3LCDQN7wy40XKWzALoPHbU5S8=",
            _mock_backend_url,
            "some-token",
        )
    )
