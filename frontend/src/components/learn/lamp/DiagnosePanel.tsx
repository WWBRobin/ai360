'use client'

import { useState } from 'react'

/**
 * 诊断面板（v3 满意度分叉）：
 * 「😕 结果不理想，帮我看看」→ 展开 → 贴结果（文本/图片URL）→ 调 /api/learn/diagnose
 * → 展示诊断（类型标签 + 结论 + 具体建议）。自动带出本步所选工具（诊断树第 0 步）。
 */

interface DiagResponse {
  diagnosis_type: 'tool_expectation' | 'operation' | 'flow' | 'expectation'
  message: string
  suggestion: string
  model?: string
  degraded?: boolean
}

const TYPE_LABEL: Record<DiagResponse['diagnosis_type'], { label: string; cls: string }> = {
  tool_expectation: { label: '工具/模型问题', cls: 't-tool' },
  operation: { label: '操作/提示词问题', cls: 't-op' },
  flow: { label: '流程/前提问题', cls: 't-flow' },
  expectation: { label: '期望管理', cls: 't-exp' },
}

export default function DiagnosePanel({
  lampSlug,
  toolName,
  open,
  onClose,
}: {
  lampSlug: string
  toolName: string | null
  open: boolean
  onClose: () => void
}) {
  const [text, setText] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<DiagResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  async function submit() {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/learn/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lamp_slug: lampSlug,
          tool_name: toolName || '',
          user_input: text,
          image_url: imageUrl.trim() || undefined,
        }),
      })
      const j = (await res.json()) as DiagResponse & { error?: string }
      if (!res.ok) {
        setError(j.error || `诊断失败（${res.status}）`)
      } else {
        setResult(j)
      }
    } catch {
      setError('网络异常，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const t = result ? TYPE_LABEL[result.diagnosis_type] : null

  return (
    <div className="diagnose-panel">
      <div className="dp-head">
        <span className="dp-title">🔍 诊断教练</span>
        <button type="button" className="dp-close" onClick={onClose} aria-label="收起诊断">
          ✕
        </button>
      </div>

      {toolName && (
        <div className="dp-context">
          本步你选的工具：<b>{toolName}</b>（诊断第 0 步会先对照矩阵水平）
        </div>
      )}

      <textarea
        className="dp-input"
        placeholder="把不满意的结果贴回来（文案全文 / 描述图哪里不对），越具体诊断越准…"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
      />
      <input
        className="dp-input dp-url"
        type="url"
        placeholder="图片 URL（可选，生成图诊断走视觉模型）"
        value={imageUrl}
        onChange={(e) => setImageUrl(e.target.value)}
      />

      <div className="dp-actions">
        <button
          type="button"
          className="dp-submit"
          disabled={loading || (!text.trim() && !imageUrl.trim())}
          onClick={submit}
        >
          {loading ? '诊断中…' : '帮我看看'}
        </button>
        <span className="dp-limit">每盏灯 5 次/天</span>
      </div>

      {error && <div className="dp-error">{error}</div>}

      {result && (
        <div className={`dp-result ${t?.cls || ''}`}>
          <div className="dp-type">
            <span className="dp-type-badge">{t?.label || result.diagnosis_type}</span>
            {result.degraded && <span className="dp-degraded">降级模式</span>}
            {result.model && <span className="dp-model">{result.model}</span>}
          </div>
          <p className="dp-message">{result.message}</p>
          <div className="dp-suggest">
            <span className="dp-suggest-label">下一步</span>
            <p>{result.suggestion}</p>
          </div>
        </div>
      )}
    </div>
  )
}
