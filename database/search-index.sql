-- ============================================================
-- ArcDock — 搜索索引 + sequence 权限补丁（一次执行）
-- 版本: v1.0 (2026-08-15)
-- 用法: Supabase Dashboard → SQL Editor → 全选粘贴 → Run
-- ============================================================

-- ---------- 1. sequence 权限（修收藏 42501 bug）----------
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ---------- 2. 搜索关键词表 ----------
CREATE TABLE IF NOT EXISTS search_keywords (
  id          BIGSERIAL PRIMARY KEY,
  skill_id    INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  keyword     VARCHAR(100) NOT NULL,
  weight      INTEGER DEFAULT 1,             -- 权重：1=普通 2=核心词
  source      VARCHAR(20) DEFAULT 'ai',      -- ai | manual
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (skill_id, keyword)
);
CREATE INDEX IF NOT EXISTS idx_search_keywords_skill ON search_keywords(skill_id);
CREATE INDEX IF NOT EXISTS idx_search_keywords_keyword ON search_keywords(keyword);

ALTER TABLE search_keywords ENABLE ROW LEVEL SECURITY;
-- 公开只读（搜索时 anon 也要查）
DROP POLICY IF EXISTS "public_read_search_keywords" ON search_keywords;
CREATE POLICY "public_read_search_keywords" ON search_keywords
  FOR SELECT USING (true);
-- 写入仅 service_role（AI 批量灌数据用，不给前端写权限）
GRANT SELECT ON search_keywords TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- ---------- 3. 搜索函数升级：加关键词匹配 ----------
CREATE OR REPLACE FUNCTION search_skill_cards(p_query TEXT)
RETURNS SETOF skill_cards_view AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM skill_cards_view
  WHERE
    name ILIKE '%' || p_query || '%'
    OR tagline ILIKE '%' || p_query || '%'
    OR COALESCE(description, '') ILIKE '%' || p_query || '%'
    OR platform_name ILIKE '%' || p_query || '%'
    OR EXISTS (
      SELECT 1 FROM unnest(scenario_slugs) AS ss_slug
      WHERE ss_slug ILIKE '%' || p_query || '%'
    )
    OR EXISTS (
      SELECT 1 FROM search_keywords sk
      WHERE sk.skill_id = skill_cards_view.id
        AND (sk.keyword ILIKE '%' || p_query || '%' OR p_query ILIKE '%' || sk.keyword || '%')
    )
  ORDER BY
    (CASE WHEN name ILIKE p_query THEN 0
          WHEN name ILIKE '%' || p_query || '%' THEN 1
          WHEN EXISTS (
            SELECT 1 FROM search_keywords sk2
            WHERE sk2.skill_id = skill_cards_view.id AND sk2.keyword ILIKE p_query
          ) THEN 1.5
          WHEN tagline ILIKE '%' || p_query || '%' THEN 2
          ELSE 3 END),
    overall_score DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql STABLE;

GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- ---------- 4. 核对 ----------
SELECT 'search_keywords' AS tbl, COUNT(*) FROM search_keywords;

-- ============================================================
-- 5. 补丁（2026-08-15 E2E 第二轮发现）：user_id 默认值
--    症状：不传 user_id 的 INSERT 报 RLS 违规（NULL != auth.uid()）
--    修复：所有用户表 user_id 列加 DEFAULT auth.uid()，前端可不传
-- ============================================================
ALTER TABLE favorites ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE assessment_results ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE learning_progress ALTER COLUMN user_id SET DEFAULT auth.uid();
