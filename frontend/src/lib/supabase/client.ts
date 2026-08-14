import { createBrowserClient } from '@supabase/ssr'

/**
 * 浏览器端 Supabase 客户端（@supabase/ssr 版，cookie 共享给服务端）。
 *
 * 与旧 supabase-browser.ts 的区别：session 存 cookie 而非仅 localStorage，
 * Server Component（createSupabaseServerClient）能看到同一登录态。
 *
 * 模块级单例：多次 import 不重复创建（React StrictMode 下尤其重要）。
 */
let client: ReturnType<typeof createBrowserClient> | undefined

export function getSupabaseBrowserClient() {
  if (!client) {
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return client
}
