# AI Skill 评测聚合平台 — ECS 中转试用 API 设计

> 版本: v1.0 (2026-08-13) | 依据: SPEC v2.0（§8 架构图）+ 现有 ai-router 中转站模式
> 定位: **独立新应用**，不复用/不修改 ai-router 的 1816 行 index.mjs（遵守代码注入铁律）
> 技术栈: Node.js + Express | 部署: ECS 139.129.49.85 /app/skill-trial/ | PM2 + Nginx

---

## 1. 架构总览

```
浏览器 (vokki.cn, Next.js)
    │  POST https://ecs.vokki.cn/trial/api/trial   (CORS: 仅 vokki.cn)
    ▼
Nginx (ecs.vokki.cn)  location /trial/ → 127.0.0.1:3072
    ▼
skill-trial (Express, 独立 PM2 进程, port 3072)
    ├── 输入校验 / 配额校验
    ├── 读 skills.trial_config  ──────────▶ Supabase REST (service_role)
    ├── 调扣子 Chat API ─────────────────▶ https://api.coze.cn/v3/chat  (PAT 在 ECS 环境变量)
    ├── 轮询结果 ────────────────────────▶ GET /v3/chat/retrieve
    ├── 取回答 ──────────────────────────▶ POST /v3/chat/message/list
    └── 写 trial_logs + 配额计数 ────────▶ Supabase REST (service_role)
```

**设计决策**：
1. **独立应用**：新建 `/app/skill-trial/`，端口 3072，与 ai-router（3071）互不干扰
2. **配额单一事实源 = Supabase `trial_logs`**：ECS 用 service_role 查询计数，前端不直接读该表（RLS 已拒绝匿名），避免双份计数不一致
3. **MVP 用非流式 + 轮询**：Coze `stream:false` 拿 chat_id → 轮询 retrieve → 返回完整 JSON。流式 SSE 列为 V1.1 升级项（可靠性优先于延迟，3-5 个 Skill 低流量场景足够）
4. **PAT 永不出 ECS**：`skills.trial_config` 只存 bot_id 等非机密配置

---

## 2. 接口契约

### 2.1 `POST /api/trial` — 执行试用（核心）

**请求**：
```json
{
  "skill_id": 1,
  "input": "无线蓝牙耳机 售价199 主打降噪",
  "session_token": "9f3c...uuid"
}
```

| 字段 | 校验规则 |
|------|----------|
| skill_id | 必填，正整数 |
| input | 必填，trim 后 1~2000 字符 |
| session_token | 必填，8~100 字符（uuid 或哈希），缺失则 400 |

**成功响应 (200)**：
```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "skill_id": 1,
    "output": "【标题】...\n【卖点】...",
    "tokens_used": 2031,
    "remaining": 4,
    "coze_chat_id": "chat_xxxx"
  }
}
```

**配额耗尽 (429)**：
```json
{ "code": 429, "message": "TRIAL_LIMIT_EXCEEDED", "data": { "remaining": 0 } }
```

**业务失败 (500/502/503)**：`{ "code": 500, "message": "COZE_UPSTREAM_ERROR", "data": { "stage": "chat_create|poll|message_list" } }`

**服务端流程**：
```
1. 校验参数
2. Supabase 读 skills: SELECT trial_enabled, trial_config WHERE id = skill_id
   → trial_enabled=false 或 trial_config.provider!='coze' → 400 TRIAL_NOT_SUPPORTED
3. 配额校验: count(trial_logs) WHERE skill_id=? AND session_token=? AND created_at >= now()-24h
   → ≥ TRIAL_DAILY_LIMIT(5) → 429 TRIAL_LIMIT_EXCEEDED
4. 构造 Coze 请求体（prompt_template 渲染 {{input}}）
5. POST https://api.coze.cn/v3/chat (stream:false, auto_save_history:false)
6. 轮询 GET /v3/chat/retrieve?chat_id&conversation_id（2s 间隔，上限 90s）
7. POST /v3/chat/message/list 提取 type='answer' 的 content
8. Supabase INSERT trial_logs (status='success', tokens_used)
9. 返回 JSON
```

