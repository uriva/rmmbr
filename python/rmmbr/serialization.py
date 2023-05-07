import json
from typing import Callable, Dict, List

__all__ = ["serialize_arguments", "serialize_output", "deserialize_output"]


Serializable = (
    str
    | int
    | float
    | bool
    | None
    | List["Serializable"]
    | Dict["Serializable", "Serializable"]
)


def serialize_arguments(*args, **kwargs):
    return json.dumps([args, kwargs], sort_keys=True)


serialize_output: Callable[[Serializable], str] = json.dumps

deserialize_output: Callable[[str], Serializable] = json.loads
