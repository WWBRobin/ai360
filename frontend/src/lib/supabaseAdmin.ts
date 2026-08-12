import { createClient } from '@supabase/supabase-js'

/**
 * 服务端专用 Supabase 客户端（service_role key，绕过 RLS）。
 *
 * 仅在 Server Actions / Server Components 中 import（见 src/app/admin/actions.ts）。
 * 安全保证：
 * - SUPABASE_SERVICE_ROLE_KEY 没有 NEXT_PUBLIC_ 前缀 → 不会被打进客户端 bundle；
 * - 仅在带 'use server' 的文件里被引用 → Next.js 编译期保证只在服务端运行；
 * - service_role key 永不返回给浏览器。
 *
 * 写入场景：管理后台 CRUD（skills / evaluations 等表 RLS 对 anon 只读，
 * 必须用 service_role 才能写入）。
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL 未配置')
}
if (!serviceRoleKey) {
  throw new Error(
    'SUPABASE_SERVICE_ROLE_KEY 未配置。请在 Supabase Dashboard → Project Settings → API 复制 service_role key，写入 frontend/.env.local',
  )
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})
