#!/usr/bin/env python3
"""把 AI 生成的搜索关键词批量灌入 Supabase search_keywords 表。

用法：python3 import_keywords.py  （依赖 /tmp/search-keywords.json）
用 service_role 写入（表 RLS 只给 anon SELECT）。
"""
import json
import time
import urllib.request

# 从 .env.local 读配置
env = {}
with open('/Users/wuwenbing/ai-skill-platform/frontend/.env.local') as f:
    for line in f:
        if '=' in line and not line.startswith('#'):
            k, v = line.strip().split('=', 1)
            env[k] = v

URL = env['NEXT_PUBLIC_SUPABASE_URL']
KEY = env['SUPABASE_SERVICE_ROLE_KEY']

data = json.load(open('/tmp/search-keywords.json'))
rows = []
for item in data:
    for kw in item['keywords']:
        kw = kw.strip()
        if kw and 1 <= len(kw) <= 50:
            rows.append({'skill_id': item['skill_id'], 'keyword': kw, 'source': 'ai', 'weight': 1})

print(f'共 {len(data)} skills → {len(rows)} 行关键词')

# 分批 upsert（ON CONFLICT 跳过）
BATCH = 500
inserted = 0
for i in range(0, len(rows), BATCH):
    batch = rows[i:i+BATCH]
    req = urllib.request.Request(
        f'{URL}/rest/v1/search_keywords',
        data=json.dumps(batch).encode(),
        headers={
            'apikey': KEY,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates,return=minimal',
        },
        method='POST',
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            inserted += len(batch)
            print(f'  批次 {i//BATCH+1}: {resp.status} (累计 {inserted})')
    except urllib.error.HTTPError as e:  # type: ignore[attr-defined]
        print(f'  批次 {i//BATCH+1}: 失败 {e.code} {e.read().decode()[:200]}')
        # 重试一次（可能表还没建）
        time.sleep(3)
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                inserted += len(batch)
                print(f'  重试成功: {resp.status}')
        except Exception as e2:
            print(f'  重试也失败: {e2}（可能 search_keywords 表未建，先在 SQL Editor 跑 search-index.sql）')
            break
    time.sleep(0.3)

print(f'\n完成: {inserted}/{len(rows)} 行')
