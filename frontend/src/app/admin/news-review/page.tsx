'use client'

/**
 * 新闻审核工作台（待办 #23B MVP）
 *
 * 队列 Tab：待人工审核 / 需介入 / 已发布 / 已搁置
 * 详情：3 个 L 版本（beginner/intermediate/advanced）Tab 切换 + 最新 AI-B 审核报告 + 修改历史
 * 操作：通过（→published）/ 打回（填修改意见 →ai_revising）/ 丢弃（→shelved）+ 批量通过
 *
 * 数据走本目录 api/ 路由（service_role），样式沿用 ArcDock CSS 变量。
 */

import { useCallback, useEffect, useMemo, useState } from 'react'

// ===== 类型 =====

type QueueItem = {
  id: number
  title: string
  slug: string | null
  category: string | null
  source_url: string | null
  status: string
  revision_count: number | null
  ai_confidence_score: number | null
  discovered_at: string | null
  published_at: string | null
}

type ContentVersion = {
  id: number
  content_id: number
  version_type: string
  target_levels: string[]
  title: string
  content: string
  version_number: number
  meta_title: string | null
  meta_description: string | null
  keywords: string[] | null
  created_at: string
}

type ReviewRecord = {
  id: number
  content_id: number
  reviewer: string
  action: string
  revision_round: number | null
  review_report: Record<string, unknown> | null
  dimension_scores: Record<string, number> | null
  overall_score: number | null
  passed: boolean | null
  human_reviewer: string | null
  created_at: string
}

type Issue = {
  issue_type: string
  description: string
  severity: 'low' | 'medium' | 'high'
}

const QUEUES: { key: string; label: string }[] = [
  { key: 'human_reviewing', label: '待人工审核' },
  { key: 'needs_human_intervention', label: '需介入' },
  { key: 'published', label: '已发布' },
  { key: 'shelved', label: '已搁置' },
]

const STATUS_LABEL: Record<string, string> = {
  discovered: '已发现',
  ai_producing: 'AI 生成中',
  ai_reviewing: 'AI 审核中',
  ai_revising: 'AI 修改中',
  human_reviewing: '待人工审核',
  pre_publish_qa: '发布前 QA',
  scheduled: '已排期',
  published: '已发布',
  needs_human_intervention: '需人工介入',
  shelved: '已搁置',
}

const LEVEL_LABEL: Record<string, string> = {
  beginner: '入门 L1',
  intermediate: '进阶 L2',
  advanced: '深度 L3',
}

// AI 置信度颜色分级：🟢≥8 🟡6-8 🔴<6
function scoreDot(score: number | null): string {
  if (score == null) return '⚪'
  if (score >= 8) return '🟢'
  if (score >= 6) return '🟡'
  return '🔴'
}

function scoreColor(score: number | null): string {
  if (score == null) return 'var(--fg3)'
  if (score >= 8) return 'var(--green)'
  if (score >= 6) return '#d97706'
  return '#dc2626'
}

function hostOf(url: string | null): string {
  if (!url) return '—'
  try {
    return new URL(url).hostname
  } catch {
    return url.slice(0, 30)
  }
}

// ===== 页面 =====

