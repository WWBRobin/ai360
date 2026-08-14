-- 2026-08-16: skill_cards_view 加入 level_min/level_optimal（等级标注列）
-- 注意：view 被 6 个函数依赖（get_skill_cards* / search_skill_cards），
-- CREATE OR REPLACE 因列顺序变化会失败（42P16），必须 DROP CASCADE 后整体重建。
-- 函数定义重建前先从 pg_proc 导出（pg_get_functiondef）。

DROP VIEW IF EXISTS skill_cards_view CASCADE;

CREATE VIEW skill_cards_view AS
SELECT s.id, s.name, s.slug, s.tagline, s.description, s.icon_url, s.category,
       p.name AS platform_name, p.slug AS platform_slug, p.api_supported,
       e.overall_score, e.difficulty_score, e.stability_score, e.evaluated_at,
       e.free_quota, e.evaluation_method,
       s.trial_enabled, s.install_url,
       s.level_min, s.level_optimal,
       COALESCE(array_agg(sc.slug ORDER BY sc.slug) FILTER (WHERE sc.slug IS NOT NULL), '{}'::character varying[]) AS scenario_slugs
FROM skills s
JOIN platforms p ON p.id = s.platform_id
LEFT JOIN LATERAL (SELECT * FROM evaluations WHERE skill_id = s.id LIMIT 1) e ON true
LEFT JOIN skill_scenarios ss ON ss.skill_id = s.id
LEFT JOIN scenarios sc ON sc.id = ss.scenario_id
GROUP BY s.id, p.id, e.overall_score, e.difficulty_score, e.stability_score, e.evaluated_at, e.free_quota, e.evaluation_method;

GRANT SELECT ON skill_cards_view TO anon, authenticated;

-- 依赖函数从 pg_proc 导出后按原定义重建（见 03 的执行记录），并：
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