### 2.2 `GET /api/trial/quota?skill_id=1&session_token=xxx` — 剩余次数

```json
{ "code": 0, "message": "ok", "data": { "remaining": 4, "limit": 5 } }
```
> 前端详情页挂载时调用，用于显示"免费试用 3 次"。查询失败时静默降级为不显示。

### 2.3 `GET /api/trial/health` — 健康检查

```json
{ "ok": true, "uptime": 12345, "coze_configured": true }
```
> PM2 监控 + Nginx 探活用。`coze_configured` = PAT 环境变量是否就位。

---

## 3. 扣子 Coze Chat API 集成细节

### 3.1 端点与鉴权

| 操作 | 方法/路径 | 说明 |
|------|-----------|------|
| 发起对话 | `POST https://api.coze.cn/v3/chat` | 国内版；国际版为 api.coze.com |
| 查询状态 | `GET /v3/chat/retrieve?chat_id=&conversation_id=` | 轮询用 |
| 取消息 | `POST /v3/chat/message/list` | body: `{chat_id, conversation_id}` |

鉴权：`Authorization: Bearer <COZE_PAT>`（扣子开放平台个人访问令牌，存 ECS 环境变量）。

### 3.2 发起对话请求体

```json
{
  "bot_id": "REPLACE_WITH_BOT_ID_1",
  "user_id": "trial_1a2b3c4d5e6f",
  "stream": false,
  "auto_save_history": false,
  "additional_messages": [
    { "role": "user", "content": "你是电商文案专家。请根据商品信息生成标题、卖点、详情页文案。商品信息：无线蓝牙耳机 售价199 主打降噪", "content_type": "text" }
  ]
}
```

要点：
- `user_id` = `'trial_' + sha1(session_token).slice(0,12)`（确定性映射，无用户系统也能稳定标识）
- `auto_save_history: false`：防止跨用户串记忆 + 隐私 + 省额度
- prompt 模板由 `trial_config.prompt_template` 渲染（`{{input}}` 替换），**模板在前端不可见**

### 3.3 轮询 retrieve

```js
const POLL_INTERVAL_MS = 2000, POLL_MAX_MS = 90_000;
const status = await pollChatStatus(chatId, conversationId); // 'completed' | 'failed' | timeout
```

响应 `data.status` 取值：`in_progress` → 继续轮询；`completed` → 取消息；`failed` → 502；`requires_action` → 502（该 Bot 含未配置工具）。

### 3.4 提取回答

`message/list` 返回 `data[]`，取 `type === 'answer' && role === 'assistant'` 的消息 content（可能有多个分段，拼接）。忽略 `type='tool_call'/'function_call'` 等中间消息。

### 3.5 Token 统计（best-effort）

`v3/chat/retrieve` 响应 `data.token_count`（若返回）。拿不到则 `tokens_used: null`，**不影响主流程**（SPEC 要求 Q5 用实测值，落地后可用 trial_logs 反哺评测数据）。

---

## 4. 配额与限流

| 层 | 规则 | 实现 |
|----|------|------|
| 用户层 | 每 session_token × 每 skill × 24h ≤ 5 次 | Supabase trial_logs count（service_role 查询） |
| 全局层 | 全站每日 ≤ 200 次（成本护栏） | 内存计数 + 每日零点重置，超限 429 TRIAL_GLOBAL_LIMIT |
| IP 层 | 每 IP ≤ 20 次/分钟（防刷） | `express-rate-limit` |
| 预算告警 | 全局用量 ≥ 80% 告警 | 日志 + 可接 cron 检查 |

> 限额读取 `site_config.trial_default_limit`（Supabase），ECS 启动时缓存，改动即时生效可后续加。

---

## 5. 安全设计

