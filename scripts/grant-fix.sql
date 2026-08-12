-- ============================================================
-- service_role 权限修复（一次性执行）
-- 问题：init.sql 只对 anon, authenticated 授了 SELECT，
--       service_role 对所有表零权限 → REST API 写入返回 403/42501
-- 执行方式：Supabase Dashboard → SQL Editor → 粘贴执行
-- ============================================================

-- service_role 绕 RLS 但不绕 GRANT，必须显式授权
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- 验证：查询 information_schema 确认权限
SELECT 'tables_granted' AS check, count(*) AS cnt
FROM information_schema.table_privileges
WHERE grantee = 'service_role' AND table_schema = 'public';
