-- ============================================================
-- 07-models.sql · AI 模型目录（C2 模型层原语）
-- 状态：待审核执行（只写不执行，主线后续审 + 执行）
-- 依赖：set_updated_at()（init.sql 已建）
-- 战略来源：战略总纲v2 §三 原语（模型层=上下文层，供中转站选型对比卡
--       + 软件详情页「背后的引擎」模块用）
-- 设计口径：models 是公开参考数据（谁都能读），写仅 service_role
--       （手搓定标准 → AI 批量生成 → 人工校核），前端只读。
-- 执行方式：Management API query 端点一次只接受一条语句，执行时逐条 POST
--       （同 04-learning-v3.sql；create policy 用 drop policy if exists 前置实现幂等）
-- ============================================================

-- ------------------------------------------------------------
-- 字段口径：
--   id              slug 主键，如 'deepseek-v4'
--   vendor          厂商（中文，如 '深度求索'）
--   name            模型中文名（如 'DeepSeek-V4'）
--   one_liner       一句话定位（说人话，消决策摩擦）
--   context_window  上下文窗口（tokens，整数）
--   price_input     输入价格（元/百万 tokens；海外模型按官方美元价换算，注明汇率）
--   price_output    输出价格（元/百万 tokens）
--   free_tier       免费额度描述（如 '注册送 2000 万 tokens'）
--   capability_tier 能力档位 1-5（1=基础 5=顶尖，公开评测口碑，estimated）
--   best_for        最擅长的场景（如 '长文本'）
--   access_web      网页/官方聊天是否可用（bool）
--   access_api      官方 API 是否可用（bool）
--   access_relay    中转站是否可接入（bool）
--   rating          综合评分（0-5，estimated 标注）
--   evidence        来源 URL（价格必须有官方出处）
--   estimated       数据是否估算（true=估算/待核）
-- ------------------------------------------------------------

-- 1) models：主流大模型目录
create table if not exists public.models (
  id              text primary key,                 -- slug 主键，如 'deepseek-v4'
  vendor          text not null,                    -- 厂商（中文）
  name            text not null,                    -- 模型中文名
  one_liner       text not null,                    -- 一句话定位（说人话）
  context_window  integer check (context_window > 0), -- 上下文窗口（tokens）
  price_input     numeric check (price_input >= 0),   -- 输入价（元/百万 tokens）
  price_output    numeric check (price_output >= 0),  -- 输出价（元/百万 tokens）
  free_tier       text,                             -- 免费额度描述
  capability_tier integer not null check (capability_tier between 1 and 5), -- 能力档位 1-5
  best_for        text,                             -- 最擅长场景
  access_web      boolean not null default false,   -- 网页可用
  access_api      boolean not null default false,   -- 官方 API 可用
  access_relay    boolean not null default false,   -- 中转站可接入
  rating          numeric check (rating >= 0 and rating <= 5), -- 评分 0-5
  evidence        text,                             -- 来源 URL
  estimated       boolean not null default true,    -- 数据是否估算
  updated_at      timestamptz not null default now()
);

create index if not exists idx_models_vendor on public.models (vendor);
create index if not exists idx_models_tier  on public.models (capability_tier);
create index if not exists idx_models_access on public.models (access_api, access_relay);

create trigger trg_models_updated_at before update on public.models
  for each row execute function set_updated_at();

-- 2) RLS：公开只读（所有角色可读，写仅 service_role）
alter table public.models enable row level security;

drop policy if exists "models public read" on public.models;
create policy "models public read" on public.models
  for select to anon, authenticated using (true);

-- 3) GRANT（42501 老坑：Management API 建的表默认零 GRANT，必须显式授）
-- 公开只读：anon/authenticated 只读；service_role 全权维护
grant select on public.models to anon, authenticated;
grant all on public.models to service_role;

-- 4) 备注（不执行，仅文档）
--    · models 数据由服务端 route / AI 批量写入（service_role），前端只读展示。
--    · 中转站选型对比卡读取 models(access_relay=true) 按 price 排序展示；
--      软件详情页「背后的引擎」按 vendor/name 关联展示。
--    · estimated=true 的条目 price 字段在 UI 标注「待核」，滚动更新替换。
