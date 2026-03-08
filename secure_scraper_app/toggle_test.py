import requests

base='http://127.0.0.1:5000'
print('disable:', requests.post(base+'/waf/disable').status_code, requests.post(base+'/waf/disable').text)
print('enable:', requests.post(base+'/waf/enable').status_code, requests.post(base+'/waf/enable').text)
