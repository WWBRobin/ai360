# AI Skill 评测聚合平台（vokki.cn）

跨平台 AI Skill 独立第三方评测 + 极简中转试用。依据 SPEC v2.0（`~/Desktop/ai-skill-platform-spec.md`）。

## 目录结构

```
ai-skill-platform/
├── database/init.sql        # Supabase 建表脚本（SQL Editor 直接执行，幂等）
├── backend/                 # ECS 中转试用 API（Express + 扣子 Chat API）
│   ├── trial-api.js
│   └── package.json
├── app/                     # Next.js 14 (App Router) 前端
│   ├── page.tsx             # 首页（四大入口 + Skill 卡片）
│   ├── skills/[slug]/page.tsx  # Skill 详情页（5问评测 + 试用/安装）
│   ├── components/trial-box.tsx # 试用交互组件（调 ECS 中转 API）
│   └── lib/                 # supabase 客户端 + 数据层
├── .env.example             # 环境变量模板
└── package.json
```

## 一、Supabase 数据库

1. 在 [supabase.com](https://supabase.com) 建项目，复制 `Project URL` 与 `anon key`、`service_role key`
2. 打开 **SQL Editor**，整体粘贴执行 `database/init.sql`
3. 验证：脚本末尾的检查查询应返回 6 行计数（platforms=10, scenarios=18, skills=9, evaluations=9, site_config=5, skill_cards_view=9）

脚本特性：幂等可重复执行（`IF NOT EXISTS` + `ON CONFLICT`）、RLS 全启用（内容表匿名只读、`trial_logs` 仅 service_role 可写）、`pg_trgm` 搜索索引、`skill_cards_view` 聚合视图。

## 二、ECS 中转试用 API

```bash
cd backend
npm install
cp ../.env.example .env    # 填 COZE_API_TOKEN / TRIAL_SKILLS_JSON(botId) / SUPABASE_* / ALLOWED_ORIGINS
npm start                  # 默认 http://0.0.0.0:3001
```

接口：

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/health` | 健康检查 |
| GET | `/api/skills/trial` | 可试用 Skill 列表 |
| POST | `/api/trial` | 执行试用，body `{skillSlug, input, sessionToken, stream?}`，`stream=true` 走 SSE |

配额：每 sessionToken 每 Skill 每日 5 次（`TRIAL_LIMIT_PER_SKILL`）。配置 Supabase 后日志落 `trial_logs` 表；未配置则内存降级。

**上线前必做**：把 `database/init.sql` 示例数据中 `trial_config.bot_id` 的 `REPLACE_WITH_BOT_ID_x` 换成真实扣子 Bot ID，并在 `backend/.env` 的 `TRIAL_SKILLS_JSON` 同步。

Nginx 反代示例（HTTPS）：

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:3001;
    proxy_http_version 1.1;
    proxy_set_header Connection "";
    proxy_buffering off;   # SSE 流式必需
}
```

## 三、Next.js 前端

```bash
npm install
cp .env.example .env.local    # 填 NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY / NEXT_PUBLIC_TRIAL_API_URL
npm run dev                   # http://localhost:3000
```

部署：`npm run build && npm run start`，或推 GitHub 后接 Vercel 自动部署（在 Vercel 项目里配置同名环境变量）。

## 四、试用闭环（架构图）

```
用户浏览器 → Next.js (Vercel SSR)
   ├── Supabase API ── Skill/评测/指南/配置（匿名只读，RLS）
   └── ECS 中转 API ── POST /api/trial ──→ 扣子 Chat API v3
                          （配额限流 + trial_logs 落库）
```