| 项 | 方案 |
|----|------|
| CORS | `cors({ origin: ['https://vokki.cn', 'https://www.vokki.cn'], methods: ['GET','POST'] })` |
| 密钥 | `COZE_PAT` / `SUPABASE_SERVICE_ROLE_KEY` 只存 `/app/skill-trial/.env`，绝不返回前端 |
| 输入 | 长度/类型校验；prompt 模板渲染用转义（输入含 `{{` 或换行不破坏模板） |
| 输出 | 截断到 `trial_config.max_output_chars`（默认 2000 字符） |
| 注入 | Coze 返回内容按纯文本处理，前端渲染用 `whitespace-pre-wrap`，禁止 dangerouslySetInnerHTML |
| 探测 | 未知 skill_id / 非法 token 一律 400，不暴露内部信息 |

---

## 6. 错误码表

| HTTP | code | 场景 | 前端动作 |
|------|------|------|----------|
| 200 | 0 | 成功 | 渲染结果 |
| 400 | TRIAL_NOT_SUPPORTED | skill 未开通试用 | 隐藏试用区 |
| 400 | INVALID_INPUT | 参数不合法 | 提示重新输入 |
| 429 | TRIAL_LIMIT_EXCEEDED | 用户当日额度用完 | "去平台安装继续" |
| 429 | TRIAL_GLOBAL_LIMIT | 全站护栏 | 同 429，运维告警 |
| 500 | COZE_UPSTREAM_ERROR | 扣子返回非 0 code / 轮询超时 / failed | "生成失败请重试" |
| 502 | COZE_BAD_GATEWAY | requires_action / 上游 5xx | 引导去安装 |
| 503 | SERVICE_UNAVAILABLE | PAT 未配置 / ECS 异常 | "试用服务维护中" |

---

## 7. 项目结构（待实现）

```
/app/skill-trial/
├── index.mjs          # Express 入口：路由 + 校验 + 限流中间件
├── coze.mjs           # 扣子 API 封装（chat create / poll / message list）
├── supabase.mjs       # REST 封装（读 trial_config / 配额 count / 写 trial_logs）
├── quota.mjs          # 配额与全局限流
├── .env               # COZE_PAT / SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / TRIAL_DAILY_LIMIT / TRIAL_GLOBAL_DAILY_LIMIT
└── ecosystem.config.cjs  # PM2 配置（name: skill-trial, port 3072）
```

---

## 8. 部署清单（沿用 ai-router 模式）

```bash
# 1. 代码上传
scp -r ./skill-trial root@139.129.49.85:/app/

# 2. 安装依赖 + 环境变量
cd /app/skill-trial && npm install --production
# 写入 .env（COZE_PAT 等）

# 3. PM2 启动
pm2 start ecosystem.config.cjs   # name=skill-trial, PORT=3072
pm2 save

# 4. Nginx 新增 location（ecs.vokki.cn 配置中追加）
# location /trial/ {
#   proxy_pass http://127.0.0.1:3072/;
#   proxy_set_header Host $host;
#   proxy_read_timeout 120s;    # 轮询最长 90s，必须放宽默认 60s
# }
# nginx -t && nginx -s reload

# 5. 验证
curl https://ecs.vokki.cn/trial/api/health   # → {"ok":true,...}
```

**⚠️ 关键坑**：`proxy_read_timeout` 必须 ≥120s，否则 Nginx 会在 Coze 轮询期间断开长请求。

---

## 9. 演进预留

| 版本 | 升级项 |
|------|--------|
| V1.1 | SSE 流式透传（Coze `stream:true` → 前端打字机效果），接口保持 POST /api/trial，响应体变 `text/event-stream` |
| V1.2 | 多供应商抽象（GPTs Assistants API / 千问 / 文心），按 trial_config.provider 分发，热插拔模式 |
| V1.3 | 试用转化分析（trial_logs + skill_id 关联 → 试用后安装点击埋点） |
| V2.0 | 计费系统（SPEC 验证通过后：试用转化率 >20% 且用户有付费意愿） |
