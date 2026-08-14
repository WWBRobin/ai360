-- ============================================================
-- AI360 / ArcDock — 用户系统初始化脚本
-- 版本: v1.0 (2026-08-15)  依据: 学习板块产品设计方案 v2.1 §6.6 + §9.4
-- 用法: 在 Supabase SQL Editor 中一次性执行（幂等，可重复执行）
-- 依赖: init.sql 已执行（skills 表已存在）；Supabase Auth 已启用 Email 登录
-- ============================================================

-- ---------- 更新时间触发器（幂等，独立文件内联定义）----------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 1. 用户资料（等级 + 场景 + 基本资料）
--    关联 auth.users（Supabase Auth 自动建），注册后触发器自动插入一行
-- ============================================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id             UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname       TEXT,
  avatar_url     TEXT,
  level          VARCHAR(5) NOT NULL DEFAULT 'L1',   -- L1 | L2 | L3 | L4 | L5
  scenes         TEXT[] DEFAULT '{}',                 -- 场景 slug 数组（1-3 个）
  primary_scene  TEXT,                                -- 主场景（第一个选择的）
  assessed_at    TIMESTAMPTZ,                         -- 最近一次评测时间
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 2. 收藏（用户收藏 Skill）
-- ============================================================
CREATE TABLE IF NOT EXISTS favorites (
  id             BIGSERIAL PRIMARY KEY,
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id       INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, skill_id)
);

