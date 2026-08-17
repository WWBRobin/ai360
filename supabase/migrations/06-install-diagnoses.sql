-- ============================================================
-- 06-install-diagnoses.sql · 诊断引擎 knowledge_pack 参数化（学习 + 装机共用 learning_diagnoses）
-- 状态：待审核执行（只写不执行，主线后续审 + 执行）
-- 依赖：04-learning-v3.sql 已建 learning_diagnoses
-- 背景：diagnose API 加 pack 参数；install 包产出五分类诊断（网络/账号/配置/顺序/预期），
--       与 learning 包（工具/操作/流程/期望）共用一张诊断表，用 pack 列区分。
-- 执行方式：Management API query 端点一次只接受一条语句，执行时逐条 POST
--       （同 04/05；create policy 用 drop policy if exists 前置实现幂等）
-- ============================================================

-- 1) 加列：pack 区分 learning/install；step_title 装机卡点步骤；meta 扩展位（含 pack 冗余）
alter table public.learning_diagnoses add column if not exists pack       text not null default 'learning';
alter table public.learning_diagnoses add column if not exists step_title text;
alter table public.learning_diagnoses add column if not exists meta       jsonb not null default '{}'::jsonb;

-- 2) install 包没有 lamp_slug（诊断对象是"工具+步骤"，不是灯盏），放开非空约束
alter table public.learning_diagnoses alter column lamp_slug drop not null;

-- 3) 放宽 diagnosis_type 检查约束，纳入 install 五分类
--    （learning: tool_expectation/operation/flow/expectation
--      install:   network/account/config/order/expectation）
do $$
declare c text;
begin
  select conname into c from pg_constraint
  where conrelid = 'public.learning_diagnoses'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) like '%diagnosis_type%';
  if c is not null then
    execute format('alter table public.learning_diagnoses drop constraint %I', c);
  end if;
end $$;

alter table public.learning_diagnoses
  add constraint learning_diagnoses_diagnosis_type_check
  check (diagnosis_type in
    ('tool_expectation','operation','flow','expectation','network','account','config','order'));

-- 4) 索引：按 pack + 时间查装机诊断
create index if not exists idx_learning_diag_pack on public.learning_diagnoses (pack, created_at desc);
create index if not exists idx_learning_diag_install_tool on public.learning_diagnoses (tool_name, created_at desc)
  where pack = 'install';

-- 5) 备注（不执行，仅文档）
--    · 现有 RLS policy（04 已建）按 user_id 隔离，覆盖新列，无需改。
--    · 匿名 install 诊断由服务端 route（service_role）直写，绕过 RLS，同 04 口径。
--    · 若 main 未执行本迁移，route 内落库为 best-effort：插入失败静默跳过，诊断仍返回给用户。
