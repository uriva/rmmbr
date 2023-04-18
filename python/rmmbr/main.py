import os
import json
import hashlib
import httpx
import aiofiles
from aiofiles import os as aiofiles_os


async def _write_string_to_file(file_path, s):
    await aiofiles_os.makedirs(os.path.dirname(file_path), exist_ok=True)
    async with aiofiles.open(file_path, mode="w") as f:
        await f.write(s)


def _path_to_cache(name):
    return f".rmmbr/{name}.json"


def _hash(x):
    hasher = hashlib.sha256()
    hasher.update(x.encode())
    return hasher.hexdigest()


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
    async def func(x):
        key_result = key(x)
        value = await read(key_result)
        if value is not None:
            return value
        y = await f(x)
        await write(key_result, y)
        return y

    return func


def _key(x):
    return _hash(json.dumps(x, separators=(",", ":"), sort_keys=True))


def mem_cache(f):
    cache = {}

    async def func(x):
        key_result = _key(x)
        if key_result in cache:
            return cache[key_result]
        y = await f(x)
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

    async def read(key: Key):
        return (await get_cache()).get(key, None)

    async def write(key: Key, value):
        cache = await get_cache()
        cache[key] = value
        await _write_string_to_file(file_path, _serialize(cache))

    return read, write


def local_cache(id: str):
    read, write = _make_local_read_write(id)
    return lambda f: _abstract_cache_params(_key, f, read, write)


async def _post_json(url: str, payload):
    async with httpx.AsyncClient() as client:
        response = await client.post(
            url=url,
            json=payload,
            headers={"content_type": "application/json"},
        )
        return response.json()


async def _call_api(url: str, method: str, params):
    return await _post_json(url, {"method": method, "params": params})


def _set_remote(id: str, url: str):
    async def func(key, value):
        await _call_api(url, "set", {"id": id, "key": key, "value": value})

    return func


Key = str


def _get_remote(id: str, url: str):
    async def func(key: Key):
        return await _call_api(url, "get", {"id": id, "key": key})

    return func


def cloud_cache(token: str, url: str):
    def inner_func(f):
        return _abstract_cache_params(
            _key, f, _get_remote(token, url), _set_remote(token, url)
        )

    return inner_func
