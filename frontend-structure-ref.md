# AI Skill 评测聚合平台 — Next.js 前端结构设计

> 版本: v1.0 (2026-08-13) | 依据: SPEC v2.0 + 现有编码规范（coding-standards）
> 技术栈: **Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui**
> 部署: Vercel | 数据源: Supabase（静态内容）+ ECS 中转 API（试用执行）

---

## 1. 架构原则

| 原则 | 落地 |
|------|------|
| SSR 优先 | 所有列表/详情页用 Server Component + `generateMetadata`，利于 SEO |
| API-First | 前端只消费数据，不直接写库；试用走 ECS 中转 API |
| 配置驱动 | 首页四大入口（场景标签/平台导航/推荐位/横评）全部读 `site_config` |
| 视图单查询 | 列表页一律查 `skill_cards_view` 聚合视图，禁止 N+1 查询 |
| 双数据源分离 | Supabase 管内容；`NEXT_PUBLIC_TRIAL_API_BASE` 管试用执行 |

```
浏览器 ── SSR ── Vercel (Next.js 14)
                  ├── @supabase/ssr ──> Supabase (PG + REST)   [内容/评测/指南/配置]
                  └── fetch ──────────> https://ecs.vokki.cn/trial/api/trial  [试用执行]
```

---

## 2. 项目目录结构

```
ai-skill-platform/
├── src/
│   ├── app/
│   │   ├── layout.tsx                 # 根布局：SiteHeader + SiteFooter + metadata
│   │   ├── page.tsx                   # 首页（四大入口 + 场景方案推荐）
│   │   ├── globals.css                # Tailwind + CSS 变量（设计令牌）
│   │   ├── sitemap.ts                 # SEO 动态 sitemap（skills/platforms/scenarios）
│   │   ├── robots.ts
│   │   ├── search/page.tsx            # 搜索：?q= 关键词 → 结果列表
│   │   ├── skills/
│   │   │   └── [slug]/page.tsx        # Skill 详情页（5问评测 + 试用 + 指南）
│   │   ├── scenarios/
│   │   │   ├── page.tsx               # 场景总览（可选，P1）
│   │   │   └── [slug]/page.tsx        # 场景结果页（按平台分组）
│   │   ├── platforms/
│   │   │   └── [slug]/page.tsx        # 平台专属页
│   │   ├── install/page.tsx           # 装机必备页（基础设施增强）
│   │   ├── comparisons/
│   │   │   └── [slug]/page.tsx        # 横评文章详情
│   │   └── tutorials/
│   │       └── [slug]/page.tsx        # 场景教程详情
│   ├── components/
│   │   ├── shared/                    # 跨页复用
│   │   │   ├── SiteHeader.tsx         # Logo + 搜索框 + 关于
│   │   │   ├── SiteFooter.tsx
│   │   │   ├── Breadcrumb.tsx         # 首页 > 扣子 > Skill A
│   │   │   ├── SkillCard.tsx          # ⭐ 核心卡片组件（全站复用）
│   │   │   ├── ScoreBadge.tsx         # 评分徽标 + "实测推荐"标识
│   │   │   ├── EmptyState.tsx
│   │   │   └── ErrorState.tsx
│   │   ├── home/
│   │   │   ├── SearchHero.tsx         # 入口1：大搜索框
│   │   │   ├── ScenarioTags.tsx       # 入口2：场景标签（读 site_config）
│   │   │   ├── PlatformNav.tsx        # 入口3：平台导航（读 site_config）
│   │   │   ├── FeaturedComparison.tsx # 入口4：本周横评横幅
│   │   │   ├── LatestEvaluations.tsx  # 入口4：最新评测卡片墙
│   │   │   └── ScenarioSolution.tsx   # 💡 场景方案推荐（步骤条）
│   │   ├── scenario/
│   │   │   ├── ScenarioHeader.tsx     # 场景名 + 描述 + Skill 数
│   │   │   ├── SkillFilterBar.tsx     # 筛选：平台 / 评分 / 能力层级
│   │   │   └── PlatformGroup.tsx      # 按平台分组的 Skill 列表
│   │   ├── platform/
│   │   │   ├── PlatformHeader.tsx     # 平台 Logo + 简介 + 收录数
│   │   │   └── PlatformSkillList.tsx
│   │   ├── install/
│   │   │   ├── CategorySection.tsx    # 能力层级分区（基础设施/场景/效率）
│   │   │   └── ChecklistCard.tsx      # 一键配置清单（记忆/搜索/文件/代码/连接/安全）
│   │   ├── skill-detail/
│   │   │   ├── SkillHero.tsx          # 名称 + 评分 + 平台 + 评测时间
│   │   │   ├── FiveQuestions.tsx      # 5 问评测区（Q1-Q5）
│   │   │   ├── AlternativesTable.tsx  # 同类对比表（点击可跳转）
│   │   │   ├── GuideSection.tsx       # 使用指南
│   │   │   ├── EvalMeta.tsx           # 评测方法/测试用例/版本/时间
│   │   │   ├── InstallButton.tsx      # "去安装"外链（api_supported=false 时）
│   │   │   └── trial/
│   │   │       ├── TrialBox.tsx       # 💬 试试看输入框 + 结果展示（客户端组件）
│   │   │       ├── TrialQuotaHint.tsx # "免费试用 3 次 / 仅支持 API 类 Skill"
│   │   │       └── TrialResult.tsx    # 流式/结果渲染 + 复制按钮
│   │   └── articles/
│   │       └── ArticleBody.tsx        # 文章正文（markdown 渲染）
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── server.ts              # createServerClient（Server Component 用）
│   │   │   └── client.ts              # createBrowserClient（客户端组件用）
│   │   ├── trial-api.ts               # ⭐ 试用 API 客户端（fetch 封装 + 错误映射）
│   │   ├── session-token.ts           # localStorage 读写 session_token（uuid）
│   │   ├── seo.ts                     # generateMetadata 复用逻辑 + JSON-LD
│   │   └── utils.ts                   # cn() 等
│   └── types/
│       └── index.ts                   # SkillCard / Platform / Evaluation / TrialConfig 等类型
├── .env.local                        # 环境变量（见 §7）
├── tailwind.config.ts
├── next.config.mjs                   # images.remotePatterns 允许平台 logo 域名
└── package.json
```

