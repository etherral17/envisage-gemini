import hashlib
import uuid

sessions = {}


def generate_api_key():

    session_id = str(uuid.uuid4())

    api_key = hashlib.sha256(session_id.encode()).hexdigest()

    sessions[api_key] = {
        "session_id": session_id
    }

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
    except ImportError:
        pass

    return api_key in sessions