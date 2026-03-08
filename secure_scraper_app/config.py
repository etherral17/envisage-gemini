import os

WAF_ENABLED = True

SECRET_KEY = "super_secret_key"

ALLOWED_DOMAINS = [
    "en.wikipedia.org",
    "bbc.com",
    "nytimes.com"
]

DATA_PATH = "data/"

# subdirectories within DATA_PATH
EXTRACTED_PATH = os.path.join(DATA_PATH, "extracted_text")
WORDCLOUD_PATH = os.path.join(DATA_PATH, "wordcloud")

# ----------- Fernet key handling ------------------------------------------------
# Persistent encryption key that survives restarts.  The key is stored in
# ``<DATA_PATH>/fernet.key`` or may be supplied via the FERNET_KEY
# environment variable for deployments (e.g. containers, CI).

from cryptography.fernet import Fernet
import os


def _load_or_create_fernet_key() -> bytes:
    """Return the same key every time by reading/creating a file.

    The file is created on first invocation and subsequently read; if
    ``DATA_PATH`` does not exist it will be created as well.
    """
    key_path = os.path.join(DATA_PATH, "fernet.key")
    if os.path.exists(key_path):
        return open(key_path, "rb").read()
    os.makedirs(DATA_PATH, exist_ok=True)
    key = Fernet.generate_key()
    with open(key_path, "wb") as f:
        f.write(key)
    return key


# exported constant used by storage.py
FERNET_KEY = os.environ.get("FERNET_KEY")
if FERNET_KEY is None:
    FERNET_KEY = _load_or_create_fernet_key()
else:
    if isinstance(FERNET_KEY, str):
        FERNET_KEY = FERNET_KEY.encode()