---

## 3. 路由表与页面组件拆解

### 3.1 首页 `/`（P0 — 四大入口）

> 数据：`site_config`（home_scenario_tags / home_platforms / featured_comparison）
> + `skill_cards_view`（最新评测 6 张 + 热门）+ `scenario_solutions`（方案推荐）

| 区块 | 组件 | 数据查询 | 备注 |
|------|------|----------|------|
| 顶部导航 | SiteHeader | — | Logo + 全局搜索框 + 关于 |
| 入口1 搜索 | SearchHero | — | 提交 → `/search?q=` |
| 入口2 场景标签 | ScenarioTags | site_config.home_scenario_tags | 8 个标签，点击 → `/scenarios/[slug]` |
| 入口3 平台导航 | PlatformNav | site_config.home_platforms + platforms 表 | 10 平台，点击 → `/platforms/[slug]` |
| 入口4 横评横幅 | FeaturedComparison | comparison_articles（featured slug） | 🔥 本周横评 |
| 入口4 最新评测 | LatestEvaluations | skill_cards_view order by evaluated_at desc limit 6 | SkillCard 墙 |
| 场景方案推荐 | ScenarioSolution | scenario_solutions + skills | Step1→2→3 步骤条 + 查看详情 |

### 3.2 场景结果页 `/scenarios/[slug]`（P0 — 路径 A）

> 数据：`skill_cards_view` WHERE scenario_slugs @> ARRAY[slug]

