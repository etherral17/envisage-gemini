import os
import hashlib
from cryptography.fernet import Fernet
from config import DATA_PATH, FERNET_KEY, EXTRACTED_PATH

# reuse the app-wide Fernet key defined in config; do not generate a
# fresh key on each import, otherwise stored blobs become undecryptable
cipher = Fernet(FERNET_KEY)


def save_secure(api_key, data):
    # ensure both directories exist
    os.makedirs(EXTRACTED_PATH, exist_ok=True)
    # encrypted file in extracted_text subfolder
    filename = hashlib.sha256(api_key.encode()).hexdigest()
    encrypted = cipher.encrypt(data.encode())
    with open(f"{EXTRACTED_PATH}/{filename}.bin", "wb") as f:
        f.write(encrypted)


def load_secure(api_key):
    filename = hashlib.sha256(api_key.encode()).hexdigest()
    path = f"{EXTRACTED_PATH}/{filename}.bin"

    if not os.path.exists(path):
        raise FileNotFoundError(f"no stored data for key {api_key}")

    with open(path, "rb") as f:
        encrypted = f.read()

    decrypted = cipher.decrypt(encrypted).decode()
    return decrypted