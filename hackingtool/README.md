# Ethical Hacking Tool

This repository folder contains a Streamlit‑based proof‑of‑concept application designed to assist with penetration testing exercises. It is not intended for malicious use.

## Components

- **`main.py`** – Streamlit app presenting three tabs:
  - **Payload Execution**: Run arbitrary shell payloads over SSH against a configured host using `paramiko`.
  - **API Testing**: Send JSON payloads to a target URL, useful for fuzzing or exploiting HTTP APIs.
  - **Session Stealer**: Demonstrates how a session cookie can be obtained from a vulnerable target and reused; includes fields to login, display a stolen cookie, replay it against the target, and fetch decrypted session details. Designed for use with the `secure_scraper_app` service.

- **`requirements.txt`** – lists Python dependencies required for running the tool (`streamlit`, `paramiko`, etc.).

- **`test_cookie.py`** – simple script that exercises the `secure_scraper_app` login and session endpoints to verify stolen‑cookie replay.

- **`.gitignore`** – ignores common Python environment artifacts and generated files.

## Usage

1. Install dependencies: `pip install -r requirements.txt`.
2. Start the Streamlit app: `cd hackingtool && streamlit run main.py`.
3. Follow the UI described above for different penetration tasks.

## Notes

- The app includes hard‑coded examples and should only be used in isolated, lab environments.
- The session stealer tab assumes the existence of a companion service (`secure_scraper_app`) listening on `http://localhost:5000` by default.

Be mindful of security and legal boundaries when experimenting.