import json
from hashlib import sha256
from typing import Dict, List

__all__ = ["Serializable", "FunctionSerializer"]


Serializable = (
    str
    | int
    | float
    | bool
    | None
    | List["Serializable"]
    | Dict["Serializable", "Serializable"]
)


class FunctionSerializer:
    def key_arguments(self, *args, **kwargs) -> str:
        return sha256(self.serialize_arguments(*args, **kwargs).encode()).hexdigest()

    def serialize_arguments(self, *args: Serializable, **kwargs: Serializable) -> str:
        return json.dumps([list(args), kwargs], sort_keys=True)

    def serialize_output(self, output: Serializable) -> str:
        return json.dumps(output)

    def deserialize_output(self, data: str) -> Serializable:
        return json.loads(data)
