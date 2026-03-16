from __future__ import annotations

import os
import time
from dataclasses import dataclass
from typing import Any

import requests
import streamlit as st


st.set_page_config(page_title="Expo WAF Demo", layout="wide")
st.title("Cybersecurity Expo Demo — Secure Scraper WAF")

tab1, tab2 = st.tabs(["WAF Tester", "About"])


@dataclass(frozen=True)
class HttpConfig:
    base_url: str
    timeout_s: float
    verify_tls: bool


def _normalize_base_url(value: str) -> str:
    value = (value or "").strip()
    if not value:
        return "http://127.0.0.1:5000"
    return value.rstrip("/")


def _get_http_session() -> requests.Session:
    session = st.session_state.get("http_session")
    if session is None:
        session = requests.Session()
        st.session_state["http_session"] = session
    return session


def _request_json(
    session: requests.Session,
    cfg: HttpConfig,
    method: str,
    path: str,
    *,
    headers: dict[str, str] | None = None,
    params: dict[str, Any] | None = None,
    json_body: Any | None = None,
) -> tuple[int, Any]:
    url = f"{cfg.base_url}{path}"
    resp = session.request(
        method=method,
        url=url,
        headers=headers,
        params=params,
        json=json_body,
        timeout=cfg.timeout_s,
        verify=cfg.verify_tls,
    )
    try:
        return resp.status_code, resp.json()
    except Exception:
        return resp.status_code, {"raw": resp.text}


def _get_waf_enabled(session: requests.Session, cfg: HttpConfig) -> bool | None:
    code, data = _request_json(session, cfg, "GET", "/waf/status")
    if code != 200 or not isinstance(data, dict):
        return None
    enabled = data.get("waf_enabled")
    return bool(enabled) if enabled is not None else None


def _render_verdict(*, waf_enabled: bool | None, status_code: int) -> None:
    if waf_enabled is None:
        st.warning(f"Request returned {status_code}. Unable to read WAF status.")
        return

    if waf_enabled:
        if status_code == 403:
            st.success("Blocked by WAF (expected)")
        else:
            st.warning(f"Not blocked (unexpected). Status: {status_code}")
        return

    # WAF disabled
    if status_code == 403:
        st.warning("Request blocked even though WAF appears disabled (unexpected)")
    else:
        st.success(f"Not blocked (expected when WAF is disabled). Status: {status_code}")


