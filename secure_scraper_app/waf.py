import re
import time
from collections import deque
from flask import request, abort
import config

# static signature-based checks
SQLI_PATTERNS = [
    r"(\bunion\b|\bselect\b|\binsert\b|\bdrop\b)",
    r"(--|\#)",
]

XSS_PATTERNS = [
    r"<script>",
    r"javascript:"
]

# ---------------------------------------------------------------------------
# ML-based anomaly detection for volumetric attacks (DDoS, brute force, etc.)
# using an IsolationForest over features derived per source IP.
# ---------------------------------------------------------------------------
try:
    from sklearn.ensemble import IsolationForest
    _ml_available = True
except ImportError:
    _ml_available = False

# per-IP rolling statistics
ip_stats = {}
# permanently (for this process) blocked IPs
blocked_ips = set()
# sliding window of feature vectors for model training
training_data = deque(maxlen=2000)
# trained model (None until we have enough examples)
model = None


def _update_ip_stats(ip):
    now = time.time()
    info = ip_stats.setdefault(ip, {"times": [], "paths": set(), "ua": set()})
    info["times"].append(now)
    cutoff = now - 60  # keep last minute's worth
    info["times"] = [t for t in info["times"] if t >= cutoff]
    return info


def _compute_features(info):
    times = info.get("times", [])
    n = len(times)
    if n > 1:
        intervals = [times[i] - times[i - 1] for i in range(1, n)]
        avg_int = sum(intervals) / len(intervals)
    else:
        avg_int = 60.0
    return [n, avg_int, len(info.get("paths", [])), len(info.get("ua", []))]


def _maybe_train_model():
    global model
    if not _ml_available:
        return
    if len(training_data) >= 50:
        model = IsolationForest(contamination=0.01)
        model.fit(list(training_data))


def waf_check():
    if not config.WAF_ENABLED:
        return

    # basic signature checks first
    # include cookies in the payload for signature scanning
    payload = str(request.data) + str(request.args) + str(request.cookies)
    for pattern in SQLI_PATTERNS:
        if re.search(pattern, payload, re.IGNORECASE):
            # record reason before aborting
            try:
                from flask import g
                g.waf_reason = "SQL Injection detected"
            except ImportError:
                pass
            abort(403, "SQL Injection detected")
    for pattern in XSS_PATTERNS:
        if re.search(pattern, payload, re.IGNORECASE):
            try:
                from flask import g
                g.waf_reason = "XSS detected"
            except ImportError:
                pass
            abort(403, "XSS detected")

    # ML anomaly logic
    if _ml_available:
        ip = request.remote_addr or "0.0.0.0"

        # check blacklist first
        if ip in blocked_ips:
            try:
                from flask import g
                g.waf_reason = "IP previously blocked"
            except ImportError:
                pass
            abort(403, "IP blocked due to previous anomalous behaviour")

        info = _update_ip_stats(ip)
        info["paths"].add(request.path)
        info["ua"].add(request.headers.get("User-Agent", ""))
        features = _compute_features(info)
        training_data.append(features)
        _maybe_train_model()
        if model is not None:
            pred = model.predict([features])[0]
            if pred == -1:
                blocked_ips.add(ip)
                try:
                    from flask import g
                    g.waf_reason = "Anomalous traffic detected"
                except ImportError:
                    pass
                abort(403, "Anomalous traffic detected")