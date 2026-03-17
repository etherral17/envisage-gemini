# Frontend (React + Vite)

This is the browser UI for the Secure Scraper + WAF demo. It provides a simple login flow (API key) and dashboard-style views for monitoring, logs, scraping, and WAF status.

## API connectivity

In Docker Compose, the built frontend is served by nginx and proxies API requests from the browser:

- Browser calls `http://localhost/api/...`
- nginx forwards `/api/*` to the `backend:5000` service

The frontend uses `VITE_API_BASE_URL` (build-time) and defaults to `/api`.

## Running

### Via Docker Compose (recommended)

From the repo root:

- `docker compose up -d --build`
- Open: `http://localhost`

### Local dev server (Vite)

From this folder:

- `npm ci`
- `npm run dev`

By default, the backend enables CORS for `http://localhost:5173` (see `CORS_ORIGINS`).
For local development you can set `VITE_API_BASE_URL` to either:

- `http://localhost:5000` (if you run the backend locally on the host), or
- `http://localhost/api` (if you are using the nginx proxy on port 80).
