# Secure Scraper App (Flask + WAF)

This Flask application provides a small scraping API protected by a demo Web Application Firewall (WAF). It is intended for educational/defensive demonstrations (blocking suspicious patterns, showing logs/monitoring, etc.).

## Key behavior

- Authentication is API-key based.
  - `GET /login` returns a JSON body containing an `x-api-key` value.
  - Protected endpoints require the request header `x-api-key: <key>`.

- Request logging is always on.
  - Logs are written to `data/request_logs.jsonl` and also kept in-memory for the current process.

- Scraped text is stored encrypted on disk.
  - `storage.py` encrypts blobs with Fernet using `FERNET_KEY`.
  - If `FERNET_KEY` is not provided via environment variable, the app creates/uses a persistent key file at `data/fernet.key` (under `DATA_PATH`).

- WAF controls are demo/dev-only.
  - `POST /waf/enable` and `POST /waf/disable` only work when `ENABLE_DEV_ENDPOINTS=1`.
  - `GET /waf/status` is always available and is used for health checks.

## Endpoints (overview)

- `GET /login` — returns `{"x-api-key": "..."}`.
- `POST /scrape` — scrape a URL (JSON body `{ "url": "https://..." }`), requires `x-api-key`.
- `GET /data` — returns the most recent scraped text for the API key, requires `x-api-key`.
- `GET /wordcloud` — generates/returns a wordcloud path for the API key, requires `x-api-key`.
- `GET /summary` — returns an LLM summary (if configured), requires `x-api-key`.
- `GET /logs` — returns recent request logs.
- `GET /monitoring` — returns a monitoring snapshot + recent logs.
- `GET /session/history` — returns the list of request log entry ids associated with the current Flask session cookie.

- `GET /waf/status` — returns WAF status, blocked IPs, and ML availability.
- `POST /waf/enable` — enable WAF (demo/dev-only; requires `ENABLE_DEV_ENDPOINTS=1`).
- `POST /waf/disable` — disable WAF (demo/dev-only; requires `ENABLE_DEV_ENDPOINTS=1`).

- `GET /keys` — returns the currently valid API keys (demo/dev-only; requires `ENABLE_DEV_ENDPOINTS=1`).

## Code layout

- `app.py` — Flask routes, request logging, and WAF invocation (`waf_check()` in a `before_request` hook).
- `waf.py` — signature-based rules + optional ML anomaly detector (IsolationForest when scikit-learn is installed).
- `scraper.py` — page fetch + text extraction.
- `storage.py` / `visualization.py` / `auth.py` / `config.py` — persistence, wordcloud generation, key management, and configuration.

## Running

### Via Docker Compose (recommended)

The repo’s Docker Compose setup runs the backend on the internal `backend:5000` network and exposes it to the host via the frontend nginx proxy at `http://localhost/api/*`.

### Local (without Docker)

- `pip install -r requirements.txt`
- `python -m playwright install chromium`
- `python app.py` (defaults to port 5000)

## Security notes

- The WAF is a demo. Do not treat it as production-grade security.
- Keep `ENABLE_DEV_ENDPOINTS` disabled in environments where WAF toggling and key listing should not be exposed.
