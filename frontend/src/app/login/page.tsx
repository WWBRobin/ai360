'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()

  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setLoading(true)

    try {
      if (mode === 'register') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { nickname: nickname.trim() || undefined },
          },
        })
        if (error) throw error
        // autoconfirm=true 时直接返回 session；=false 时需邮件确认
        if (data.session) {
          router.push('/')
          router.refresh()
        } else {
          setInfo('注册成功，请查收邮箱完成验证后再登录。')
          setMode('login')
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        router.push('/')
        router.refresh()
      }
    } catch (err: any) {
      setError(err?.message || '操作失败，请稍后再试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-wrapper px-4 sm:px-6 lg:px-8 min-h-screen">
      <div className="max-w-sm mx-auto pt-20 pb-20">
        {/* 标题 */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-4">
            <img src="/logo-light.png" alt="ArcDock" className="h-12 w-auto self-center dark:hidden" />
            <img src="/logo-dark.png" alt="ArcDock" className="h-12 w-auto self-center hidden dark:block" />
            <span className="flex flex-col leading-none items-start">
              <span className="font-semibold text-[18px] text-[var(--fg)]">ArcDock</span>
              <span className="text-[12px] text-[var(--fg3)] font-medium mt-1 ml-[48px]">弧光万象</span>
            </span>
          </Link>
          <h1 className="text-[24px] font-bold text-[var(--fg)] leading-tight">
            {mode === 'login' ? '登录' : '创建账号'}
          </h1>
          <p className="text-[14px] text-[var(--fg3)] mt-1.5">
            {mode === 'login'
              ? '登录后收藏工具、记录学习进度、查看你的等级'
              : '注册后开始你的 AI 学习路径'}
          </p>
        </div>

        {/* 表单卡片 */}
        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 space-y-4"
        >
          {mode === 'register' && (
            <div>
              <label className="block text-[13px] font-medium text-[var(--fg)] mb-1.5">
                昵称（可选）
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="怎么称呼你"
                className="w-full h-10 px-3 border border-[var(--border)] rounded-md text-[14px] text-[var(--fg)] bg-[var(--bg)] outline-none focus:border-[var(--primary)] transition"
              />
            </div>
          )}

          <div>
            <label className="block text-[13px] font-medium text-[var(--fg)] mb-1.5">
              邮箱
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full h-10 px-3 border border-[var(--border)] rounded-md text-[14px] text-[var(--fg)] bg-[var(--bg)] outline-none focus:border-[var(--primary)] transition"
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[var(--fg)] mb-1.5">
              密码
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="至少 6 位"
              className="w-full h-10 px-3 border border-[var(--border)] rounded-md text-[14px] text-[var(--fg)] bg-[var(--bg)] outline-none focus:border-[var(--primary)] transition"
            />
          </div>

          {error && (
            <div className="text-[13px] text-red-600 dark:text-red-400 rounded-md bg-red-50 dark:bg-red-950/30 px-3 py-2">
              {error}
            </div>
          )}
          {info && (
            <div className="text-[13px] text-green-700 dark:text-green-400 rounded-md bg-green-50 dark:bg-green-950/30 px-3 py-2">
              {info}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 rounded-md bg-[var(--primary)] text-[var(--on-primary)] text-[14px] font-medium hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? '处理中...' : mode === 'login' ? '登录' : '注册'}
          </button>

          <button
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login')
              setError(null)
              setInfo(null)
            }}
            className="w-full text-[13px] text-[var(--fg3)] hover:text-[var(--fg)] transition"
          >
            {mode === 'login' ? '没有账号？注册' : '已有账号？登录'}
          </button>
        </form>

        <p className="text-center text-[12px] text-[var(--fg3)] mt-6">
          登录即代表同意 ArcDock 的服务条款。我们不收上架费，也不卖你的数据。
        </p>
      </div>
    </div>
  )
}