with tab1:
    st.subheader("Target configuration")
    col_a, col_b, col_c, col_d = st.columns([2, 1, 1, 1])

    with col_a:
        default_backend = os.environ.get("BACKEND_BASE_URL", "http://127.0.0.1:5000")
        base_url = st.text_input(
            "Backend base URL",
            value=st.session_state.get("base_url", default_backend),
            help="Use your EC2 DNS, e.g. https://ec2-xx-xx-xx-xx.compute-1.amazonaws.com",
        )
    with col_b:
        timeout_s = st.number_input("Timeout (s)", min_value=1, max_value=60, value=8)
    with col_c:
        verify_tls = st.toggle(
            "Verify TLS",
            value=st.session_state.get("verify_tls", True),
            help="Turn off only for temporary testing with self-signed certs.",
        )
    with col_d:
        if st.button("New session"):
            st.session_state["http_session"] = requests.Session()
            st.success("Created a fresh HTTP session")

    st.session_state["base_url"] = _normalize_base_url(base_url)
    st.session_state["verify_tls"] = bool(verify_tls)

    cfg = HttpConfig(
        base_url=st.session_state["base_url"],
        timeout_s=float(timeout_s),
        verify_tls=bool(verify_tls),
    )
    session = _get_http_session()

    st.info(
        "Use this panel to validate that the WAF blocks suspicious patterns (SQLi/XSS) and that blocks are visible in `/monitoring`. "
        "Only test systems you are authorized to test."
    )

    st.divider()
    st.subheader("Authentication")
    auth_col_1, auth_col_2, auth_col_3 = st.columns([1, 1, 2])

    with auth_col_1:
        if st.button("GET /waf/status"):
            code, data = _request_json(session, cfg, "GET", "/waf/status")
            st.write(f"Status: {code}")
            st.json(data)

    with auth_col_2:
        if st.button("GET /login (API key)"):
            code, data = _request_json(session, cfg, "GET", "/login")
            st.write(f"Status: {code}")
            st.json(data)
            if isinstance(data, dict) and data.get("x-api-key"):
                st.session_state["api_key"] = str(data["x-api-key"]).strip()

    with auth_col_3:
        api_key = st.text_input("API key", value=st.session_state.get("api_key", ""))
        st.session_state["api_key"] = api_key

    st.divider()
    st.subheader("Controls (demo)")
    control_col_1, control_col_2, control_col_3 = st.columns([1, 1, 2])

    with control_col_1:
        if st.button("POST /waf/enable"):
            code, data = _request_json(session, cfg, "POST", "/waf/enable")
            st.write(f"Status: {code}")
            st.json(data)

    with control_col_2:
        if st.button("POST /waf/disable"):
            code, data = _request_json(session, cfg, "POST", "/waf/disable")
            st.write(f"Status: {code}")
            st.json(data)

    with control_col_3:
        st.caption("Tip: In EC2, keep these control endpoints restricted (SG allowlist/VPN).")

    st.divider()
    st.subheader("WAF test cases")
    st.caption("These are harmless signature tests designed to trigger the demo WAF.")

    authorized = st.checkbox(
        "I confirm I am authorized to test this target",
        value=bool(st.session_state.get("authorized", False)),
    )
    st.session_state["authorized"] = authorized

    test_col_1, test_col_2, test_col_3 = st.columns([1, 1, 2])

    def _auth_headers() -> dict[str, str]:
        if not st.session_state.get("api_key"):
            return {}
        return {"x-api-key": st.session_state["api_key"]}

    with test_col_1:
        if st.button("Test XSS (GET /data?x=<script…>)", disabled=not authorized):
            if not api_key:
                st.warning("Fetch an API key first via /login.")
            else:
                waf_enabled = _get_waf_enabled(session, cfg)
                st.caption(f"WAF enabled: {waf_enabled}")
                st.caption("Payload: x = <script>alert(1)</script>")
                code, data = _request_json(
                    session,
                    cfg,
                    "GET",
                    "/data",
                    headers=_auth_headers(),
                    params={"x": "<script>alert(1)</script>"},
                )
                st.write(f"Status: {code}")
                _render_verdict(waf_enabled=waf_enabled, status_code=code)
                st.json(data)

    with test_col_2:
        if st.button("Test SQLi (POST /scrape with UNION SELECT)", disabled=not authorized):
            if not api_key:
                st.warning("Fetch an API key first via /login.")
            else:
                waf_enabled = _get_waf_enabled(session, cfg)
                st.caption(f"WAF enabled: {waf_enabled}")
                st.caption("Payload: url = http://example.com/?q=1 UNION SELECT")
                # The WAF scans request body; this should trigger the SQLi signature.
                code, data = _request_json(
                    session,
                    cfg,
                    "POST",
                    "/scrape",
                    headers={**_auth_headers(), "Content-Type": "application/json"},
                    json_body={"url": "http://example.com/?q=1 UNION SELECT"},
                )
                st.write(f"Status: {code}")
                _render_verdict(waf_enabled=waf_enabled, status_code=code)
                st.json(data)

    with test_col_3:
        if st.button("Fetch /monitoring (last 10)"):
            code, data = _request_json(session, cfg, "GET", "/monitoring", params={"limit": 10})
            st.write(f"Status: {code}")
            st.json(data)

    st.divider()
    st.subheader("Quick demo run")
    if st.button("Run demo sequence", disabled=not authorized):
        if not api_key:
            st.warning("Fetch an API key first via /login.")
        else:
            st.write("1) Confirm WAF status")
            st.json(_request_json(session, cfg, "GET", "/waf/status")[1])
            time.sleep(0.2)
            st.write("2) Trigger SQLi block")
            st.json(
                _request_json(
                    session,
                    cfg,
                    "POST",
                    "/scrape",
                    headers={**_auth_headers(), "Content-Type": "application/json"},
                    json_body={"url": "http://example.com/?q=1 UNION SELECT"},
                )[1]
            )
            time.sleep(0.2)
            st.write("3) Trigger XSS block")
            st.json(
                _request_json(
                    session,
                    cfg,
                    "GET",
                    "/data",
                    headers=_auth_headers(),
                    params={"x": "<script>alert(1)</script>"},
                )[1]
            )
            time.sleep(0.2)
            st.write("4) Verify in monitoring")
            st.json(_request_json(session, cfg, "GET", "/monitoring", params={"limit": 10})[1])


with tab2:
    st.subheader("About")
    st.markdown(
        """This Streamlit app is a **defensive demo harness** for the Expo.

It:
- obtains an API key via `/login`
- runs harmless signature tests (SQLi/XSS strings)
- verifies that the WAF blocks them (`403`) and that the reason is logged in `/monitoring`

Deployment notes for EC2 (direct Flask exposure):
- restrict inbound access with Security Groups (allowlist your IPs)
- use HTTPS when possible; keep `Verify TLS` enabled
- never run Flask in debug mode on the internet
"""
    )
