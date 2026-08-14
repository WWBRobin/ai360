'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

type Status = 'idle' | 'loading' | 'done' | 'error'

interface SubscribeFormProps {
  /** 是否带卡片背景（首页 CTA 内嵌时传 false） */
  withCard?: boolean
  /** 输入框占位文案 */
  placeholder?: string
  /** 提交按钮文字 */
  buttonText?: string
}

export default function SubscribeForm({
  withCard = true,
  placeholder = '输入你的邮箱地址',
  buttonText = '订阅周报',
}: SubscribeFormProps) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)

  function validateEmail(value: string): boolean {
    // 基础格式校验（不做严格的反查/双重确认）
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const value = email.trim()
    if (!value || status === 'loading') return

    if (!validateEmail(value)) {
      setError('请输入有效的邮箱地址')
      setStatus('error')
      return
    }

    setStatus('loading')
    setError(null)

    // 简单收集：直接写入 subscribers 表（不做双重确认）
    const { error: insertError } = await supabase
      .from('subscribers')
      .upsert({ email: value }, { onConflict: 'email' })

    if (insertError) {
      // RLS 或表未建时给出友好提示
      setError('订阅暂时不可用，请稍后再试')
      setStatus('error')
      return
    }

    setStatus('done')
  }

  // 成功态：显示固定成功文案
  if (status === 'done') {
    return (
      <div className={withCard ? 'bg-[var(--card)] rounded-2xl border border-gray-200 p-8 text-center' : 'text-center'}>
        <div className="text-5xl mb-4">🎉</div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">订阅成功！下周一见</h3>
        <p className="text-sm text-gray-500">
          我们会在每周一给你发送最新的 Skill 评测 + 行业动态。
        </p>
        <button
          onClick={() => {
            setStatus('idle')
            setEmail('')
          }}
          className="mt-4 text-sm text-indigo-600 hover:underline"
        >
          再订阅一个邮箱
        </button>
      </div>
    )
  }

  const form = (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (status === 'error') setStatus('idle')
          }}
          placeholder={placeholder}
          disabled={status === 'loading'}
          aria-label="邮箱地址"
          className="flex-1 px-4 py-3 text-base bg-[var(--card)] border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={status === 'loading' || !email.trim()}
          className="px-6 py-3 text-base font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex items-center justify-center gap-2"
        >
          {status === 'loading' ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              订阅中…
            </>
          ) : (
            <>✉️ {buttonText}</>
          )}
        </button>
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-500">{error}</p>
      )}

      <p className="mt-3 text-xs text-gray-400">
        🔒 只用于发送周报，绝不分享给第三方。随时可退订。
      </p>
    </form>
  )

  if (!withCard) return form

  return (
    <div className="bg-[var(--card)] rounded-2xl border border-gray-200 p-8 shadow-sm">
      {form}
    </div>
  )
}
