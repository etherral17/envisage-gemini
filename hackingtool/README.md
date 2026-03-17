# Streamlit Security Dashboard (Expo WAF Demo)

This folder contains a Streamlit app used to demonstrate the Secure Scraper backend’s WAF behavior in a controlled environment.

The UI is designed for an educational/defensive demo: it triggers harmless signature tests (SQLi/XSS patterns) and shows whether the backend WAF blocks them.

## What’s in this folder

- `main.py` — “Expo WAF Demo — Secure Scraper WAF” Streamlit app.
  - Tabs: **WAF Tester** and **About**.
  - Target configuration: backend base URL, request timeout, TLS verification toggle.
  - Authentication helper: `GET /login` to obtain an `x-api-key` for protected endpoints.
  - Demo controls: `POST /waf/enable` and `POST /waf/disable`.
  - Test cases: XSS/SQLi signature triggers and `GET /monitoring` snapshot.

- `tool.py` — a generic API testing utility UI (send arbitrary HTTP requests and inspect response metadata).

- `requirements.txt` — Python dependencies.

## Running

### Option A — Run via Docker Compose (recommended)

From the repo root:

- `docker compose up -d --build`
- Open Streamlit: `http://localhost:8501`

In Docker Compose, the app uses `BACKEND_BASE_URL` (default `http://backend:5000`).

### Option B — Run locally (without Docker)

- `pip install -r hackingtool/requirements.txt`
- `streamlit run hackingtool/main.py`

If the backend is running behind the frontend nginx proxy, set the **Backend base URL** to `http://localhost/api` (so `GET /waf/status` becomes `http://localhost/api/waf/status`).

## Notes / Safety

- Use only on systems you are authorized to test.
- The WAF toggle endpoints (`/waf/enable`, `/waf/disable`) are intended for demo/dev use and may be disabled by configuration in some deployments.