export default function NewsReviewPage() {
  const [queues, setQueues] = useState<Record<string, QueueItem[]>>({})
  const [activeTab, setActiveTab] = useState('human_reviewing')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  // 详情状态
  const [detailId, setDetailId] = useState<number | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [versions, setVersions] = useState<ContentVersion[]>([])
  const [reviews, setReviews] = useState<ReviewRecord[]>([])
  const [levelTab, setLevelTab] = useState<string>('beginner')

  // 操作状态
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [acting, setActing] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectIssues, setRejectIssues] = useState<Issue[]>([
    { issue_type: '', description: '', severity: 'medium' },
  ])
  const [discardId, setDiscardId] = useState<number | null>(null)

  const loadQueues = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/admin/news-review/api/queue')
      const json = await res.json()
      if (!json.ok) throw new Error(json.error || '加载失败')
      setQueues(json.queues)
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadQueues()
  }, [loadQueues])

  // toast 自动消失
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(t)
  }, [toast])

  const loadDetail = useCallback(async (id: number) => {
    setDetailId(id)
    setDetailLoading(true)
    setLevelTab('beginner')
    try {
      const res = await fetch(`/admin/news-review/api/queue?ids=${id}`)
      const json = await res.json()
      if (!json.ok) throw new Error(json.error || '详情加载失败')
      setVersions(json.versions || [])
      setReviews(json.reviews || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : '详情加载失败')
    } finally {
      setDetailLoading(false)
    }
  }, [])

  const doAction = useCallback(
    async (action: 'approve' | 'reject' | 'discard', ids: number[], issues?: Issue[]) => {
      setActing(true)
      setError(null)
      try {
        const res = await fetch('/admin/news-review/api/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, ids, issues }),
        })
        const json = await res.json()
        if (!json.ok) throw new Error(json.error || '操作失败')
        setToast(
          action === 'approve'
            ? `已通过 ${ids.length} 条 → published`
            : action === 'reject'
              ? `已打回 ${ids.length} 条 → ai_revising`
              : `已丢弃 ${ids.length} 条 → shelved`,
        )
        setSelected(new Set())
        setRejectOpen(false)
        setDiscardId(null)
        if (detailId && ids.includes(detailId)) setDetailId(null)
        setRejectIssues([{ issue_type: '', description: '', severity: 'medium' }])
        await loadQueues()
      } catch (e) {
        setError(e instanceof Error ? e.message : '操作失败')
      } finally {
        setActing(false)
      }
    },
    [detailId, loadQueues],
  )

  const list = useMemo(() => queues[activeTab] || [], [queues, activeTab])
  const detailItem = useMemo(
    () => (detailId == null ? null : (list.find((i) => i.id === detailId) ?? null)),
    [detailId, list],
  )

  // 详情数据：最新一版各 level 的 version（version_number 最大）
  const latestByLevel = useMemo(() => {
    const map: Record<string, ContentVersion> = {}
    for (const v of versions) {
      for (const lv of v.target_levels || []) {
        if (!map[lv] || v.version_number > map[lv].version_number) map[lv] = v
      }
    }
    return map
  }, [versions])

  const activeVersion = latestByLevel[levelTab]

  // 最新 AI-B 审核报告（reviewer='ai' 的最新一条）
  const latestAiReview = useMemo(
    () => reviews.find((r) => r.reviewer === 'ai') || null,
    [reviews],
  )

  // 修改历史：打回/修改相关记录
  const history = useMemo(
    () => reviews.filter((r) => ['reject', 'discard', 'approve'].includes(r.action)),
    [reviews],
  )

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const allSelected = list.length > 0 && list.every((i) => selected.has(i.id))

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* 头部 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--fg)' }}>
          新闻审核工作台
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--fg3)' }}>
          管线产出内容的人工审核：通过 / 打回 / 丢弃 · MVP（无认证，靠路由隐藏）
        </p>
      </div>

      {/* toast / error */}
      {toast && (
        <div
          className="mb-4 px-4 py-2 rounded-lg text-sm"
          style={{ background: 'var(--green-bg)', color: 'var(--green)' }}
        >
          {toast}
        </div>
      )}
      {error && (
        <div
          className="mb-4 px-4 py-2 rounded-lg text-sm"
          style={{ background: 'rgba(220,38,38,0.08)', color: '#dc2626' }}
        >
          {error}
        </div>
      )}

      {/* 队列 Tab */}
      <div className="flex gap-6 border-b mb-4" style={{ borderColor: 'var(--border)' }}>
        {QUEUES.map((q) => (
          <button
            key={q.key}
            onClick={() => {
              setActiveTab(q.key)
              setSelected(new Set())
              setDetailId(null)
            }}
            className={`pb-2 text-sm ${activeTab === q.key ? 'tab-active' : 'tab-inactive'}`}
          >
            {q.label}
            <span className="ml-1.5" style={{ color: 'var(--fg3)' }}>
              {(queues[q.key] || []).length}
            </span>
          </button>
        ))}
      </div>

      {/* 批量操作条 */}
      {activeTab === 'human_reviewing' && list.length > 0 && (
        <div
          className="flex items-center gap-3 mb-4 px-4 py-2 rounded-lg text-sm"
          style={{ background: 'var(--bg2)', color: 'var(--fg2)' }}
        >
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={() =>
                setSelected(allSelected ? new Set() : new Set(list.map((i) => i.id)))
              }
            />
            全选
          </label>
          <span>已选 {selected.size} 条</span>
          <button
            className="btn-primary text-xs"
            style={{ padding: '5px 14px' }}
            disabled={selected.size === 0 || acting}
            onClick={() => doAction('approve', Array.from(selected))}
          >
            批量通过
          </button>
        </div>
      )}

      {/* 列表 */}
      <div className="content-card p-0 overflow-hidden">
        {loading ? (
          <div className="px-4 py-10 text-center text-sm" style={{ color: 'var(--fg3)' }}>
            加载中…
          </div>
        ) : list.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm" style={{ color: 'var(--fg3)' }}>
            该队列暂无内容
          </div>
        ) : (
          <table className="w-full text-sm" data-testid="review-queue-table">
            <thead style={{ color: 'var(--fg3)', fontSize: 12 }}>
              <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                {activeTab === 'human_reviewing' && (
                  <th className="text-left px-4 py-3 font-medium w-8" />
                )}
                <th className="text-left px-4 py-3 font-medium">标题</th>
                <th className="text-left px-4 py-3 font-medium">来源</th>
                <th className="text-left px-4 py-3 font-medium">状态</th>
                <th className="text-left px-4 py-3 font-medium">AI 置信度</th>
                <th className="text-left px-4 py-3 font-medium">修改轮次</th>
                <th className="text-right px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {list.map((item) => (
                <tr
                  key={item.id}
                  className="border-b hover:bg-[var(--bg2)] transition"
                  style={{ borderColor: 'var(--border)' }}
                >
                  {activeTab === 'human_reviewing' && (
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(item.id)}
                        onChange={() => toggleSelect(item.id)}
                      />
                    </td>
                  )}
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--fg)' }}>
                    <button className="hover:underline" onClick={() => loadDetail(item.id)}>
                      {item.title}
                    </button>
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--fg2)' }}>
                    {hostOf(item.source_url)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="tag" style={{ background: 'var(--bg2)', color: 'var(--fg2)' }}>
                      {STATUS_LABEL[item.status] || item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--fg2)' }}>
                    {scoreDot(item.ai_confidence_score)}{' '}
                    <span style={{ color: scoreColor(item.ai_confidence_score), fontWeight: 600 }}>
                      {item.ai_confidence_score != null ? Number(item.ai_confidence_score) : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--fg2)' }}>
                    {item.revision_count ?? 0}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {(item.status === 'human_reviewing' ||
                      item.status === 'needs_human_intervention') && (
                      <>
                        <button
                          className="text-xs mr-3 hover:underline"
                          style={{ color: 'var(--green)' }}
                          disabled={acting}
                          onClick={() => doAction('approve', [item.id])}
                        >
                          通过
                        </button>
                        <button
                          className="text-xs mr-3 hover:underline"
                          style={{ color: '#d97706' }}
                          disabled={acting}
                          onClick={() => {
                            setDetailId(item.id)
                            setRejectOpen(true)
                          }}
                        >
                          打回
                        </button>
                        <button
                          className="text-xs hover:underline"
                          style={{ color: '#dc2626' }}
                          disabled={acting}
                          onClick={() => setDiscardId(item.id)}
                        >
                          丢弃
                        </button>
                      </>
                    )}
                    {item.status === 'published' && (
                      <span className="text-xs" style={{ color: 'var(--fg3)' }}>
                        {item.published_at
                          ? new Date(item.published_at).toLocaleDateString('zh-CN')
                          : ''}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ===== 详情弹层 ===== */}
      {detailId != null && !rejectOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center p-6 overflow-y-auto"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setDetailId(null)}
        >
          <div
            className="content-card w-full max-w-4xl my-8"
            style={{ background: 'var(--card)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-start justify-between border-b pb-3 mb-4"
              style={{ borderColor: 'var(--border)' }}
            >
              <div>
                <h2 className="text-lg font-bold" style={{ color: 'var(--fg)' }}>
                  {detailItem?.title || `#${detailId}`}
                </h2>
                {detailItem?.source_url && (
                  <a
                    href={detailItem.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs mt-1 inline-block"
                    style={{ color: 'var(--blue)' }}
                  >
                    {detailItem.source_url}
                  </a>
                )}
              </div>
              <button
                className="text-sm"
                style={{ color: 'var(--fg3)' }}
                onClick={() => setDetailId(null)}
              >
                ✕
              </button>
            </div>

            {detailLoading ? (
              <div className="py-10 text-center text-sm" style={{ color: 'var(--fg3)' }}>
                加载详情…
              </div>
            ) : (
              <div className="space-y-6">
                {/* L 版本 Tab */}
                <section>
                  <div
                    className="flex gap-5 border-b mb-3"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    {Object.keys(LEVEL_LABEL).map((lv) => (
                      <button
                        key={lv}
                        onClick={() => setLevelTab(lv)}
                        className={`pb-1.5 text-sm ${
                          levelTab === lv ? 'tab-active' : 'tab-inactive'
                        }`}
                      >
                        {LEVEL_LABEL[lv]}
                        {latestByLevel[lv] ? '' : '（无）'}
                      </button>
                    ))}
                  </div>
                  {activeVersion ? (
                    <div>
                      <div className="text-xs mb-2" style={{ color: 'var(--fg3)' }}>
                        v{activeVersion.version_number} · {activeVersion.title}
                      </div>
                      <pre
                        className="text-sm whitespace-pre-wrap max-h-80 overflow-y-auto p-3 rounded-lg"
                        style={{
                          background: 'var(--bg2)',
                          color: 'var(--fg2)',
                          lineHeight: 1.7,
                        }}
                      >
                        {activeVersion.content}
                      </pre>
                    </div>
                  ) : (
                    <div className="text-sm py-4" style={{ color: 'var(--fg3)' }}>
                      该级别暂无版本内容
                    </div>
                  )}
                </section>

                {/* 最新 AI-B 审核报告 */}
                {latestAiReview && (
                  <section>
                    <h3
                      className="text-sm font-semibold mb-3"
                      style={{ color: 'var(--fg)' }}
                    >
                      最新 AI 审核报告（综合{' '}
                      <span style={{ color: scoreColor(Number(latestAiReview.overall_score)) }}>
                        {latestAiReview.overall_score ?? '—'}
                      </span>
                      ）
                    </h3>
                    {latestAiReview.dimension_scores &&
                    Object.keys(latestAiReview.dimension_scores).length > 0 ? (
                      <div className="space-y-2">
                        {Object.entries(latestAiReview.dimension_scores).map(([dim, score]) => {
                          const pct = Math.min(100, (Number(score) / 10) * 100)
                          return (
                            <div key={dim} className="flex items-center gap-3 text-xs">
                              <span className="w-28 shrink-0" style={{ color: 'var(--fg2)' }}>
                                {dim}
                              </span>
                              <div
                                className="flex-1 h-2 rounded-full overflow-hidden"
                                style={{ background: 'var(--bg2)' }}
                              >
                                <div className="score-bar h-full" style={{ width: `${pct}%` }} />
                              </div>
                              <span
                                className="w-8 text-right"
                                style={{ color: scoreColor(Number(score)), fontWeight: 600 }}
                              >
                                {Number(score).toFixed(1)}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <pre
                        className="text-xs whitespace-pre-wrap p-3 rounded-lg max-h-48 overflow-y-auto"
                        style={{ background: 'var(--bg2)', color: 'var(--fg2)' }}
                      >
                        {JSON.stringify(latestAiReview.review_report, null, 2)}
                      </pre>
                    )}
                  </section>
                )}

                {/* 修改历史 */}
                {history.length > 0 && (
                  <section>
                    <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--fg)' }}>
                      审核历史
                    </h3>
                    <div className="space-y-2">
                      {history.map((r) => (
                        <div
                          key={r.id}
                          className="flex items-center gap-3 text-xs px-3 py-2 rounded-lg"
                          style={{ background: 'var(--bg2)', color: 'var(--fg2)' }}
                        >
                          <span
                            style={{
                              color:
                                r.action === 'approve'
                                  ? 'var(--green)'
                                  : r.action === 'reject'
                                    ? '#d97706'
                                    : '#dc2626',
                              fontWeight: 600,
                            }}
                          >
                            {r.action === 'approve'
                              ? '通过'
                              : r.action === 'reject'
                                ? '打回'
                                : '丢弃'}
                          </span>
                          <span>轮次 {r.revision_round ?? '—'}</span>
                          <span>{r.human_reviewer || r.reviewer}</span>
                          <span className="ml-auto" style={{ color: 'var(--fg3)' }}>
                            {new Date(r.created_at).toLocaleString('zh-CN')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* 操作 */}
                {detailItem &&
                  (detailItem.status === 'human_reviewing' ||
                    detailItem.status === 'needs_human_intervention') && (
                    <div
                      className="flex gap-3 border-t pt-4"
                      style={{ borderColor: 'var(--border)' }}
                    >
                      <button
                        className="btn-primary"
                        disabled={acting}
                        onClick={() => doAction('approve', [detailItem.id])}
                        style={{ background: 'var(--green)' }}
                      >
                        通过并发布
                      </button>
                      <button
                        className="btn-outline"
                        disabled={acting}
                        onClick={() => setRejectOpen(true)}
                      >
                        打回修改
                      </button>
                      <button
                        className="btn-outline"
                        disabled={acting}
                        onClick={() => setDiscardId(detailItem.id)}
                        style={{ color: '#dc2626', borderColor: 'var(--border)' }}
                      >
                        丢弃
                      </button>
                    </div>
                  )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== 打回弹层 ===== */}
      {rejectOpen && detailId != null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setRejectOpen(false)}
        >
          <div
            className="content-card w-full max-w-lg"
            style={{ background: 'var(--card)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--fg)' }}>
              打回修改
            </h2>
            <p className="text-xs mb-4" style={{ color: 'var(--fg3)' }}>
              {detailItem?.title || `#${detailId}`} · 填写修改意见后回到 AI 修改阶段
            </p>
            <div className="space-y-3">
              {rejectIssues.map((issue, idx) => (
                <div
                  key={idx}
                  className="space-y-2 p-3 rounded-lg"
                  style={{ background: 'var(--bg2)' }}
                >
                  <div className="flex gap-2">
                    <input
                      className="flex-1 text-sm px-2 py-1.5 rounded-md"
                      style={{
                        background: 'var(--card)',
                        border: '1px solid var(--border)',
                        color: 'var(--fg)',
                      }}
                      placeholder="问题类型（如：事实错误 / 结构问题 / 链接失效）"
                      value={issue.issue_type}
                      onChange={(e) =>
                        setRejectIssues((prev) =>
                          prev.map((it, i) =>
                            i === idx ? { ...it, issue_type: e.target.value } : it,
                          ),
                        )
                      }
                    />
                    <select
                      className="text-sm px-2 py-1.5 rounded-md"
                      style={{
                        background: 'var(--card)',
                        border: '1px solid var(--border)',
                        color: 'var(--fg)',
                      }}
                      value={issue.severity}
                      onChange={(e) =>
                        setRejectIssues((prev) =>
                          prev.map((it, i) =>
                            i === idx
                              ? { ...it, severity: e.target.value as Issue['severity'] }
                              : it,
                          ),
                        )
                      }
                    >
                      <option value="low">轻微</option>
                      <option value="medium">中等</option>
                      <option value="high">严重</option>
                    </select>
                    {rejectIssues.length > 1 && (
                      <button
                        className="text-xs"
                        style={{ color: 'var(--fg3)' }}
                        onClick={() =>
                          setRejectIssues((prev) => prev.filter((_, i) => i !== idx))
                        }
                      >
                        删除
                      </button>
                    )}
                  </div>
                  <textarea
                    className="w-full text-sm px-2 py-1.5 rounded-md"
                    rows={2}
                    style={{
                      background: 'var(--card)',
                      border: '1px solid var(--border)',
                      color: 'var(--fg)',
                    }}
                    placeholder="问题描述与修改建议"
                    value={issue.description}
                    onChange={(e) =>
                      setRejectIssues((prev) =>
                        prev.map((it, i) => (i === idx ? { ...it, description: e.target.value } : it)),
                      )
                    }
                  />
                </div>
              ))}
              <button
                className="text-xs"
                style={{ color: 'var(--blue)' }}
                onClick={() =>
                  setRejectIssues((prev) => [
                    ...prev,
                    { issue_type: '', description: '', severity: 'medium' },
                  ])
                }
              >
                + 添加一条意见
              </button>
            </div>
            <div
              className="flex gap-3 justify-end border-t pt-4 mt-4"
              style={{ borderColor: 'var(--border)' }}
            >
              <button className="btn-outline" onClick={() => setRejectOpen(false)}>
                取消
              </button>
              <button
                className="btn-primary"
                disabled={acting}
                onClick={() =>
                  doAction('reject', [detailId], rejectIssues.filter((i) => i.issue_type && i.description))
                }
              >
                {acting ? '提交中…' : '确认打回'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== 丢弃确认 ===== */}
      {discardId != null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setDiscardId(null)}
        >
          <div
            className="content-card w-full max-w-sm"
            style={{ background: 'var(--card)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-base font-bold mb-2" style={{ color: 'var(--fg)' }}>
              确认丢弃？
            </h2>
            <p className="text-sm mb-4" style={{ color: 'var(--fg2)' }}>
              条目将进入「已搁置（shelved）」状态，可随时在搁置队列查看。
            </p>
            <div className="flex gap-3 justify-end">
              <button className="btn-outline" onClick={() => setDiscardId(null)}>
                取消
              </button>
              <button
                className="btn-primary"
                style={{ background: '#dc2626' }}
                disabled={acting}
                onClick={() => doAction('discard', [discardId])}
              >
                确认丢弃
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
