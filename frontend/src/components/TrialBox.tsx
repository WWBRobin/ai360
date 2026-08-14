'use client'

import { useState } from 'react'
import { trialSkill } from '@/lib/supabase'

interface TrialBoxProps {
  skillId: number
  skillName: string
  /** 占位提示，告诉用户该 Skill 接收什么样的输入 */
  placeholder?: string
}

type Status = 'idle' | 'loading' | 'done' | 'error'

export default function TrialBox({
  skillId,
  skillName,
  placeholder = '输入测试文本，看看效果…',
}: TrialBoxProps) {
  const [input, setInput] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [output, setOutput] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [remaining, setRemaining] = useState<number | null>(null)
  const [tokensUsed, setTokensUsed] = useState<number | null>(null)

  async function handleTry() {
    const text = input.trim()
    if (!text || status === 'loading') return

    setStatus('loading')
    setOutput(null)
    setError(null)

    const res = await trialSkill(skillId, text)

    setRemaining(typeof res.remaining_quota === 'number' ? res.remaining_quota : null)
    setTokensUsed(typeof res.tokens_used === 'number' ? res.tokens_used : null)

    if (res.success && res.output) {
      setOutput(res.output)
      setStatus('done')
    } else {
      setError(res.error || '试用失败，请稍后再试')
      setStatus('error')
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Cmd/Ctrl + Enter 快捷试用
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleTry()
    }
  }

  return (
    <div className="content-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">🧪</span>
        <h3 className="font-bold text-[#2a2724]">在线试用 {skillName}</h3>
        {remaining !== null && (
          <span className="ml-auto text-xs text-[#1c1a18] bg-[rgba(28, 26, 24,0.06)] px-2 py-0.5 rounded-full border border-[rgba(28, 26, 24,0.20)]">
            剩余 {remaining} 次
          </span>
        )}
      </div>

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={4}
        disabled={status === 'loading'}
        className="w-full px-4 py-3 text-sm bg-white border border-[#e3e0dd] rounded-xl resize-none focus:outline-none focus:border-[#1c1a18] focus:ring-2 focus:ring-[rgba(28, 26, 24,0.12)] transition disabled:opacity-60"
      />

      <div className="flex items-center justify-between mt-3">
        <span className="text-xs text-[#a1a1a1]">
          ⌘/Ctrl + Enter 快捷发送
        </span>
        <button
          onClick={handleTry}
          disabled={status === 'loading' || !input.trim()}
          className="btn-primary px-5 py-2 text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === 'loading' ? (
            <>
              <span className="inline-block w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              运行中…
            </>
          ) : (
            <>▶ 免费试用</>
          )}
        </button>
      </div>

      {/* 输出区 */}
      {output && (
        <div className="mt-4 bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <span className="text-xs font-medium text-gray-500">运行结果</span>
            {tokensUsed !== null && (
              <span className="text-xs text-gray-400">消耗 {tokensUsed} tokens</span>
            )}
          </div>
          <pre className="px-4 py-3 text-sm text-gray-700 whitespace-pre-wrap break-words font-sans max-h-80 overflow-y-auto">
            {output}
          </pre>
        </div>
      )}

      {error && (
        <div className="mt-4 flex items-start gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
          <span className="text-sm">⚠️</span>
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  )
}
