import requests, time

base = 'http://127.0.0.1:5000'

print('login to get key')
r = requests.get(base + '/login')
key = r.json().get('x-api-key')
print('key', key)

headers = {'x-api-key': key}

print('sending slow burst of requests to /data for ML training')
for i in range(80):
    resp = requests.get(base + '/data', headers=headers)
    print(i, resp.status_code)
    time.sleep(0.1)

print('sending moderate-paced /login to build normal profile')
for i in range(60):
    resp = requests.get(base + '/login')
    print('moderate', i, resp.status_code)
    time.sleep(0.2)

print('now sending flood of /login with no sleep to try trigger ML block')
for i in range(500):
    resp = requests.get(base + '/login')
    if resp.status_code != 200:
        print('blocked after', i, 'requests (status', resp.status_code, ')')
        break
    if i % 50 == 0:
        print('flooded', i)

# simulate cookie attack
print('attempting malicious cookie injection')
cookie_headers = headers.copy()
cookie_headers['Cookie'] = 'session=<script>alert(1)</script>'
resp = requests.get(base + '/data', headers=cookie_headers)
print('cookie attack status', resp.status_code, resp.text)

# toggle WAF off and repeat cookie attack
print('disabling WAF')
requests.post(base + '/waf/disable')
resp = requests.get(base + '/data', headers=cookie_headers)
print('cookie attack with WAF off status', resp.status_code)

# re-enable for cleanup
requests.post(base + '/waf/enable')

print('sending signature payload to provoke SQLi')
payload = {'url': "http://test?x=1 UNION SELECT"}
resp = requests.post(base + '/scrape', headers=headers, json=payload)
print('sqli attempt status', resp.status_code, resp.text)

print('done')
