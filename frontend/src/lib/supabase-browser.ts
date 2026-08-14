import { createClient } from '@supabase/supabase-js'

/**
 * 浏览器端 Supabase 客户端（Client Component 专用）。
 *
 * 与 lib/supabase.ts（server 端，persistSession:false）区分：
 * 本客户端启用 session 持久化 + autoRefresh，用于登录/注册/收藏/进度等
 * 需要 auth.uid() 的操作。每次调用 createBrowserClient() 返回新实例，
 * 但底层共享 localStorage 的 session，不会重复登录。
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export function createBrowserClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })
}
