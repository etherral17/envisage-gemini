import streamlit as st
import requests
import json
from datetime import datetime

st.set_page_config(page_title="API Testing Tool", layout="wide")
st.title("🔧 API Testing Tool")

# Sidebar for common settings
st.sidebar.header("Settings")
timeout = st.sidebar.number_input("Request Timeout (seconds)", value=10, min_value=1)

# Create tabs
tab1, tab2 = st.tabs(["Request", "Metadata"])

with tab1:
    st.header("Send API Request")
    
    col1, col2 = st.columns([1, 1])
    
    with col1:
        method = st.selectbox("HTTP Method", ["GET", "POST", "PUT", "DELETE", "PATCH"])
    
    with col2:
        uri = st.text_input("API URI", placeholder="https://api.example.com/endpoint")
    
    if method in ["POST", "PUT", "PATCH"]:
        body = st.text_area("Request Body (JSON)", placeholder='{"key": "value"}')
    else:
        body = None
    
    headers_input = st.text_area("Headers (JSON)", placeholder='{"Content-Type": "application/json"}')
    
    if st.button("Send Request", type="primary"):
        try:
            headers = json.loads(headers_input) if headers_input.strip() else {}
            request_body = json.loads(body) if body and body.strip() else None
            
            with st.spinner("Sending request..."):
                response = requests.request(
                    method=method,
                    url=uri,
                    json=request_body,
                    headers=headers,
                    timeout=timeout
                )
            
            st.session_state.response = response
            st.session_state.request_time = datetime.now()
            st.success(f"Request successful! Status: {response.status_code}")
            st.json(response.json() if response.headers.get('content-type') == 'application/json' else response.text)
            
        except json.JSONDecodeError as e:
            st.error(f"Invalid JSON: {e}")
        except requests.exceptions.RequestException as e:
            st.error(f"Request failed: {e}")

with tab2:
    st.header("Response Metadata")
    
    if "response" in st.session_state:
        response = st.session_state.response
        
        col1, col2, col3 = st.columns(3)
        col1.metric("Status Code", response.status_code)
        col2.metric("Response Time", f"{response.elapsed.total_seconds():.2f}s")
        col3.metric("Content Length", f"{len(response.content)} bytes")
        
        st.subheader("Headers")
        st.json(dict(response.headers))
        
        st.subheader("Cookies")
        if response.cookies:
            st.json(dict(response.cookies))
        else:
            st.info("No cookies received")
    else:
        st.info("Send a request first to see metadata")