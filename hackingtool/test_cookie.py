import requests

base='http://localhost:5000'
# login
r=requests.post(base+'/login',json={'username':'user','password':'pass'})
print('login',r.status_code,r.headers.get('Set-Cookie'))
c=r.headers.get('Set-Cookie')
# fetch data with cookie
r2=requests.get(base+'/data',headers={'Cookie':c})
print('data',r2.status_code,r2.text)
# fetch session history
r3=requests.get(base+'/session/history',headers={'Cookie':c})
print('history',r3.status_code,r3.text)