-- ============================================================
-- 3. 评测结果（每次评测留一条历史，支持"重新测试"）
-- ============================================================
CREATE TABLE IF NOT EXISTS assessment_results (
  id             BIGSERIAL PRIMARY KEY,
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  level          VARCHAR(5) NOT NULL,                 -- 判定结果 L1-L5
  scenes         TEXT[] DEFAULT '{}',
  primary_scene  TEXT,
  answers        JSONB,                               -- 完整答案（题目/选项/分值）
  assessed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 4. 学习进度（单元级，闯关式路径）
-- ============================================================
CREATE TABLE IF NOT EXISTS learning_progress (
  id             BIGSERIAL PRIMARY KEY,
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  path_id        TEXT NOT NULL,                       -- 路径 id（如 L2_content_creation）
  unit_id        TEXT NOT NULL,                       -- 单元 id（如 u003）
  status         VARCHAR(20) NOT NULL DEFAULT 'in_progress', -- in_progress | completed
  completed_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, path_id, unit_id)
);
CREATE TRIGGER trg_learning_progress_updated_at BEFORE UPDATE ON learning_progress
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 5. 能力凭证（学习天数 / 连续天数 / 完成数 / 公开 profile 设置）
--    对应 v2.1 §9.4，Phase 1 只记数据不做展示页
-- ============================================================
CREATE TABLE IF NOT EXISTS learning_credentials (
  user_id               UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_learning_days   INTEGER NOT NULL DEFAULT 0,   -- 累计有学习行为的天数
  current_streak        INTEGER NOT NULL DEFAULT 0,   -- 当前连续天数
  longest_streak        INTEGER NOT NULL DEFAULT 0,   -- 最长连续天数
  total_units_completed INTEGER NOT NULL DEFAULT 0,
  paths_completed       INTEGER NOT NULL DEFAULT 0,
  last_active_date      DATE,                          -- 用于判断连续性
  profile_public        BOOLEAN NOT NULL DEFAULT FALSE,
  profile_slug          TEXT UNIQUE,                   -- arcdock.cn/u/{slug}
  show_skill_list       BOOLEAN NOT NULL DEFAULT TRUE,
  show_learning_stats   BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_learning_credentials_updated_at BEFORE UPDATE ON learning_credentials
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 6. 索引
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_skill ON favorites(skill_id);
CREATE INDEX IF NOT EXISTS idx_assessment_user ON assessment_results(user_id, assessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_progress_user ON learning_progress(user_id, path_id);

-- ============================================================
-- 7. 自动建 profile 触发器（注册即建资料行）
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, nickname)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nickname', split_part(COALESCE(NEW.email,''), '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 8. RLS（行级安全：用户只能读写自己的数据）
-- ============================================================

-- user_profiles：本人可读写；他人可读（公开等级/昵称展示）
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_select_own" ON user_profiles;
CREATE POLICY "profiles_select_own" ON user_profiles
  FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "profiles_select_public" ON user_profiles;
CREATE POLICY "profiles_select_public" ON user_profiles
  FOR SELECT USING (true);  -- 等级/昵称是公开展示信息（凭证页需要）
DROP POLICY IF EXISTS "profiles_insert_own" ON user_profiles;
CREATE POLICY "profiles_insert_own" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "profiles_update_own" ON user_profiles;
CREATE POLICY "profiles_update_own" ON user_profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- favorites：仅本人读写
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "favorites_select_own" ON favorites;
CREATE POLICY "favorites_select_own" ON favorites
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "favorites_insert_own" ON favorites;
CREATE POLICY "favorites_insert_own" ON favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "favorites_delete_own" ON favorites;
CREATE POLICY "favorites_delete_own" ON favorites
  FOR DELETE USING (auth.uid() = user_id);

-- assessment_results：仅本人读写
ALTER TABLE assessment_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "assessment_select_own" ON assessment_results;
CREATE POLICY "assessment_select_own" ON assessment_results
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "assessment_insert_own" ON assessment_results;
CREATE POLICY "assessment_insert_own" ON assessment_results
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- learning_progress：仅本人读写
ALTER TABLE learning_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "progress_select_own" ON learning_progress;
CREATE POLICY "progress_select_own" ON learning_progress
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "progress_insert_own" ON learning_progress;
CREATE POLICY "progress_insert_own" ON learning_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "progress_update_own" ON learning_progress;
CREATE POLICY "progress_update_own" ON learning_progress
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- learning_credentials：本人读写；他人可读（公开凭证页）
ALTER TABLE learning_credentials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "credentials_select_own" ON learning_credentials;
CREATE POLICY "credentials_select_own" ON learning_credentials
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "credentials_select_public" ON learning_credentials;
CREATE POLICY "credentials_select_public" ON learning_credentials
  FOR SELECT USING (profile_public = true);
DROP POLICY IF EXISTS "credentials_insert_own" ON learning_credentials;
CREATE POLICY "credentials_insert_own" ON learning_credentials
  FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "credentials_update_own" ON learning_credentials;
CREATE POLICY "credentials_update_own" ON learning_credentials
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 9. 权限（GRANT）
-- ============================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE ON user_profiles TO authenticated;
GRANT SELECT ON user_profiles TO anon;                          -- 公开等级/昵称可读
GRANT SELECT, INSERT, DELETE ON favorites TO authenticated;
GRANT SELECT, INSERT ON assessment_results TO authenticated;
GRANT SELECT, INSERT, UPDATE ON learning_progress TO authenticated;
GRANT SELECT, INSERT, UPDATE ON learning_credentials TO authenticated;
GRANT SELECT ON learning_credentials TO anon;                   -- 公开凭证页可读
-- service_role 全表全权限（防 42501 权限缺口，见 supabase-sql-init skill）
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- ============================================================
-- 10. 结尾核对（执行后检查行数）
-- ============================================================
SELECT 'user_profiles' AS tbl, COUNT(*) FROM user_profiles
UNION ALL SELECT 'favorites', COUNT(*) FROM favorites
UNION ALL SELECT 'assessment_results', COUNT(*) FROM assessment_results
UNION ALL SELECT 'learning_progress', COUNT(*) FROM learning_progress
UNION ALL SELECT 'learning_credentials', COUNT(*) FROM learning_credentials;

-- ============================================================
-- 11. 补丁（2026-08-15 E2E 发现）：sequence 权限
--     症状：authenticated INSERT favorites 报 42501 permission denied for sequence
--     根因：BIGSERIAL 的 sequence 默认只授给 owner（postgres），authenticated 无法 nextval
-- ============================================================
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
