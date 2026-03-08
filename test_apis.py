#!/usr/bin/env python
"""Test all API endpoints"""
import requests
import json

base_url = 'http://localhost:5000'

def test_login():
    print("✓ Testing /login endpoint...")
    response = requests.get(f'{base_url}/login')
    assert response.status_code == 200, f"Login failed: {response.status_code}"
    data = response.json()
    api_key = data.get('x-api-key')
    print(f"  API Key obtained: {api_key[:20]}...")
    return api_key

def test_keys(api_key):
    print("✓ Testing /keys endpoint...")
    response = requests.get(f'{base_url}/keys')
    assert response.status_code == 200, f"Keys failed: {response.status_code}"
    data = response.json()
    print(f"  Keys returned: {len(data.get('keys', []))} keys")

def test_logs():
    print("✓ Testing /logs endpoint...")
    response = requests.get(f'{base_url}/logs?limit=5')
    assert response.status_code == 200, f"Logs failed: {response.status_code}"
    data = response.json()
    print(f"  Logs returned: {len(data)} logs")
    if data:
        print(f"  Sample log keys: {list(data[0].keys())}")

def test_session_history():
    print("✓ Testing /session/history endpoint...")
    response = requests.get(f'{base_url}/session/history')
    assert response.status_code == 200, f"Session history failed: {response.status_code}"
    data = response.json()
    print(f"  Session history: {len(data.get('history', []))} entries")

def test_waf(action='enable'):
    print(f"✓ Testing /waf/{action} endpoint...")
    response = requests.post(f'{base_url}/waf/{action}')
    assert response.status_code == 200, f"WAF toggle failed: {response.status_code}"
    data = response.json()
    print(f"  WAF status: {data.get('waf_enabled')}")

if __name__ == '__main__':
    try:
        print("\n====== Testing Backend APIs ======\n")
        api_key = test_login()
        test_keys(api_key)
        test_logs()
        test_session_history()
        test_waf('disable')
        test_waf('enable')
        print("\n✅ All API tests passed!")
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
