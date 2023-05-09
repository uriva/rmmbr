from hashlib import sha256

from cryptography.fernet import Fernet as Encryptor

__all__ = [
    "generate_encryption_key",
    "encryptor_from_key",
    "salt_from_key",
    "privacy_preserving_hash",
    "encrypt",
    "decrypt",
    "Salt",
    "Encryptor",
]


Salt = bytes


def generate_encryption_key() -> str:
    return Encryptor.generate_key().decode()


def encryptor_from_key(key: str) -> Encryptor:
    return Encryptor(key)


def salt_from_key(key: str) -> Salt:
    return sha256(key.encode()).digest()


def privacy_preserving_hash(salt: Salt, data: str) -> str:
    return sha256(data.encode() + salt).hexdigest()


def encrypt(encryptor: Encryptor, data: str) -> str:
    return encryptor.encrypt(data.encode()).decode()


def decrypt(encryptor: Encryptor, data: str) -> str:
    return encryptor.decrypt(data.encode()).decode()
