import hashlib
import uuid
import json
import os
from config import DATA_PATH

sessions = {}
SESSIONS_FILE = os.path.join(DATA_PATH, "sessions.json")


def _load_sessions():
    os.makedirs(DATA_PATH, exist_ok=True)
    if not os.path.exists(SESSIONS_FILE):
        return
    try:
        with open(SESSIONS_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            if isinstance(data, dict):
                sessions.update(data)
    except Exception:
        # keep app usable even if session file is malformed
        pass


def _save_sessions():
    os.makedirs(DATA_PATH, exist_ok=True)
    with open(SESSIONS_FILE, "w", encoding="utf-8") as f:
        json.dump(sessions, f)


_load_sessions()


def generate_api_key():

    session_id = str(uuid.uuid4())

    api_key = hashlib.sha256(session_id.encode()).hexdigest()

    sessions[api_key] = {
        "session_id": session_id
    }
    _save_sessions()

    return api_key


def validate_key(api_key):
    """Return True if the provided key is known.

    This logs the stored keys for debugging.  The log entry is printed
    using Flask's logger when the validation function is called from within a
    request context.
    """
    try:
        # avoid importing flask globally (which would create a circular
        # dependency in our simple structure).
        from flask import current_app
        current_app.logger.debug("validate_key called with %s, sessions=%s", api_key, list(sessions.keys()))
    except Exception:
        pass

    return bool(api_key) and api_key in sessions