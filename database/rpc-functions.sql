-- ============================================================
-- AI360 查询函数（RPC）— 前端 Supabase 调用
-- 依赖：init.sql 中的表结构和 skill_cards_view 视图
-- 用法：在 init.sql 执行后，运行此脚本创建查询函数
-- ============================================================

-- 1. 获取精选 Skill 卡片（最新评测）
CREATE OR REPLACE FUNCTION get_skill_cards(p_limit INT DEFAULT 20, p_offset INT DEFAULT 0)
RETURNS SETOF skill_cards_view AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM skill_cards_view
  ORDER BY evaluated_at DESC NULLS LAST
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;

-- 2. 按场景获取 Skill 卡片
CREATE OR REPLACE FUNCTION get_skill_cards_by_scenario(p_scenario_slug TEXT)
RETURNS SETOF skill_cards_view AS $$
BEGIN
  RETURN QUERY
  SELECT v.* FROM skill_cards_view v
  INNER JOIN skill_scenarios ss ON ss.skill_id = v.id
  INNER JOIN scenarios s ON s.id = ss.scenario_id
  WHERE s.slug = p_scenario_slug
  ORDER BY v.overall_score DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql STABLE;

-- 3. 按平台获取 Skill 卡片
CREATE OR REPLACE FUNCTION get_skill_cards_by_platform(p_platform_slug TEXT)
RETURNS SETOF skill_cards_view AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM skill_cards_view
  WHERE platform_slug = p_platform_slug
  ORDER BY overall_score DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql STABLE;

-- 4. 按分类获取（装机必备/场景应用/效率工具）
CREATE OR REPLACE FUNCTION get_skill_cards_by_category(p_category TEXT)
RETURNS SETOF skill_cards_view AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM skill_cards_view
  WHERE category = p_category
  ORDER BY overall_score DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql STABLE;

-- 5. 搜索 Skill（名称 + 描述 + tagline）
CREATE OR REPLACE FUNCTION search_skill_cards(p_query TEXT)
RETURNS SETOF skill_cards_view AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM skill_cards_view
  WHERE
    name ILIKE '%' || p_query || '%'
    OR tagline ILIKE '%' || p_query || '%'
    OR description ILIKE '%' || p_query || '%'
    OR platform_name ILIKE '%' || p_query || '%'
  ORDER BY overall_score DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql STABLE;

-- 6. 获取同类替代（含上手/稳定/免费额度，供详情页对比表 + 替代品推荐）
CREATE OR REPLACE FUNCTION get_skill_alternatives(p_skill_slug TEXT)
RETURNS TABLE (
  skill_id INT,
  name VARCHAR,
  slug VARCHAR,
  tagline VARCHAR,
  overall_score DECIMAL,
  platform_name VARCHAR,
  difficulty_score DECIMAL,
  stability_score DECIMAL,
  free_quota VARCHAR,
  icon_url TEXT,
  category VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id, s.name, s.slug, s.tagline,
    (SELECT e.overall_score FROM evaluations e WHERE e.skill_id = s.id ORDER BY e.evaluated_at DESC LIMIT 1),
    p.name,
    (SELECT e.difficulty_score FROM evaluations e WHERE e.skill_id = s.id ORDER BY e.evaluated_at DESC LIMIT 1),
    (SELECT e.stability_score FROM evaluations e WHERE e.skill_id = s.id ORDER BY e.evaluated_at DESC LIMIT 1),
    (SELECT e.free_quota FROM evaluations e WHERE e.skill_id = s.id ORDER BY e.evaluated_at DESC LIMIT 1),
    s.icon_url,
    s.category
  FROM skill_alternatives sa
  INNER JOIN skills s ON s.id = sa.alternative_skill_id
  INNER JOIN platforms p ON p.id = s.platform_id
  INNER JOIN skills src ON src.id = sa.skill_id AND src.slug = p_skill_slug
  WHERE s.status = 'published'
  LIMIT 10;
END;
$$ LANGUAGE plpgsql STABLE;

-- 7. 获取首页推荐组合（最新+最高分+装机必备各取几个）
CREATE OR REPLACE FUNCTION get_home_recommendations()
RETURNS TABLE (
  section TEXT,
  skills JSONB
) AS $$
BEGIN
  -- 最新评测
  RETURN QUERY
  SELECT 'latest'::TEXT,
    COALESCE(
      (SELECT jsonb_agg(jsonb_build_object(
        'id', v.id, 'name', v.name, 'slug', v.slug,
        'tagline', v.tagline, 'category', v.category,
        'platform_name', v.platform_name, 'overall_score', v.overall_score,
        'trial_enabled', v.trial_enabled, 'difficulty_score', v.difficulty_score,
        'stability_score', v.stability_score, 'free_quota', v.free_quota,
        'evaluated_at', v.evaluated_at
      )) FROM (
        SELECT * FROM skill_cards_view
        WHERE evaluated_at IS NOT NULL
        ORDER BY evaluated_at DESC LIMIT 6
      ) v),
      '[]'::jsonb
    );

  -- 最高评分
  RETURN QUERY
  SELECT 'top_rated'::TEXT,
    COALESCE(
      (SELECT jsonb_agg(jsonb_build_object(
        'id', v.id, 'name', v.name, 'slug', v.slug,
        'tagline', v.tagline, 'category', v.category,
        'platform_name', v.platform_name, 'overall_score', v.overall_score,
        'trial_enabled', v.trial_enabled
      )) FROM (
        SELECT * FROM skill_cards_view
        WHERE overall_score IS NOT NULL
        ORDER BY overall_score DESC LIMIT 6
      ) v),
      '[]'::jsonb
    );

  -- 装机必备
  RETURN QUERY
  SELECT 'essential'::TEXT,
    COALESCE(
      (SELECT jsonb_agg(jsonb_build_object(
        'id', v.id, 'name', v.name, 'slug', v.slug,
        'tagline', v.tagline, 'category', v.category,
        'platform_name', v.platform_name, 'overall_score', v.overall_score,
        'trial_enabled', v.trial_enabled
      )) FROM (
        SELECT * FROM skill_cards_view
        WHERE category = 'infra'
        ORDER BY overall_score DESC NULLS LAST LIMIT 8
      ) v),
      '[]'::jsonb
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- 授权匿名访问
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
