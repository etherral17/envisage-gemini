You are an expert Python security engineer helping build a **cybersecurity demonstration platform for an expo**.
The goal of the project is **educational and defensive**: to demonstrate common web application vulnerabilities and show how a Web Application Firewall (WAF) can detect and block suspicious requests.

The project contains two main components:

1. **Security Testing Dashboard (Streamlit App)**
2. **Protected Backend Application (Flask + WAF + Monitoring)**

The system must simulate suspicious or malicious traffic in a **controlled and safe environment**, and then demonstrate how the WAF detects and blocks those requests.

## Overall Architecture

Streamlit Security Dashboard
↓
Simulated security test requests
↓
Flask backend with WAF
↓
Monitoring + Logs + Visualizations

The code must follow these requirements:

* clean architecture
* modular design
* clear comments
* type hints where possible
* proper error handling
* secure coding practices
* no unnecessary global variables
* avoid race conditions
* robust logging
* production-style structure

---

# Component 1 — Streamlit Security Dashboard

Location:

```
hackingtool/main.py
```

Purpose:
Provide a **terminal-style UI** that allows a user to run **controlled security test scenarios** against the backend.

Features:

1. **Server connection panel**

   * input target server URL
   * connect/disconnect status

2. **Command terminal**

   * allow execution of predefined testing scripts
   * show output logs
   * support commands like:

     * test_request_load
     * test_invalid_headers
     * test_suspicious_patterns
     * test_session_validation

3. **Security test modules**

   * simulated high request rate test
   * invalid header injection test
   * malformed request test
   * repeated authentication attempts

These should be implemented safely and must **never target external systems by default**.

4. **Visualization**

   * show request statistics
   * show blocked vs allowed requests
   * display results in charts

---

# Component 2 — Flask Backend with WAF

The backend should implement a **simple Web Application Firewall (WAF)**.

Core features:

### WAF Middleware

Create a request inspection layer that checks:

* request rate per IP
* suspicious headers
* malformed payloads
* invalid API key usage
* unusual request patterns

If a rule is triggered:

* block the request
* log the event
* update monitoring stats

---

### Endpoints

/login
Returns an API key used for authenticated requests.

---

/scrape
Accepts a public URL and extracts text content safely.

---

/data
Returns scraped text.

---

/wordcloud
Generates a word cloud from scraped text.

---

/summary
Returns a summarized version of the text.

---

/logs
Returns request logs.

---

/monitoring
Returns monitoring snapshot including:

* waf_enabled
* total_requests_checked
* blocked_requests
* success_requests
* failed_requests
* blocked_ips
* blocked_ip_count
* last_block_reason
* total_logs

---

/waf/enable
Enable WAF. (POST)

---

/waf/disable
Disable WAF. (POST)

---

### Monitoring System

Maintain real-time metrics:

* request counts
* blocked requests
* IP activity
* endpoint usage

Store logs in memory or SQLite for demo purposes.

Each log entry should include:

* id
* ip
* method
* path
* status
* timestamp
* waf_reason (if blocked)

---

# Scraping + WordCloud

Scraping module should:

* fetch open-source web pages
* extract text safely
* remove scripts/styles
* tokenize words
* generate a word cloud image
* store result path

Use libraries such as:

* requests
* beautifulsoup4
* wordcloud
* matplotlib

---

# Frontend Monitoring UI

The monitoring dashboard should display:

* WAF status toggle
* request rate graph
* blocked request counter
* recent logs
* IP block list
* real-time updates every few seconds

---

# Code Quality Requirements

All code should include:

* modular functions
* type annotations
* proper exception handling
* descriptive variable names
* docstrings
* logging
* consistent formatting

Avoid bugs such as:

* race conditions
* duplicate API key generation
* memory leaks
* blocking event loops
* improper CORS handling

---

# Security Considerations

Even though this is a demo:

* validate inputs
* sanitize URLs
* prevent SSRF in scraping
* limit request rate
* isolate security tests to local environments
* implement proper CORS headers
* avoid exposing sensitive data

---

# Output Expectations

Generate:

* clean Python code
* modular files
* reusable utilities
* comments explaining security concepts

Structure the project like:

```
project/
│
├─ hackingtool/
│   └─ main.py
│      - other files
│
├─ secure_scraper_app/
│   ├─ app.py
│   ├─ waf.py
│   ├─ monitoring.py
│   ├─ scraper.py
│   ├─ auth.py
│   ├─ logs.py
│   ├─ llm.py
│   ├─ config.py
│   ├─ inspect_logs.py
│   ├─ storage.py
│   ├─ toggle_test.py
│   ├─ visualization.py
│   ├─ waf_test.py
│   ├─ requirements.txt
│   ├─ test_api.py
│   └─ data/
│       ├─ extracted_text/
│       ├─ wordcloud/
│       ├─ fernet.key
│       ├─ request_logs.jsonl
│       └─ sessions.json
│
└─ frontend/
   └─ app/
```

Focus on **clarity, reliability, and educational value** so the system can be used for a cybersecurity demonstration.

Test each component and make changes to have that behaviour 
