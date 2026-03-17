from flask import Flask, request, jsonify, g, send_file
from flask_cors import CORS
from waf import waf_check, get_waf_status, get_monitor_snapshot, unblock_ip
from auth import generate_api_key, validate_key, sessions
from scraper import scrape_page
from storage import save_secure, load_secure
from visualization import create_wordcloud
from llm import summarize

import os
import json
import datetime
import config
from config import DATA_PATH


# make sure data folder exists for logs
os.makedirs(DATA_PATH, exist_ok=True)
LOG_FILE = os.path.join(DATA_PATH, "request_logs.jsonl")
request_logs = []

app = Flask(__name__)
app.secret_key = config.SECRET_KEY  # required for session storage

# CORS is mainly useful during local dev (Vite dev server). In production,
# the frontend should proxy API requests via the same origin (nginx /api).
cors_origins = os.environ.get("CORS_ORIGINS", "").strip()
if cors_origins:
    origins = [o.strip() for o in cors_origins.split(",") if o.strip()]
    CORS(app, resources={r"/*": {"origins": origins}})


def _dev_endpoints_enabled() -> bool:
    return os.environ.get("ENABLE_DEV_ENDPOINTS", "").strip() == "1"


def _get_client_ip() -> str:
    """Best-effort client IP extraction.

    When running behind nginx, prefer forwarded headers. Fall back to Flask's
    request.remote_addr for non-proxied calls.
    """
    xff = (request.headers.get("X-Forwarded-For") or "").strip()
    if xff:
        first = xff.split(",")[0].strip()
        if first:
            return first
    x_real_ip = (request.headers.get("X-Real-IP") or "").strip()
    if x_real_ip:
        return x_real_ip
    return request.remote_addr or "0.0.0.0"


@app.errorhandler(403)
def handle_forbidden(error):
    """Return a JSON error body for WAF permission denials."""
    description = getattr(error, "description", None) or "request blocked"
    return jsonify({"error": "permission denied", "details": description}), 403


def _append_log(entry: dict):
    """Record a log entry in memory and on disk."""
    normalized = {
        "id": entry.get("id", len(request_logs)),
        "timestamp": entry.get("timestamp", datetime.datetime.now(datetime.timezone.utc).isoformat()),
        "ip": entry.get("ip", "system"),
        "method": entry.get("method", "SYSTEM"),
        "path": entry.get("path", entry.get("event", "system_event")),
        "status": int(entry.get("status", 200)),
        "args": entry.get("args", {}),
        "cookies": entry.get("cookies", {}),
        "headers": entry.get("headers", {}),
    }
    if "api_key" in entry:
        normalized["api_key"] = entry["api_key"]
    if "waf_reason" in entry:
        normalized["waf_reason"] = entry["waf_reason"]
    if "event" in entry:
        normalized["event"] = entry["event"]
    if "enabled" in entry:
        normalized["enabled"] = entry["enabled"]

    entry = normalized
    request_logs.append(entry)
    # append as json line
    try:
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(json.dumps(entry) + "\n")
    except Exception as e:
        # Never fail the request just because logging failed.
        print(f"[secure_scraper_app] failed to write log file: {e}")


@app.after_request
def log_response(response):
    # collect information about the just-handled request
    entry = {
        "ip": _get_client_ip(),
        "method": request.method,
        "path": request.path,
        "status": response.status_code,
        "args": request.args.to_dict(flat=True),
        "cookies": request.cookies,
        "headers": {k: v for k, v in request.headers.items()},
    }
    # attach API key/session if present
    api_key = request.headers.get("x-api-key")
    if api_key:
        entry["api_key"] = api_key
    # include any WAF reason saved in g
    if hasattr(g, "waf_reason"):
        entry["waf_reason"] = g.waf_reason

    # assign an identifier and store in session history
    entry_id = len(request_logs)
    entry["id"] = entry_id
    try:
        from flask import session
        session.setdefault("history", []).append(entry_id)
    except Exception:
        pass

    _append_log(entry)
    return response


@app.route("/logs", methods=["GET"])
def get_logs():
    """Return the stored request log entries."""
    # optionally support ?limit=N
    limit = request.args.get("limit", type=int)
    if limit:
        return jsonify(request_logs[-limit:])
    return jsonify(request_logs)


@app.route("/session/history", methods=["GET"])
def session_history():
    """Return the list of log entry ids for the current Flask session."""
    from flask import session
    history = session.get("history", [])
    return jsonify({"history": history})


@app.route("/waf/<action>", methods=["POST"])
def waf_control(action):
    """Toggle the WAF on/off at runtime (development only)."""
    if not _dev_endpoints_enabled():
        return jsonify({"error": "not found"}), 404
    if action == "enable":
        config.WAF_ENABLED = True
    elif action == "disable":
        config.WAF_ENABLED = False
    else:
        return jsonify({"error": "unknown action"}), 400
    # log change and return current state
    _append_log({"event": "waf_toggle", "enabled": config.WAF_ENABLED})
    return jsonify({"waf_enabled": config.WAF_ENABLED})


