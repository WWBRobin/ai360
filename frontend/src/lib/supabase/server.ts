import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Server Component / Server Action 专用 Supabase 客户端。
 *
 * 通过 cookie 读取登录态 —— 登录用户在服务端也能拿到 auth.uid()，
 * 支撑收藏/个性化筛选/学习进度等服务端渲染场景。
 *
 * 注意：Next.js 15+ cookies() 是异步的，本函数必须是 async。
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component 里调用 set 会抛错（只允许在 Server Action / Route Handler 写 cookie）
            // middleware.ts 会兜底刷新 session，这里静默忽略
          }
        },
      },
    }
  )
}
