from hashlib import sha256

from cryptography.fernet import Fernet
from rmmbr.serialization import FunctionSerializer, Serializable

__all__ = ["generate_encryption_key", "EncryptorFunctionSerializer"]


def generate_encryption_key() -> str:
    return Fernet.generate_key().decode()


class EncryptorFunctionSerializer(FunctionSerializer):
    def __init__(self, key: str) -> None:
        self._encryptor = Fernet(key)
        self._salt = sha256(key.encode()).hexdigest()

    def serialize_arguments(self, *args: Serializable, **kwargs: Serializable) -> str:
        return super().serialize_arguments(*args, **kwargs) + self._salt

    def serialize_output(self, output: Serializable) -> str:
        output_str = super().serialize_output(output)
        return self._encrypt(output_str)

    def deserialize_output(self, data: str) -> Serializable:
        output_str = self._decrypt(data)
        return super().deserialize_output(output_str)

    def _encrypt(self, data: str) -> str:
        return self._encryptor.encrypt(data.encode()).decode()

    def _decrypt(self, data: str) -> str:
        return self._encryptor.decrypt(data.encode()).decode()
