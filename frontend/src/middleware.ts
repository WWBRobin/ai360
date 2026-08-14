import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Supabase Auth 会话刷新中间件。
 *
 * 没有 middleware 时，访问令牌过期（默认 1 小时）后用户会被静默登出 ——
 * 因为 Server Component 无法刷新 cookie 里的 session。
 * 这里在每个请求时刷新过期 token，保证登录态长期有效。
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 刷新过期 token（getUser 而非 getSession：会校验签名，防伪造）
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 已登录用户访问 /login → 跳首页（避免重复登录）
  if (user && request.nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * 匹配除以下外的所有路径：
     * - _next/static（静态资源）
     * - _next/image（图片优化）
     * - favicon、图标、图片等静态文件
     */
    '/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|logo-.*\\.png|og-image\\.png|platform-logos|skill-icons|manifest\\.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
