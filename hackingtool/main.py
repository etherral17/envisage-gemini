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
        """This tab demonstrates how an attacker could obtain a victim's
        session cookie from a vulnerable application, then reuse it against
        the same app.  We'll fetch a cookie from the app's login endpoint and
        display it so we can replay it via the request below.  (In a real
        penetration test the attacker would typically exfiltrate the cookie
        using malicious JavaScript or a MITM.)
        """
    )

    target_url = st.text_input("Target App Base URL", "http://localhost:5000")
    # allow user to attempt to 'steal' a session by logging in
    login_path = st.text_input("Login endpoint path", "/login")
    login_user = st.text_input("Username for login", "user")
    login_pass = st.text_input("Password for login", "pass", type="password")

    if st.button("Steal session from app"):
        try:
            r = requests.post(f"{target_url}{login_path}", 
                              json={"username": login_user, "password": login_pass},
                              timeout=5)
            # grab set-cookie header
            cookie = r.headers.get("Set-Cookie", "<none>")
            st.success("Obtained cookie from app")
            st.code(cookie)
            stolen_cookie = cookie
        except Exception as e:
            st.error(f"Failed to contact target: {e}")
            stolen_cookie = ""

    stolen_cookie = st.text_input("Stolen Cookie (paste or stolen above)", "")
    if stolen_cookie:
        st.markdown("**Encrypted cookie value:**")
        st.code(stolen_cookie)

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

    if st.button("Fetch decrypted session from target"):
        if not stolen_cookie:
            st.warning("Stolen cookie required to query session history.")
        else:
            headers = {"Cookie": stolen_cookie}
            try:
                resp = requests.get(f"{target_url}/session/history", headers=headers, timeout=5)
                st.write(f"Session history status {resp.status_code}")
                try:
                    st.json(resp.json())
                except Exception:
                    st.text(resp.text)
            except Exception as e:
                st.error(f"Error fetching session info: {e}")
