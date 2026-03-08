from flask import Flask, request, jsonify, g, send_file
from flask_cors import CORS
from waf import waf_check
from auth import generate_api_key, validate_key, sessions
from scraper import scrape_page
from storage import save_secure, load_secure
from visualization import create_wordcloud
from llm import summarize

import os
import json
import datetime
import config
from config import DATA_PATH, WAF_ENABLED


# make sure data folder exists for logs
os.makedirs(DATA_PATH, exist_ok=True)
LOG_FILE = os.path.join(DATA_PATH, "request_logs.jsonl")
request_logs = []

app = Flask(__name__)
app.secret_key = config.SECRET_KEY  # required for session storage

# Enable CORS for all routes
CORS(app, resources={r"/*": {"origins": "*"}})


def _append_log(entry: dict):
    """Record a log entry in memory and on disk."""
    entry["timestamp"] = datetime.datetime.utcnow().isoformat()
    request_logs.append(entry)
    # append as json line
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(json.dumps(entry) + "\n")


@app.after_request
def log_response(response):
    # collect information about the just-handled request
    entry = {
        "ip": request.remote_addr,
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
    if action == "enable":
        config.WAF_ENABLED = True
    elif action == "disable":
        config.WAF_ENABLED = False
    else:
        return jsonify({"error": "unknown action"}), 400
    # log change and return current state
    _append_log({"event": "waf_toggle", "enabled": config.WAF_ENABLED})
    return jsonify({"waf_enabled": config.WAF_ENABLED})


@app.before_request
def security_layer():
    # skip the WAF for control/logging/image endpoints to avoid self‑blocking
    if request.path.startswith("/waf") or request.path.startswith("/logs") or request.path.startswith("/wordcloud/image"):
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

    # never enable this in production!  It's purely for debugging.
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
    app.run(debug=True, port=5000)