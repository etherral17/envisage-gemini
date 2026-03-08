import streamlit as st
import paramiko
import requests
import json

st.title("Ethical Hacking Tool")
tab1 , tab2 = st.tabs(["Payload Execution", "API Testing"])
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