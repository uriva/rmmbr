from hashlib import sha256

from cryptography.fernet import Fernet as Encryptor

__all__ = [
    "encryptor_from_key",
    "privacy_preserving_hash",
    "encrypt",
    "decrypt",
    "Encryptor",
]


encryptor_from_key = Encryptor


def privacy_preserving_hash(salt: bytes, data: str) -> str:
    return sha256(data.encode() + salt).hexdigest()


def encrypt(encryptor: Encryptor, data: str) -> str:
    return encryptor.encrypt(data.encode()).decode()


def decrypt(encryptor: Encryptor, data: str) -> str:
    return encryptor.decrypt(data.encode()).decode()
