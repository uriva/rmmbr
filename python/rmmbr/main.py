import json
import os
from typing import Callable, Optional

import aiofiles
import httpx
from aiofiles import os as aiofiles_os
from rmmbr.crypto import EncryptorFunctionSerializer
from rmmbr.serialization import FunctionSerializer, Serializable


async def _write_string_to_file(file_path, s):
    await aiofiles_os.makedirs(os.path.dirname(file_path), exist_ok=True)
    async with aiofiles.open(file_path, mode="w") as f:
        await f.write(s)


def _path_to_cache(name):
    return f".rmmbr/{name}.json"


def _serialize(x):
    return json.dumps(list(x.items()))


async def _read_file_with_default(default_f, file_path):
    try:
        async with aiofiles.open(file_path) as f:
            return await f.read()
    except FileNotFoundError:
        return default_f()


def _deserialize(s):
    return dict(json.loads(s))


def _abstract_cache_params(key, f, read, write):
    async def func(*args, **kwargs):
        key_result = key(*args, **kwargs)
        value = await read(key_result)
        if value is not None:
            return value
        y = await f(*args, **kwargs)
        await write(key_result, y)
        return y

    return func


def mem_cache(f):
    cache = {}
    serializer = FunctionSerializer()

    async def func(*args, **kwargs):
        key_result = serializer.key_arguments(*args, **kwargs)
        if key_result in cache:
            return cache[key_result]
        y = await f(*args, **kwargs)
        cache[key_result] = y
        return y

    return func


def _make_local_read_write(name: str):
    def default_f():
        return _serialize({})

    file_path = _path_to_cache(name)
    cache = None

    async def get_cache():
        nonlocal cache
        if cache:
            return cache
        cache = _deserialize(await _read_file_with_default(default_f, file_path))
        return cache

    async def read(key: _Key):
        return (await get_cache()).get(key, None)

    async def write(key: _Key, value):
        cache = await get_cache()
        cache[key] = value
        await _write_string_to_file(file_path, _serialize(cache))

    return read, write


def local_cache(id: str):
    serializer = FunctionSerializer()
    read, write = _make_local_read_write(id)
    return lambda f: _abstract_cache_params(
        serializer.key_arguments, f, read, write
    )


async def _call_api(url: str, token: str, method: str, params):
    async with httpx.AsyncClient() as client:
        response = await client.post(
            url=url,
            json={
                "method": method,
                "params": params,
            },
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {token}",
            },
        )
        return response.json()


def _set_remote(
    token: str, url: str, ttl: Optional[int], serialize: Callable[[Serializable], str]
):
    async def func(key, value):
        value = serialize(value)
        params = {"key": key, "value": value}
        if ttl is not None:
            params["ttl"] = ttl
        await _call_api(url, token, "set", params)

    return func


_Key = str


def _get_remote(token: str, url: str, deserialize: Callable[[str], Serializable]):
    async def func(key: _Key):
        value = await _call_api(url, token, "get", {"key": key})
        if value is not None:
            value = deserialize(value)
        return value

    return func


def cloud_cache(
    token: str,
    url: str,
    ttl: Optional[int] = None,
    encryption_key: Optional[str] = None,
):
    if encryption_key is not None:
        serializer = EncryptorFunctionSerializer(encryption_key)
    else:
        serializer = FunctionSerializer()

    def inner_func(f):
        return _abstract_cache_params(
            serializer.key_arguments,
            f,
            _get_remote(token, url, serializer.deserialize_output),
            _set_remote(token, url, ttl, serializer.serialize_output),
        )

    return inner_func