@app.route("/waf/unblock", methods=["POST"])
def waf_unblock():
    """Remove an IP from the WAF in-memory block list (development only)."""
    if not _dev_endpoints_enabled():
        return jsonify({"error": "not found"}), 404

    payload = request.get_json(silent=True) or {}
    ip = str(payload.get("ip", "")).strip()
    if not ip:
        return jsonify({"error": "ip is required"}), 400

    removed = unblock_ip(ip)
    _append_log({"event": "waf_unblock", "ip": ip, "status": 200 if removed else 404})
    return jsonify({
        **get_waf_status(),
        "removed": bool(removed),
    })


@app.route("/waf/status", methods=["GET"])
def waf_status():
    return jsonify(get_waf_status())


@app.route("/monitoring", methods=["GET"])
def monitoring():
    limit = request.args.get("limit", default=50, type=int)
    recent_logs = request_logs[-limit:] if limit and limit > 0 else request_logs
    # Return newest -> oldest so the UI shows the most recent requests first.
    # (request_logs is append-only, so reversing is sufficient and stable.)
    recent_logs = list(reversed(recent_logs))

    # enrich with values derived from logs for dashboard cards
    success_requests = len([entry for entry in request_logs if 200 <= entry.get("status", 0) < 300])
    failed_requests = len([entry for entry in request_logs if entry.get("status", 0) >= 400])

    monitor = get_monitor_snapshot()
    monitor["success_requests"] = success_requests
    monitor["failed_requests"] = failed_requests
    monitor["total_logs"] = len(request_logs)

    return jsonify({
        "monitor": monitor,
        "logs": recent_logs,
    })


@app.before_request
def security_layer():
    # Always allow CORS preflight requests.
    if request.method == "OPTIONS":
        return "", 200

    # skip the WAF for control/logging/image endpoints to avoid self‑blocking
    if (
        request.path.startswith("/waf")
        or request.path.startswith("/logs")
        or request.path.startswith("/monitoring")
        or request.path.startswith("/session/history")
        or request.path.startswith("/login")
        or request.path.startswith("/wordcloud/image")
    ):
        return
    # the WAF may set g.waf_reason for logging
    waf_check()


@app.route("/login", methods=["GET"])
def login():

    api_key = generate_api_key()

    return jsonify({
        "x-api-key": api_key
    })


@app.route("/keys", methods=["GET"])
def list_keys():
    """Dev endpoint returning the currently-valid API keys."""

    if not _dev_endpoints_enabled():
        return jsonify({"error": "not found"}), 404
    return jsonify({"keys": list(sessions.keys())})


@app.route("/scrape", methods=["POST"])
def scrape():

    api_key = request.headers.get("x-api-key")

    if not validate_key(api_key):
        return jsonify({"error": "invalid key"}), 401

    url = request.json["url"]

    text = scrape_page(url)

    print("Extracted:", text[:500])   # debug output

    if len(text) < 50:
        return jsonify({"error": "No text extracted"}), 400

    save_secure(api_key, text)

    return jsonify({
        "message": "data scraped",
        "length": len(text)
    })


@app.route("/wordcloud", methods=["GET"])
def wordcloud():

    api_key = request.headers.get("x-api-key")
    if not validate_key(api_key):
        return jsonify({"error": "invalid key"}), 401

    try:
        text = load_secure(api_key)
    except FileNotFoundError:
        return jsonify({"error": "no scraped data for this key"}), 404
    except Exception as e:
        # any other decryption problem
        return jsonify({"error": "unable to load data", "details": str(e)}), 500

    if not text.strip():
        return jsonify({"error": "stored text is empty"}), 400

    try:
        img = create_wordcloud(text, api_key)
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400

    return jsonify({
        "wordcloud_path": f"/wordcloud/image/{api_key}"
    })


@app.route("/wordcloud/image/<api_key>", methods=["GET"])
def serve_wordcloud(api_key):
    """Serve the wordcloud image for the given API key."""
    # Skip WAF for image serving
    from config import WORDCLOUD_PATH
    filepath = os.path.join(WORDCLOUD_PATH, f"{api_key}_wordcloud.png")
    
    if not os.path.exists(filepath):
        return jsonify({"error": "wordcloud not found"}), 404

    try:
        return send_file(filepath, mimetype='image/png')
    except Exception as e:
        return jsonify({"error": "failed to serve image", "details": str(e)}), 500


@app.route("/data", methods=["GET"])
def get_data():
    """Return the raw text stored for the provided API key."""

    api_key = request.headers.get("x-api-key")
    if not validate_key(api_key):
        return jsonify({"error": "invalid key"}), 401

    try:
        text = load_secure(api_key)
    except FileNotFoundError:
        return jsonify({"error": "no scraped data for this key"}), 404
    except Exception as e:
        return jsonify({"error": "unable to load data", "details": str(e)}), 500

    return jsonify({"text": text})


@app.route("/summary", methods=["GET"])
def summary():

    api_key = request.headers.get("x-api-key")

    if not validate_key(api_key):
        return jsonify({"error": "invalid key"}), 401

    text = load_secure(api_key)

    summary = summarize(text)

    return jsonify({
        "summary": summary
    })


if __name__ == "__main__":
    print("[secure_scraper_app] starting patched backend (WAF login/OPTIONS exemptions enabled)")
    debug = os.environ.get("FLASK_DEBUG", "").strip() == "1"
    port = int(os.environ.get("PORT", "5000"))
    app.run(host="0.0.0.0", debug=debug, use_reloader=False, port=port)