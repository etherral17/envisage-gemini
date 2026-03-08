import requests

base='http://127.0.0.1:5000'
print('login...')
r=requests.get(base+'/login'); print(r.status_code,r.text)
key=r.json().get('x-api-key')
print('key:',key)
print('list keys'); print(requests.get(base+'/keys').text)
print('call data before scrape'); print(requests.get(base+'/data', headers={'x-api-key':key}).status_code, requests.get(base+'/data', headers={'x-api-key':key}).text)
print('scrape');
resp=requests.post(base+'/scrape', headers={'x-api-key':key}, json={'url':'https://en.wikipedia.org/wiki/Main_Page'}); print(resp.status_code, resp.text)
print('data after scrape'); print(requests.get(base+'/data', headers={'x-api-key':key}).status_code, requests.get(base+'/data', headers={'x-api-key':key}).text[:200])
print('wordcloud'); print(requests.get(base+'/wordcloud', headers={'x-api-key':key}).status_code, requests.get(base+'/wordcloud', headers={'x-api-key':key}).text)
print('summary'); print(requests.get(base+'/summary', headers={'x-api-key':key}).status_code, requests.get(base+'/summary', headers={'x-api-key':key}).text)
