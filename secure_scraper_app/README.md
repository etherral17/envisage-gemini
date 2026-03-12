# Secure Scraper App

This Flask application simulates a small web service with scraping capabilities and an integrated Web Application Firewall (WAF). It’s intended for educational and testing purposes, demonstrating encryption, logging, and anomaly detection.

## Components

- **`app.py`** – main Flask application. Exposes endpoints for:
  - `/login` – accepts credentials and sets an encrypted session cookie.
  - `/scrape` – accepts a URL to fetch (optionally using Playwright) and stores the extracted text under `data/extracted_text` and a generated wordcloud under `data/wordcloud`.
  - `/data`, `/wordcloud`, `/summary` – retrieval endpoints for stored content.
  - `/logs` – returns application request logs written to `data/request_logs.jsonl`.
  - `/session/history` – shows decrypted session data for the current cookie.
  - `/waf/enable` and `/waf/disable` – toggle the in‑memory WAF.
  - `/keys` – debug endpoint exposing the encryption key (for lab use).

  The file also contains hooks (`before_request` / `after_request`) for logging and invoking `waf.check_request`.

- **`waf.py`** – defines a signature‑based WAF with regex rules and an IsolationForest machine‑learning detector. It maintains a blacklist of IPs, reasons for blocking, and tracks request statistics for model training.

- **`scraper.py`** – performs HTTP GETs or runs Playwright to fetch and filter page content.

- **`storage.py`**, **`visualization.py`**, **`auth.py**, **`config.py`** – utility modules for encryption, file I/O, session management, and configuration (including persistent Fernet key handling and data path definitions).

- **`data/`** – directory where encrypted sessions, logs, extracted text, and wordcloud images are stored.

- **`requirements.txt`** – Python dependencies including Flask, Playwright, scikit-learn, etc.

- **Test scripts** –
  - `waf_test.py` – exercises signature and ML detections.
  - `toggle_test.py` – checks WAF toggle endpoints.
  - `inspect_logs.py` – reads and pretty‑prints the JSONL log file.

## Setup and Usage

1. Install dependencies: `pip install -r requirements.txt` and `python -m playwright install chromium`.
2. Launch the app: `python app.py`. It runs on port 5000 by default.
3. Use the endpoints to log in, scrape URLs, and observe WAF behaviour. See the testing scripts for examples of how to interact programmatically.

## Security Considerations

- The WAF logic and logs are intended for demonstration; they are not production‑grade.
- The stored Fernet key is persisted in `config.key` so that data remains decryptable across restarts. Keep it private.
- Logs and sessions are stored unencrypted in `data/` for ease of inspection.

This project serves as a learning platform for secure scraping, request filtering, and anomaly detection.