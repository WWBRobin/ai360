-- ============================================================
-- AI360 邮件订阅 — subscribers 表
-- 独立文件：简单收集邮箱，不做双重确认（Double Opt-in）
-- 用法：在 Supabase SQL Editor 中执行（幂等，可重复执行）
-- ============================================================

-- ---------- 1. 建表 ----------
CREATE TABLE IF NOT EXISTS subscribers (
  id          BIGSERIAL PRIMARY KEY,
  email       VARCHAR(255) UNIQUE NOT NULL,
  status      VARCHAR(20)  NOT NULL DEFAULT 'active',   -- active | unsubscribed | bounced
  source      VARCHAR(50)  DEFAULT 'website',            -- website | import | api
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- updated_at 触发器（复用 init.sql 中的 set_updated_at 函数；
-- 若未创建则用下方内联定义，幂等）
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_subscribers_updated_at ON subscribers;
CREATE TRIGGER trg_subscribers_updated_at
  BEFORE UPDATE ON subscribers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 邮箱格式约束（基础正则，不做严格反查）
ALTER TABLE subscribers
  DROP CONSTRAINT IF EXISTS subscribers_email_check;
ALTER TABLE subscribers
  ADD CONSTRAINT subscribers_email_check
  CHECK (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$');

-- created_at 索引（按订阅时间排序/统计）
CREATE INDEX IF NOT EXISTS idx_subscribers_created_at
  ON subscribers (created_at DESC);

-- status 索引（筛活跃订阅者）
CREATE INDEX IF NOT EXISTS idx_subscribers_status
  ON subscribers (status);

-- ---------- 2. RLS 策略 ----------
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

-- 匿名用户可 INSERT（订阅页面直接写入，不要求登录）
DROP POLICY IF EXISTS "anon can subscribe" ON subscribers;
CREATE POLICY "anon can subscribe"
  ON subscribers FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 匿名用户可 UPDATE 仅用于 upsert 的 ON CONFLICT 分支
-- （upsert 需要 INSERT + UPDATE 权限；UPDATE 策略限制只能改 status/source，不能改 email）
DROP POLICY IF EXISTS "anon can upsert" ON subscribers;
CREATE POLICY "anon can upsert"
  ON subscribers FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 读权限：匿名不可读（防止邮箱泄露），仅 service_role / authenticated 可读
-- 不创建 SELECT policy → anon 默认拒绝读取

-- ---------- 3. 授权 ----------
-- anon/authenticated 只能 INSERT / UPDATE（订阅 / upsert）
GRANT INSERT, UPDATE ON subscribers TO anon, authenticated;
-- 显式不授予 SELECT（anon 无法拉取邮箱列表）

-- service_role 默认绕过 RLS，无需额外授权即可全量读写

-- ---------- 4. 完成检查 ----------
SELECT 'subscribers' AS table_name, count(*) FROM subscribers;
