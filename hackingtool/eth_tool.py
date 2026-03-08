import streamlit as st
import re
from dataclasses import dataclass
from typing import List

# =====================================================
# CONFIG
# =====================================================
st.set_page_config(page_title="Ethical AppSec Simulator", layout="wide")

st.title("🛡️ Application Security Simulation Platform")
st.caption("Simulation-only | OWASP aligned | No real exploitation")

# =====================================================
# DATA MODELS
# =====================================================
@dataclass
class Finding:
    vuln_type: str
    severity: str
    description: str
    evidence: str
    impact: str
    remediation: str
    cwe: str
    owasp: str

# =====================================================
# VULNERABILITY ENGINES (SAFE)
# =====================================================

# ---------- XSS ----------
def xss_analyzer(input_text: str) -> List[Finding]:
    patterns = ["<script", "javascript:", "onerror=", "onload="]
    findings = []

    for p in patterns:
        if p.lower() in input_text.lower():
            findings.append(Finding(
                vuln_type="Cross-Site Scripting (XSS)",
                severity="High",
                description="User input is rendered without proper encoding.",
                evidence=f"Detected pattern: {p}",
                impact="Attacker could execute malicious JavaScript in user browsers.",
                remediation="Use output encoding and avoid unsafe HTML rendering.",
                cwe="CWE-79",
                owasp="A03:2021 – Injection"
            ))
    return findings

# ---------- SQL Injection ----------
def sql_injection_analyzer(code: str) -> List[Finding]:
    findings = []

    if re.search(r"SELECT .*['\"]\s*\+\s*", code, re.IGNORECASE):
        findings.append(Finding(
            vuln_type="SQL Injection",
            severity="Critical",
            description="SQL query built using string concatenation.",
            evidence="Detected dynamic SQL string construction.",
            impact="Attacker could manipulate queries and access unauthorized data.",
            remediation="Use parameterized queries or ORM query builders.",
            cwe="CWE-89",
            owasp="A03:2021 – Injection"
        ))
    return findings

# ---------- CSRF ----------
def csrf_analyzer(code: str) -> List[Finding]:
    findings = []

    if "POST" in code and "csrf" not in code.lower():
        findings.append(Finding(
            vuln_type="Cross-Site Request Forgery (CSRF)",
            severity="Medium",
            description="POST endpoint lacks CSRF protection.",
            evidence="No CSRF token detected.",
            impact="Attacker could force users to perform unwanted actions.",
            remediation="Implement CSRF tokens and SameSite cookies.",
            cwe="CWE-352",
            owasp="A01:2021 – Broken Access Control"
        ))
    return findings

# ---------- Prompt Injection ----------
def prompt_injection_analyzer(prompt: str) -> List[Finding]:
    findings = []

    if "ignore previous" in prompt.lower() or "system prompt" in prompt.lower():
        findings.append(Finding(
            vuln_type="Prompt Injection",
            severity="High",
            description="User input can override system instructions.",
            evidence="Detected instruction override attempt.",
            impact="LLM may leak data or violate safety constraints.",
            remediation="Use role separation, prompt guards, and input sanitization.",
            cwe="CWE-20",
            owasp="LLM01: Prompt Injection"
        ))
    return findings

# =====================================================
# ENGINE DISPATCHER
# =====================================================
def run_security_analysis(input_text: str, mode: str) -> List[Finding]:
    results = []

    if mode == "XSS":
        results.extend(xss_analyzer(input_text))
    elif mode == "SQL Injection":
        results.extend(sql_injection_analyzer(input_text))
    elif mode == "CSRF":
        results.extend(csrf_analyzer(input_text))
    elif mode == "Prompt Injection":
        results.extend(prompt_injection_analyzer(input_text))

    return results

# =====================================================
# UI
# =====================================================
mode = st.selectbox(
    "Select Security Test Type",
    ["XSS", "SQL Injection", "CSRF", "Prompt Injection"]
)

input_text = st.text_area(
    "Paste application code, API handler, template, or prompt",
    height=300
)

if st.button("Run Security Simulation"):
    with st.spinner("Simulating attack scenarios (no real exploitation)..."):
        findings = run_security_analysis(input_text, mode)

    if not findings:
        st.success("✅ No vulnerabilities detected in this simulation.")
    else:
        st.error(f"⚠️ {len(findings)} potential issue(s) detected")

        for f in findings:
            with st.expander(f"🚨 {f.vuln_type} — {f.severity}"):
                st.markdown(f"**Description:** {f.description}")
                st.markdown(f"**Evidence:** `{f.evidence}`")
                st.markdown(f"**Impact:** {f.impact}")
                st.markdown(f"**Remediation:** {f.remediation}")
                st.markdown(f"**CWE:** {f.cwe}")
                st.markdown(f"**OWASP:** {f.owasp}")

# =====================================================
# FOOTER
# =====================================================
st.markdown("---")
st.markdown(
    "<div style='text-align:center;font-size:0.9em;'>"
    "Ethical Security Simulation Tool • OWASP-aligned • Gemini Solutions IDS Team"
    "</div>",
    unsafe_allow_html=True
)
