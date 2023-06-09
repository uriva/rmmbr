import asyncio
from functools import partial
import json
import os
from hashlib import sha256
from typing import Callable, Optional

import aiofiles
import httpx
from aiofiles import os as aiofiles_os
from rmmbr.crypto import (
    Encryptor,
    decrypt,
    encrypt,
    encryptor_from_key,
    privacy_preserving_hash,
)
from rmmbr.serialization import (
    Serializable,
    deserialize_output,
    serialize_arguments,
    serialize_output,
)


def _key_arguments(*args, **kwargs) -> str:
    return sha256(serialize_arguments(*args, **kwargs).encode()).hexdigest()


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


_cache_background_writes = set()


def _abstract_cache_params(key, f, read, write):
    async def func(*args, **kwargs):
        key_result = key(*args, **kwargs)
        value = await read(key_result)
        if value is not None:
            return value
        y = await f(*args, **kwargs)
        bg_write = asyncio.create_task(write(key_result, y))
        # Avoid premature garbage collection, see notes:
        # https://docs.python.org/3/library/asyncio-task.html#asyncio.create_task
        _cache_background_writes.add(bg_write)
        bg_write.add_done_callback(_cache_background_writes.discard)

        return y

    return func


def wait_all_writes():
    return asyncio.gather(*_cache_background_writes, return_exceptions=True)


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


def _local_cache(cache_id: str):
    read, write = _make_local_read_write(cache_id)
    return lambda f: _abstract_cache_params(_key_arguments, f, read, write)


class RmmbrAuthError(Exception):
    pass


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
        if response.status_code == 401:
            raise RmmbrAuthError(
                "rmmbr authentication failure. Is the API token valid?"
            )
        return response.json()


def _set_remote(
    url: str,
    token: str,
    cache_id: str,
    ttl: Optional[int],
    serialize: Callable[[Serializable], str],
):
    async def func(key, value):
        params = {"key": key, "value": serialize(value), "cacheId": cache_id}
        if ttl is not None:
            params["ttl"] = ttl
        await _call_api(url, token, "set", params)

    return func


_Key = str


def _get_remote(
    url: str, token: str, cache_id: str, deserialize: Callable[[str], Serializable]
):
    async def func(key: _Key):
        value = await _call_api(url, token, "get", {"key": key, "cacheId": cache_id})
        if value is not None:
            value = deserialize(value)
        return value

    return func


def _private_key_arguments(salt: bytes, *args, **kwargs):
    return privacy_preserving_hash(salt, serialize_arguments(*args, **kwargs))


def _serialize_and_encrypt_output(encryptor: Encryptor, output: Serializable) -> str:
    return encrypt(encryptor, serialize_output(output))


def _decrypt_and_deserialize_output(encryptor: Encryptor, data: str) -> Serializable:
    return deserialize_output(decrypt(encryptor, data))


def cache(
    cache_id: str,
    ttl: Optional[int],
    encryption_key: Optional[str],
    url: Optional[str],
    token: Optional[str],
):
    if not token or not url:
        return _local_cache(cache_id)
    if encryption_key is not None:
        encryptor = encryptor_from_key(encryption_key.encode())
        key_arguments_func = partial(_private_key_arguments, encryption_key.encode())
        serialize_output_func = partial(_serialize_and_encrypt_output, encryptor)
        deserialize_output_func = partial(_decrypt_and_deserialize_output, encryptor)

    else:
        key_arguments_func = _key_arguments
        serialize_output_func = serialize_output
        deserialize_output_func = deserialize_output

    def inner_func(f):
        return _abstract_cache_params(
            key_arguments_func,
            f,
            _get_remote(url, token, cache_id, deserialize_output_func),
            _set_remote(url, token, cache_id, ttl, serialize_output_func),
        )

    return inner_func
