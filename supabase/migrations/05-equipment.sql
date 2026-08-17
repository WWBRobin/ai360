-- ============================================================
-- 05-equipment.sql · AI 装备统一对象模型（E4 平台原语 0）
-- 状态：待审核执行（只写不执行，主线后续审 + 执行）
-- 依赖：auth.users（Supabase 内置）、skills（init.sql，id 为 SERIAL/INTEGER）、
--       content_items（01_pipeline_tables.sql）、set_updated_at()（init.sql 已建）
-- 战略来源：九裁决 E4 —— EquipmentItem 是「AI 装备」从口号变成系统的地基：
--       管家读它、体检打分它、装机写入它、学习点亮挂在它身上。
-- 执行方式：Management API query 端点一次只接受一条语句，执行时逐条 POST
--       （同 04-learning-v3.sql；create policy 用 drop policy if exists 前置实现幂等）
-- ============================================================

-- ------------------------------------------------------------
-- 枚举口径（DB 存英文码，UI 显示中文，前端做映射）：
--   type:     software=软件 | skill=Skill | mcp=MCP服务器 |
--             model_key=模型Key/中转 | memory=记忆插件 | subscription=订阅服务
--   status:   not_installed=未装 | installed=已装 | needs_repair=待修 | deprecated=弃用
--   source:   guided_install=陪跑装 | claimed=认领 | health_check=体检发现 | manual=手动添加
--   为什么存英文码：与本库既有枚举一致（skills.status/evaluations.* 等全英文），
--   中文只做显示层，避免未来排序/比较/迁移踩编码坑。
-- ------------------------------------------------------------

-- 1) equipment_items：统一装备对象表（四板块共用同一批对象）
create table if not exists public.equipment_items (
  id             bigserial primary key,
  user_id        uuid null references auth.users (id) on delete cascade,
  -- 匿名用户为 null；匿名期数据只进 localStorage，登录补报后带 user_id
  anon_id        text,                -- 匿名标识（localStorage uuid），登录补报时回填关联
  type           text not null check (type in
                   ('software','skill','mcp','model_key','memory','subscription')),
  name           text not null,       -- 装备名（人读，如 'Tavily 搜索 API'）
  source         text not null default 'manual' check (source in
                   ('guided_install','claimed','health_check','manual')),
  status         text not null default 'not_installed' check (status in
                   ('not_installed','installed','needs_repair','deprecated')),
  health_score   integer check (health_score >= 0 and health_score <= 100),
                   -- 可空 0-100，体检打分写回（NULL=未体检）
  last_used_at   timestamptz,         -- 最近使用时间（激活度信号；中转调用/管家读）
  linked_lamp    text,                -- 可空，关联 content_items.slug（如 'xhs-lamp-0'），
                   -- 学习点亮挂在这件装备上（软引用，同 learning_choices.lamp_slug 口径，不加 FK）
  meta           jsonb not null default '{}'::jsonb,
                   -- 扩展位：skill_id/skill_slug（type=skill/mcp 回链 skills）、
                   -- install_url/icon_url/platform、model_key 掩码、订阅到期日等
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists idx_equipment_user_type on public.equipment_items (user_id, type);
create index if not exists idx_equipment_anon       on public.equipment_items (anon_id);
create index if not exists idx_equipment_status     on public.equipment_items (status);
create index if not exists idx_equipment_lamp       on public.equipment_items (linked_lamp)
  where linked_lamp is not null;

create trigger trg_equipment_items_updated_at before update on public.equipment_items
  for each row execute function set_updated_at();

-- 2) install_records：装机陪跑记录（装机设计 §七；装机状态回流的来源）
--    一次装机陪跑 = 一条记录；status 走 not_started→in_progress→(stuck|done|skipped)
create table if not exists public.install_records (
  id               bigserial primary key,
  user_id          uuid null references auth.users (id) on delete cascade,
  anon_id          text,
  skill_id         integer references public.skills (id) on delete set null,
                   -- 装机项关联的导航库工具；skill 被删时记录保留（审计/统计），置 null
  install_plan_id  text,              -- 装机单 id（可空；装机单表后续建，当前客户端生成 uuid）
  status           text not null default 'not_started' check (status in
                     ('not_started','in_progress','stuck','done','skipped')),
                   -- not_started=未开始 | in_progress=进行中 | stuck=卡住 | done=已完成 | skipped=跳过
  stuck_log        jsonb not null default '[]'::jsonb,
                   -- 卡点记录（数组，每次卡住追加一条）：
                   -- [{step_index, symptom, cause, fix, resolved, created_at}]
                   -- 这是最宝贵的数据：真实卡点 → 内容生产优先级（数据飞轮起点）
  started_at       timestamptz,
  completed_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists idx_install_user_skill on public.install_records (user_id, skill_id);
create index if not exists idx_install_skill      on public.install_records (skill_id);
create index if not exists idx_install_plan       on public.install_records (install_plan_id);
create index if not exists idx_install_anon       on public.install_records (anon_id);

create trigger trg_install_records_updated_at before update on public.install_records
  for each row execute function set_updated_at();

-- 3) skills 加列 install_steps（装机设计 §四 标准化步骤模型，NULL=无陪跑）
--    skills 表已有 public_read_skills 公开只读策略，install_steps 随表 SELECT 可读；
--    写入仅 service_role（手搓定标准 → AI 批量生成 → 社区纠错），前端不直写。
alter table public.skills add column if not exists install_steps jsonb;
comment on column public.skills.install_steps is
  '装机陪跑标准化步骤（§四 InstallStep 数组）：[{type,title,guide,expect,pitfalls[{symptom,cause,fix}],verify,minutes}]。NULL=无陪跑（仅跳转 install_url）。service_role 维护，前端只读。';

