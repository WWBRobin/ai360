'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase-browser'
import type { User } from '@supabase/supabase-js'

/**
 * 顶栏登录入口：未登录显示「登录」，已登录显示头像 + 下拉菜单。
 * 替换 layout.tsx 里的硬编码 "W" 占位头像。
 */
export default function AuthButton() {
  const router = useRouter()
  const supabase = createBrowserClient()

  const [user, setUser] = useState<User | null>(null)
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // 初始 session + 后续变化监听
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => sub.subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    setOpen(false)
    router.push('/')
    router.refresh()
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="h-9 px-4 rounded-md bg-[var(--primary)] text-[var(--on-primary)] text-[13px] font-medium flex items-center justify-center shrink-0 hover:opacity-90 transition"
      >
        登录
      </Link>
    )
  }

  const email = user.email || ''
  const initial = (user.user_metadata?.nickname || email.split('@')[0] || 'U')
    .charAt(0)
    .toUpperCase()

  return (
    <div className="relative shrink-0" ref={menuRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-9 h-9 rounded-full bg-[var(--primary)] flex items-center justify-center text-[var(--on-primary)] text-[15px] font-bold shrink-0 hover:opacity-90 transition"
        aria-label="用户菜单"
      >
        {initial}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-56 rounded-lg border border-[var(--border)] bg-[var(--card)] shadow-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--border)]">
            <div className="text-[13px] font-medium text-[var(--fg)] truncate">
              {user.user_metadata?.nickname || email.split('@')[0]}
            </div>
            <div className="text-[12px] text-[var(--fg3)] truncate">{email}</div>
          </div>
          <div className="py-1">
            <Link
              href="/learn"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-[13px] text-[var(--fg)] hover:bg-[var(--bg2)] transition"
            >
              我的学习
            </Link>
            <button
              onClick={handleSignOut}
              className="w-full text-left px-4 py-2 text-[13px] text-[var(--fg)] hover:bg-[var(--bg2)] transition"
            >
              退出登录
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