| 区块 | 组件 | 说明 |
|------|------|------|
| 面包屑 | Breadcrumb | 首页 > 场景 |
| 场景头 | ScenarioHeader | 名称 + 描述 + 收录 Skill 数 |
| 筛选栏 | SkillFilterBar | 平台下拉 / 评分区间 / 能力层级（useSearchParams 驱动） |
| 结果列表 | PlatformGroup × N | 按平台分组 → 组内 SkillCard 按 overall_score 降序 |

**30 秒验收**：点击标签 → 直达此页 → 3 次点击内看到"推荐哪个 Skill"结论（列表顶部即最高分）。

### 3.3 Skill 详情页 `/skills/[slug]`（P0 — 路径 A/B 终点）

> 数据：skills + platforms + evaluations（最新一条）+ skill_alternatives + guides

| 区块 | 组件 | 说明 |
|------|------|------|
| 面包屑 | Breadcrumb | 首页 > 平台 > Skill |
| 标题区 | SkillHero | 名称 + ⭐评分 + 平台徽标 + 评测日期 |
| 5 问评测 | FiveQuestions | Q1 场景 / Q2 上手 / Q3 稳定 / Q4 免费额度 / Q5 Token成本 |
| 同类对比 | AlternativesTable | 横向对比卡片，点击跳转替代 Skill |
| 使用指南 | GuideSection | 图文教程 |
| **试用区** | **TrialBox** | **`trial_enabled=true` 时渲染（客户端组件）** |
| 安装入口 | InstallButton | `api_supported` 决定：试用 / 去安装（外链 install_url） |
| 评测信息 | EvalMeta | 评测方法 / 测试用例 / 版本 / 时间戳（透明度） |

**试用区交互（TrialBox）**：
```
输入框（placeholder 来自 trial_config.placeholder）
  → 点击"试用" → POST {NEXT_PUBLIC_TRIAL_API_BASE}/trial/api/trial
  → loading 态（骨架屏 + "AI 生成中…"）
  → 成功：TrialResult 渲染 output + 复制按钮 + 剩余次数
  → 429 TRIAL_LIMIT_EXCEEDED：提示"今日试用次数已用完" + 引导去安装
  → 503：提示"试用服务暂时不可用" + 引导去安装（降级路径）
```
> session_token 首次生成后存 localStorage（`crypto.randomUUID()`），所有请求复用。

### 3.4 装机必备页 `/install`（P0 — "安全卫士"支柱）

> 数据：`skill_cards_view` WHERE category='infrastructure'，按子场景分组

| 区块 | 组件 | 说明 |
|------|------|------|
| 页面头 | 静态 Hero | "照着装就行，不用怕" |
| 能力层级分区 | CategorySection | 基础设施增强 → 场景应用 → 效率工具（顺序读 site_config.install_categories） |
| 一键配置清单 | ChecklistCard | 记忆/搜索/文件/代码/连接/安全 六项勾选卡片，每项对应推荐 Skill + 安装链接 |

### 3.5 平台专属页 `/platforms/[slug]`（P0 — 路径 B）

| 区块 | 组件 | 说明 |
|------|------|------|
| 平台头 | PlatformHeader | Logo + 简介 + api_supported 徽标（"支持试用"） |
| Skill 列表 | PlatformSkillList | 按场景分组，组内按评分排序；筛选：场景 / 评分 |

### 3.6 搜索 `/search?q=`（P0 — 入口1结果页）

- Supabase `.ilike('name', '%q%')` + 场景名匹配（`pg_trgm` 索引已建）
- 结果为空 → EmptyState + 场景标签引导

### 3.7 内容页（P1）

- `/comparisons/[slug]`：横评文章（含 skills_included 引用卡片）
- `/tutorials/[slug]`：场景教程

---

## 4. 数据访问层（lib/supabase）

```ts
// lib/supabase/server.ts — Server Component 专用
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookies().getAll(), setAll: () => {} } }
  );
}
```

**列表页统一走视图**（一条查询出卡片全部字段）：
```ts
const { data } = await supabase
  .from('skill_cards_view')
  .select('*')
  .eq('status', 'published')          // 视图已过滤，可省略
  .order('overall_score', { ascending: false })
  .limit(20);
```

