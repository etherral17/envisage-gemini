import json

count=0
with open('data/request_logs.jsonl','r',encoding='utf-8') as f:
    for line in f:
        try:
            obj=json.loads(line)
        except json.JSONDecodeError:
            continue
        if obj.get('event')=='waf_toggle':
            print('found',obj)
            count+=1
print('total toggles',count)
