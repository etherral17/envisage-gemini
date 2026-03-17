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

monitor_stats = {
    "total_requests_checked": 0,
    "blocked_requests": 0,
    "last_block_reason": None,
    "last_blocked_ip": None,
    "last_event_ts": None,
}

EXEMPT_PATH_PREFIXES = (
    "/login",
    "/monitoring",
    "/waf",
    "/logs",
    "/session/history",
    "/wordcloud/image",
)


def _get_client_ip() -> str:
    """Best-effort client IP extraction.

    In Docker Compose the frontend nginx proxy sets X-Forwarded-For and X-Real-IP.
    In non-proxied setups we fall back to request.remote_addr.
    """
    xff = (request.headers.get("X-Forwarded-For") or "").strip()
    if xff:
        # X-Forwarded-For is a comma-separated list; the left-most is the original client.
        first = xff.split(",")[0].strip()
        if first:
            return first
    x_real_ip = (request.headers.get("X-Real-IP") or "").strip()
    if x_real_ip:
        return x_real_ip
    return request.remote_addr or "0.0.0.0"


def get_waf_status():
    return {
        "waf_enabled": bool(config.WAF_ENABLED),
        "ml_available": _ml_available,
        "blocked_ips": sorted(list(blocked_ips)),
        "blocked_ip_count": len(blocked_ips),
    }


def get_monitor_snapshot():
    return {
        **get_waf_status(),
        "total_requests_checked": monitor_stats["total_requests_checked"],
        "blocked_requests": monitor_stats["blocked_requests"],
        "last_block_reason": monitor_stats["last_block_reason"],
        "last_blocked_ip": monitor_stats["last_blocked_ip"],
        "last_event_ts": monitor_stats["last_event_ts"],
    }


def _mark_block(reason: str):
    ip = _get_client_ip()
    monitor_stats["blocked_requests"] += 1
    monitor_stats["last_block_reason"] = reason
    monitor_stats["last_blocked_ip"] = ip
    monitor_stats["last_event_ts"] = time.time()


def unblock_ip(ip: str) -> bool:
    """Remove an IP from the in-memory block list."""
    ip = (ip or "").strip()
    if not ip:
        return False
    if ip in blocked_ips:
        blocked_ips.remove(ip)
        return True
    return False


def block_ip(ip: str) -> None:
    ip = (ip or "").strip()
    if ip:
        blocked_ips.add(ip)


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
    if request.method == "OPTIONS":
        return

    if any(request.path.startswith(prefix) for prefix in EXEMPT_PATH_PREFIXES):
        return

    monitor_stats["total_requests_checked"] += 1

    if not config.WAF_ENABLED:
        return

    ip = _get_client_ip()
    # Enforce a blocklist for the current process when WAF is enabled.
    if ip in blocked_ips:
        _mark_block("IP previously blocked")
        try:
            from flask import g
            g.waf_reason = "IP previously blocked"
        except ImportError:
            pass
        abort(403, "IP blocked")

    # basic signature checks first
    # include cookies in the payload for signature scanning
    payload = str(request.data) + str(request.args) + str(request.cookies)
    for pattern in SQLI_PATTERNS:
        if re.search(pattern, payload, re.IGNORECASE):
            block_ip(ip)
            _mark_block("SQL Injection detected")
            # record reason before aborting
            try:
                from flask import g
                g.waf_reason = "SQL Injection detected"
            except ImportError:
                pass
            abort(403, "SQL Injection detected")
    for pattern in XSS_PATTERNS:
        if re.search(pattern, payload, re.IGNORECASE):
            block_ip(ip)
            _mark_block("XSS detected")
            try:
                from flask import g
                g.waf_reason = "XSS detected"
            except ImportError:
                pass
            abort(403, "XSS detected")

    # ML anomaly logic
    if _ml_available:
        info = _update_ip_stats(ip)
        info["paths"].add(request.path)
        info["ua"].add(request.headers.get("User-Agent", ""))
        features = _compute_features(info)
        training_data.append(features)
        _maybe_train_model()
        if model is not None:
            pred = model.predict([features])[0]
            if pred == -1:
                block_ip(ip)
                _mark_block("Anomalous traffic detected")
                try:
                    from flask import g
                    g.waf_reason = "Anomalous traffic detected"
                except ImportError:
                    pass
                abort(403, "Anomalous traffic detected")