-- 4) RLS
alter table public.equipment_items enable row level security;
alter table public.install_records  enable row level security;

-- authenticated：读写自己的（auth.uid() = user_id）
drop policy if exists "equipment read own" on public.equipment_items;
create policy "equipment read own" on public.equipment_items
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists "equipment insert own" on public.equipment_items;
create policy "equipment insert own" on public.equipment_items
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "equipment update own" on public.equipment_items;
create policy "equipment update own" on public.equipment_items
  for update to authenticated using (auth.uid() = user_id);
drop policy if exists "equipment delete own" on public.equipment_items;
create policy "equipment delete own" on public.equipment_items
  for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "install read own" on public.install_records;
create policy "install read own" on public.install_records
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists "install insert own" on public.install_records;
create policy "install insert own" on public.install_records
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "install update own" on public.install_records;
create policy "install update own" on public.install_records
  for update to authenticated using (auth.uid() = user_id);
drop policy if exists "install delete own" on public.install_records;
create policy "install delete own" on public.install_records
  for delete to authenticated using (auth.uid() = user_id);

-- anon：只写自己的匿名行（user_id is null），登录行隔离。
-- 口径说明：anon 无 JWT，RLS 无法按 anon_id 精确归属——"自己的"= 匿名行≠登录行；
--       真正的"谁的"由 anon_id 在登录补报时合并判定（同 04-learning-v3 口径）。
--       若要严格隔离匿名写，走 service_role 服务端 route（04 同款），前端不直连。
drop policy if exists "equipment anon read" on public.equipment_items;
create policy "equipment anon read" on public.equipment_items
  for select to anon using (user_id is null);
drop policy if exists "equipment anon insert" on public.equipment_items;
create policy "equipment anon insert" on public.equipment_items
  for insert to anon with check (user_id is null);
drop policy if exists "equipment anon update" on public.equipment_items;
create policy "equipment anon update" on public.equipment_items
  for update to anon using (user_id is null);
drop policy if exists "equipment anon delete" on public.equipment_items;
create policy "equipment anon delete" on public.equipment_items
  for delete to anon using (user_id is null);

drop policy if exists "install anon read" on public.install_records;
create policy "install anon read" on public.install_records
  for select to anon using (user_id is null);
drop policy if exists "install anon insert" on public.install_records;
create policy "install anon insert" on public.install_records
  for insert to anon with check (user_id is null);
drop policy if exists "install anon update" on public.install_records;
create policy "install anon update" on public.install_records
  for update to anon using (user_id is null);
drop policy if exists "install anon delete" on public.install_records;
create policy "install anon delete" on public.install_records
  for delete to anon using (user_id is null);

-- 5) GRANT（42501 老坑：Management API 建的表默认零 GRANT，必须显式授）
-- service_role 绕 RLS 但不绕 GRANT：服务端 route 直写必须有表权限
grant all on public.equipment_items, public.install_records to service_role;
-- authenticated 经 RLS 读写本人行，还需表权限 + 序列 USAGE（BIGSERIAL id_seq 默认只授 owner）
grant select, insert, update, delete on public.equipment_items, public.install_records to authenticated;
grant usage, select on sequence public.equipment_items_id_seq, public.install_records_id_seq to authenticated;
-- anon 只写匿名行（user_id is null 策略），同样需表权限 + 序列 USAGE
grant select, insert, update, delete on public.equipment_items, public.install_records to anon;
grant usage, select on sequence public.equipment_items_id_seq, public.install_records_id_seq to anon;

-- 6) 备注（不执行，仅文档）
--    · 装机完成 = 写 equipment_items(status=installed, source=guided_install)
--      + install_records(status=done) + learning_progress(status=completed, 点亮)
--      三者由前端在 StepCard onLit 回调里一次触发（登录用户直写，匿名 localStorage 待登录补报）。
--    · learning_progress 复用现有表：path_id=星slug, unit_id=lamp_slug（见 04 口径）。
--    · user_profiles.level 复用：装机单 level_min 过滤。
--    · linked_lamp 不加 FK（软引用）：content_items.slug 是管线表，灯盏可能先于装备存在。
