-- ============================================================
-- 04-learning-v3.sql · 学习板块 v3（指导手册模式）数据底座
-- 状态：草案（本任务不执行，交主线审核后在 Supabase SQL Editor 跑）
-- 依赖：auth.users（Supabase 内置）、learning_progress 已存在
-- ============================================================

-- 1) 工具选择记录（评判矩阵点击埋点 → 数据飞轮）
-- 归属规则（03-设计 §八）：反哺矩阵以"最终满意完成那次"为准，
-- 每次工具切换都记录（切换链 B→A），不只记终点。
create table if not exists public.learning_choices (
  id             bigserial primary key,
  user_id        uuid null references auth.users (id) on delete cascade,
  -- 匿名用户为 null；匿名期数据只进 localStorage，登录补报后带 user_id
  anon_id        text,                -- 匿名标识（localStorage 生成的 uuid），登录补报时回填关联
  lamp_slug      text not null,       -- 'xhs-lamp-0'..'xhs-lamp-4'
  tool_key       text not null,       -- 矩阵工具行的稳定 key（TOOL_LINKS.match）
  tool_name      text not null,       -- 用户点的那行第一列全文（人读）
  choice_order   integer not null default 1,  -- 该灯内第几次选择（1=初选，2+=切换）
  switched_from  text,                -- 上一个工具 key（B→A 切换链）
  session_star   text,                -- 所属星 slug，如 'xhs-note'
  created_at     timestamptz not null default now()
);

create index if not exists idx_learning_choices_lamp on public.learning_choices (lamp_slug, created_at desc);
create index if not exists idx_learning_choices_user on public.learning_choices (user_id) where user_id is not null;
create index if not exists idx_learning_choices_tool on public.learning_choices (tool_key, lamp_slug);

-- 2) 诊断记录（满意度分叉"不理想"→ 诊断结果沉淀，越用越聪明）
create table if not exists public.learning_diagnoses (
  id              bigserial primary key,
  user_id         uuid null references auth.users (id) on delete cascade,
  anon_id         text,
  lamp_slug       text not null,
  tool_name       text,               -- 诊断时自动带出的本步所选工具
  diagnosis_type  text not null check (diagnosis_type in
                    ('tool_expectation','operation','flow','expectation')),
  user_input      text,               -- 用户贴回的结果文本
  image_url       text,               -- 可选图片 URL
  message         text not null,      -- 诊断结论
  suggestion      text not null,      -- 具体下一步
  model           text,               -- 'deepseek-chat' | 'qwen-vl-plus'
  created_at      timestamptz not null default now()
);

create index if not exists idx_learning_diag_lamp on public.learning_diagnoses (lamp_slug, created_at desc);

-- 3) RLS
alter table public.learning_choices   enable row level security;
alter table public.learning_diagnoses enable row level security;

-- 写入只允许本人（登录用户）；匿名写入走服务端 route（service_role，绕过 RLS）
create policy "choices insert own" on public.learning_choices
  for insert to authenticated with check (auth.uid() = user_id);
create policy "choices read own" on public.learning_choices
  for select to authenticated using (auth.uid() = user_id);

create policy "diag insert own" on public.learning_diagnoses
  for insert to authenticated with check (auth.uid() = user_id);
create policy "diag read own" on public.learning_diagnoses
  for select to authenticated using (auth.uid() = user_id);

-- 4) 矩阵反哺聚合视图（最终满意口径 + 切换链弃用口径）
--    成功 = 该 user 在该灯最后一次 choice 之后点亮（learning_progress completed）。
--    主线注：learning_progress.path_id/unit_id 需按 v3 约定填 'xhs-note' / lamp_slug。
create or replace view public.v_tool_matrix_stats as
with last_choice as (
  select distinct on (user_id, lamp_slug)
    user_id, lamp_slug, tool_key, choice_order, created_at
  from public.learning_choices
  where user_id is not null
  order by user_id, lamp_slug, created_at desc
),
lit as (
  select user_id, unit_id as lamp_slug
  from public.learning_progress
  where user_id is not null and status = 'completed'
),
abandoned as (
  -- 被换掉的（出现在 switched_from 里）= 弃用信号
  select switched_from as tool_key, lamp_slug, count(*) as abandoned_cnt
  from public.learning_choices
  where user_id is not null and switched_from is not null
  group by 1, 2
)
select
  lc.lamp_slug,
  lc.tool_key,
  count(*)                                        as total_users,
  count(*) filter (where l.user_id is not null)   as satisfied_users,
  round(100.0 * count(*) filter (where l.user_id is not null)
        / greatest(count(*), 1), 1)               as satisfied_rate,
  coalesce(ab.abandoned_cnt, 0)                   as abandoned_cnt
from last_choice lc
left join lit l on l.user_id = lc.user_id and l.lamp_slug = lc.lamp_slug
left join abandoned ab on ab.tool_key = lc.tool_key and ab.lamp_slug = lc.lamp_slug
group by lc.lamp_slug, lc.tool_key, ab.abandoned_cnt;

-- 5) 备注（不执行，仅文档）
-- learning_progress 复用现有表：path_id='xhs-note', unit_id=lamp_slug, status='completed'
-- 点亮时由前端调用（登录用户经 /api/learn/choice 类似端点或直写，匿名仅 localStorage）