**缓存策略**：内容页 `export const revalidate = 300`（5 分钟 ISR）；试用区是客户端组件不受影响。

**类型定义（types/index.ts 摘要）**：
```ts
interface SkillCard {
  id: number; name: string; slug: string; tagline: string | null;
  icon_url: string | null; category: 'infrastructure'|'scene'|'efficiency';
  platform_name: string; platform_slug: string; api_supported: boolean;
  overall_score: number | null; difficulty_score: number | null;
  stability_score: number | null; evaluated_at: string | null;
  trial_enabled: boolean; install_url: string;
  scenario_slugs: string[];
}
interface TrialConfig {
  provider: 'coze'; api_base: string; bot_id: string;
  prompt_template: string; placeholder: string; max_output_chars: number;
}
```

---

## 5. 试用 API 客户端（lib/trial-api.ts）

```ts
const TRIAL_BASE = process.env.NEXT_PUBLIC_TRIAL_API_BASE; // https://ecs.vokki.cn/trial

export async function runTrial(params: {
  skill_id: number; input: string; session_token: string;
}): Promise<TrialResponse> {
  const res = await fetch(`${TRIAL_BASE}/api/trial`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
    signal: AbortSignal.timeout(120_000),   // Coze 执行最长约 90s + 缓冲
  });
  const body = await res.json();
  if (!res.ok || body.code !== 0) throw new TrialApiError(body.code, body.message);
  return body.data;
}
```

**错误映射表（前端展示文案）**：

| code | 前端提示 |
|------|----------|
| 0 | 成功 |
| 400 | 输入为空/超长 → "输入内容不合法" |
| 429 TRIAL_LIMIT_EXCEEDED | "今日免费试用次数已用完，去平台安装继续使用 →" |
| 500 | "生成失败，请重试" |
| 503 | "试用服务维护中，请稍后再试" + 安装引导降级 |

---

## 6. SEO 设计

| 项 | 方案 |
|----|------|
| 元信息 | 每页 `generateMetadata`：title + description（含评分/场景词） |
| Sitemap | `sitemap.ts` 动态生成：/skills/*、/platforms/*、/scenarios/*、/install、文章页 |
| JSON-LD | Skill 详情页注入 `SoftwareApplication` + `Review` 结构化数据（评分 = overall_score） |
| 语义 | 评分用 `<span aria-label="评分 4.5/5">`；外链 `rel="noopener noreferrer"` |

---

## 7. 环境变量

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>          # 只读内容，RLS 已放行
NEXT_PUBLIC_TRIAL_API_BASE=https://ecs.vokki.cn/trial
```

> ⚠️ 严禁在浏览器端使用 service_role key；`trial_config` 不含任何密钥（bot_id 非机密，PAT 只存 ECS）。

---

## 8. UI 规范（沿用 coding-standards）

- **CTA 按钮渐变统一**：`linear-gradient(180deg, #f07a3a, #ff8c50)`（"试用"“去安装”等全部 CTA）
- 圆角：按钮 6px / 卡片 8px / 容器 12px；颜色走 CSS 变量
- 组件：shadcn/ui（Button / Card / Badge / Skeleton / Tabs / Select）
- 列表 key 用 id 不用 index；API 调用 try/catch + loading + 空状态三件套
- 移动端优先；禁止暗黑模式（SPEC 不做清单）

---

## 9. 开发顺序（对应 SPEC Phase 1）

1. **P0-1**：Supabase init.sql 执行 → 验证 skill_cards_view 返回示例数据
2. **P0-2**：脚手架 + lib（supabase / trial-api / session-token）+ 类型
3. **P0-3**：首页四入口 + 场景页 + 详情页（只读内容，无试用）
4. **P0-4**：TrialBox 联调 ECS `/trial/api/trial`（先 mock 后真实）
5. **P0-5**：装机必备页 + 平台页 + 搜索
6. **P1**：横评/教程页、sitemap、JSON-LD、ISR 调优
7. 部署：`vercel deploy`（或 GitHub 自动部署），域名 vokki.cn
