# Envisage — Secure Scraper + WAF Demo

This repo is an educational/defensive demo platform that shows how a simple Web Application Firewall (WAF) can detect and block suspicious request patterns, and how those blocks appear in monitoring/logs.

## Services (Docker Compose)

- **Frontend (React + nginx)**
  - URL: `http://localhost`
  - Proxies API requests from the browser from `/api/*` → `backend:5000/*`

- **Streamlit dashboard (Security Testing UI)**
  - URL: `http://localhost:8501`
  - Used to trigger safe WAF signature tests (SQLi/XSS patterns) and view monitoring

- **Backend (Flask + WAF + scraping + monitoring)**
  - Listens on `5000` inside the compose network
  - Not published directly to the host by default; access it via `http://localhost/api/*` (nginx proxy)

## Quick start

From the repo root:

- `docker compose up -d --build`
- Open `http://localhost` (frontend)
- Open `http://localhost:8501` (Streamlit)

To stop everything:

- `docker compose down --remove-orphans`

## How authentication works

- `GET /login` returns a JSON body containing an `x-api-key`.
- Send that key in the request header `x-api-key` for protected endpoints (for example `/scrape`, `/data`, `/wordcloud`, `/summary`).

## WAF endpoints

- `GET /waf/status` — always available (used by health checks).
- `POST /waf/enable` and `POST /waf/disable` — **demo/dev endpoints**.

In this repo’s Docker Compose configuration, these dev endpoints are enabled by default for the expo demo.
If you want them disabled, set `ENABLE_DEV_ENDPOINTS` to blank/`0` for the backend service.

## PowerShell notes (Windows)

In PowerShell, use `curl.exe` (not `curl`) to avoid `Invoke-WebRequest` parameter differences.

Example checks (through nginx proxy):

- `curl.exe -sS http://localhost/api/waf/status`
- `curl.exe -sS -X POST http://localhost/api/waf/disable`
- `curl.exe -sS http://localhost/api/waf/status`

## Repo docs

- Backend docs: see `secure_scraper_app/README.md`
- Streamlit docs: see `hackingtool/README.md`
- Frontend docs: see `frontend/app/README.md`

## Safety

Use only on systems you are authorized to test. The included WAF tests are designed to be safe signature demonstrations, but you should still run this stack in a controlled environment.
