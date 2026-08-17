'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

// ============================================================
// 共享数据
// ============================================================

const PLATFORMS_BASE = [
  { slug: 'hermes', name: 'Hermes', count: 20, logo: '/platform-logos/hermes.png' },
  { slug: 'gpts', name: 'GPTs', count: 86, logo: '/platform-logos/gpts.png' },
  { slug: 'coze', name: '扣子', count: 45, logo: '/platform-logos/coze.png' },
  { slug: 'saas', name: 'SaaS', count: 24, logo: '/platform-logos/saas.png' },
  { slug: 'mcp', name: 'MCP', count: 22, logo: '/platform-logos/mcp.png' },
  { slug: 'claude', name: 'Claude', count: 20, logo: '/platform-logos/claude.png' },
  { slug: 'openclaw', name: 'OpenClaw', count: 14, logo: '/platform-logos/openclaw.png' },
  { slug: 'codex', name: 'Codex', count: 8, logo: '/platform-logos/codex.png' },
  { slug: 'dify', name: 'Dify', count: 7, logo: '/platform-logos/dify.png' },
  { slug: 'n8n', name: 'n8n', count: 4, logo: '/platform-logos/n8n.png' },
  { slug: 'claude-code', name: 'Claude Code', count: 4, logo: '/platform-logos/claude-code.png' },
  { slug: 'qwen', name: '千问', count: 20, logo: '/platform-logos/qwen.png' },
  { slug: 'ernie', name: '文心', count: 13, logo: '/platform-logos/ernie.png' },
  { slug: 'workbuddy', name: 'WorkBuddy', count: 15, logo: '/platform-logos/workbuddy.png' },
]

/** 实时平台计数（DB platforms.skill_count，published 口径）。拉取失败时沿用静态值兜底。 */
let _cachedCounts: Record<string, number> | null = null

function usePlatformCounts() {
  const [counts, setCounts] = useState<Record<string, number>>(_cachedCounts || {})
  useEffect(() => {
    if (_cachedCounts) return
    let cancelled = false
    getSupabaseBrowserClient()
      .from('platforms')
      .select('slug, skill_count')
      .then(({ data }: { data: { slug: string; skill_count: number }[] | null }) => {
        if (cancelled || !data) return
        const m: Record<string, number> = {}
        for (const row of data) if (row.skill_count != null) m[row.slug] = row.skill_count
        _cachedCounts = m
        setCounts(m)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])
  return counts
}

/** 组件内取平台列表：实时计数 merge 静态兜底（logo/name 来自静态配置） */
function usePlatforms() {
  const counts = usePlatformCounts()
  return PLATFORMS_BASE.map((p) => ({ ...p, count: counts[p.slug] ?? p.count }))
}

// ============================================================
// 小工具：路由判定
// ============================================================

type SidebarVariant =
  | 'home'
  | 'essential'
  | 'guide'
  | 'scenario'
  | 'platform'
  | 'search'
  | 'compare'
  | 'skill'
  | 'learn'
  | 'default'

function getVariant(pathname: string): SidebarVariant {
  if (pathname === '/') return 'home'
  if (pathname.startsWith('/essential')) return 'essential'
  if (pathname.startsWith('/guide')) return 'guide'
  if (pathname.startsWith('/scenario')) return 'scenario'
  if (pathname.startsWith('/platform')) return 'platform'
  if (pathname.startsWith('/search')) return 'search'
  if (pathname.startsWith('/compare')) return 'compare'
  if (pathname.startsWith('/skill')) return 'skill'
  if (pathname.startsWith('/learn')) return 'learn'
  return 'default'
}

// ============================================================
// 通用 UI 原子
// ============================================================

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3 mb-2">
      <span
        className="text-xs font-semibold text-[var(--fg3)] uppercase tracking-wider"
        style={{ letterSpacing: '0.05em' }}
      >
        {children}
      </span>
    </div>
  )
}

/** 可点击的链接行（极简线条，透明背景，hover var(--primary)） */
function NavLink({
  href,
  label,
  count,
  active,
  onHover,
}: {
  href: string
  label: string
  count?: number
  active?: boolean
  onHover?: () => void
}) {
  return (
    <Link
      href={href}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'rgba(var(--dim-rgb),0.06)'
          e.currentTarget.style.color = 'var(--primary)'
        }
        onHover?.()
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.color = 'var(--fg)'
        }
      }}
      className="flex items-center px-3 py-2 rounded-md text-[14px] transition"
      style={{ fontWeight: active ? 600 : 500, color: active ? 'var(--primary)' : 'var(--fg2)', background: active ? 'rgba(var(--dim-rgb),0.08)' : 'transparent' }}
    >
      <span className="flex-1">{label}</span>
      {count !== undefined && (
        <span className="text-xs tabular-nums" style={{ color: active ? 'var(--primary)' : 'var(--fg3)' }}>
          {count}
        </span>
      )}
    </Link>
  )
}

/** 可选筛选行（checkbox 风格，用于 search 等多选场景） */
function CheckRow({
  label,
  count,
  checked,
  onToggle,
}: {
  label: string
  count?: number
  checked: boolean
  onToggle: () => void
}) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[6px] transition-all duration-150"
      style={{
        background: checked ? 'rgba(var(--dim-rgb),0.12)' : 'transparent',
        color: checked ? 'var(--primary)' : 'var(--fg)',
        fontWeight: checked ? 600 : 500,
      }}
      onMouseEnter={(e) => {
        if (!checked) e.currentTarget.style.background = 'rgba(var(--dim-rgb),0.06)'
      }}
      onMouseLeave={(e) => {
        if (!checked) e.currentTarget.style.background = 'transparent'
      }}
    >
      <span
        className="w-3.5 h-3.5 rounded-[3px] flex items-center justify-center text-[9px]"
        style={{
          border: checked ? '1px solid var(--primary)' : '1px solid var(--fg4)',
          background: checked ? 'var(--primary)' : 'transparent',
          color: '#fff',
        }}
      >
        {checked ? '✓' : ''}
      </span>
      <span className="flex-1 text-left text-[14px]">{label}</span>
      {count !== undefined && (
        <span className="text-[12px]" style={{ color: checked ? 'var(--primary)' : 'var(--fg3)' }}>
          {count}
        </span>
      )}
    </button>
  )
}

/** 搜索框 */
function SearchBox() {
  return (
    <div className="search-input flex items-center gap-2 px-3 py-2 mb-5">
      <span className="text-[var(--fg4)] text-sm">⌕</span>
      <input
        type="text"
        placeholder="搜索..."
        className="flex-1 bg-transparent border-none outline-none text-[13px] text-[var(--fg)] placeholder:text-[var(--fg4)]"
      />
    </div>
  )
}

// ============================================================
// Variant 1: 首页 — 平台筛选 + LEARN（保持原样）
// ============================================================

export const PLATFORM_FILTER_KEY = 'arcdock-platform-filter'

function HomeSidebar() {
  const [selected, setSelected] = useState<string[]>([])
  const PLATFORMS = usePlatforms()
  const [showAll, setShowAll] = useState(false)

  // 恢复上次选择（客户端）
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(PLATFORM_FILTER_KEY) || '[]')
      if (Array.isArray(saved)) setSelected(saved)
    } catch {}
  }, [])

  const [limitTip, setLimitTip] = useState(false)
  const togglePlatform = (slug: string) => {
    setSelected((prev) => {
      let next: string[]
      if (prev.includes(slug)) {
        next = prev.filter((s) => s !== slug)
        setLimitTip(false)
      } else if (prev.length >= 5) {
        // 满了不挤掉，提示用户先取消
        setLimitTip(true)
        setTimeout(() => setLimitTip(false), 2500)
        return prev
      } else {
        next = [...prev, slug]
        setLimitTip(false)
      }
      try { localStorage.setItem(PLATFORM_FILTER_KEY, JSON.stringify(next)) } catch {}
      window.dispatchEvent(new CustomEvent('arcdock-platform-change', { detail: next }))
      return next
    })
  }

  const clearSelection = () => {
    setSelected([])
    setLimitTip(false)
    try { localStorage.setItem(PLATFORM_FILTER_KEY, '[]') } catch {}
    window.dispatchEvent(new CustomEvent('arcdock-platform-change', { detail: [] }))
  }

  const sorted = [
    ...PLATFORMS.filter((p) => selected.includes(p.slug)),
    ...PLATFORMS.filter((p) => !selected.includes(p.slug)),
  ]
  const visible = showAll ? sorted : sorted.slice(0, 5)

  return (
    <>
      <div className="mb-1 pt-4">
        <div className="flex items-center justify-between mb-2 px-3">
          <span
            className="text-xs font-semibold text-[var(--fg3)] uppercase tracking-wider"
            style={{ letterSpacing: '0.05em' }}
          >
            平台
          </span>
          <div className="flex items-center gap-2">
            {selected.length > 0 ? (
              <button
                onClick={clearSelection}
                className="text-[10px] text-[var(--primary)] hover:underline transition"
              >
                清除（{selected.length}）
              </button>
            ) : (
              <span className="text-[10px] text-[var(--fg4)]">多选≤5</span>
            )}
          </div>
        </div>
      </div>

      {limitTip && (
        <div className="mx-3 mb-2 px-2.5 py-1.5 rounded-md text-[11px]" style={{ background: 'rgba(var(--dim-rgb),0.10)', color: 'var(--primary)' }}>
          最多选 5 个平台，先取消一个再选
        </div>
      )}

      <div>
        {visible.map((p) => {
          const isSelected = selected.includes(p.slug)
          return (
            <button
              key={p.slug}
              onClick={() => togglePlatform(p.slug)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md transition-all duration-150 relative"
              style={{ background: isSelected ? 'rgba(var(--dim-rgb),0.12)' : 'transparent' }}
              onMouseEnter={(e) => {
                if (!isSelected) e.currentTarget.style.background = 'rgba(var(--dim-rgb),0.06)'
              }}
              onMouseLeave={(e) => {
                if (!isSelected) e.currentTarget.style.background = 'transparent'
              }}
            >
              <span
                className="w-4 h-4 rounded-full flex items-center justify-center overflow-hidden shrink-0"
              >
                {p.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.logo} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[10px] font-bold text-[var(--fg3)]" style={{ border: '1px solid var(--border)', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
                    {p.name[0]}
                  </span>
                )}
              </span>
              <span
                className="flex-1 text-left text-[14px]"
                style={{
                  fontWeight: isSelected ? 600 : 500,
                  color: isSelected ? 'var(--primary)' : 'var(--fg)',
                }}
              >
                {p.name}
              </span>
              <span className="text-xs tabular-nums" style={{ color: isSelected ? 'var(--primary)' : 'var(--fg3)' }}>
                {p.count}
              </span>
            </button>
          )
        })}
      </div>

      <div className="mt-2">
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full text-center py-1.5 rounded-md text-[12px] transition"
          style={{ border: '1px dashed var(--border)', color: 'var(--fg2)', background: 'transparent' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--primary)'
            e.currentTarget.style.color = 'var(--primary)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border)'
            e.currentTarget.style.color = 'var(--fg2)'
          }}
        >
          {showAll ? '收起' : `全部平台 (${PLATFORMS.length}个) →`}
        </button>
      </div>

      <div className="mt-5">
        <SectionLabel>学习成长</SectionLabel>
        <div>
          <NavLink href="/learn" label="🎓 学习中心" />
        </div>
      </div>

      <div className="mt-5">
        <NavLink href="/compare" label="工具对比" />
      </div>
    </>
  )
}

// ============================================================
// Variant 2: 装机必备 — 工具分类 + 难度
// ============================================================

const ESSENTIAL_CATEGORIES = [
  { slug: 'office', name: '办公效率', icon: '📊' },
  { slug: 'writing', name: '写作创作', icon: '✍️' },
  { slug: 'design', name: '设计媒体', icon: '🎨' },
  { slug: 'code', name: '编程开发', icon: '💻' },
  { slug: 'data', name: '数据分析', icon: '📈' },
  { slug: 'research', name: '研究学习', icon: '📚' },
  { slug: 'automation', name: '自动化', icon: '⚙️' },
  { slug: 'ai-boost', name: 'AI增强', icon: '🚀' },
]

const DIFFICULTY_LEVELS = [
  { slug: 'L1', name: '一看就会', desc: '零基础' },
  { slug: 'L2', name: '简单配置', desc: '填参数即可' },
  { slug: 'L3', name: '理解工作流', desc: '要有概念' },
  { slug: 'L4', name: '需要技术基础', desc: '懂 API 更佳' },
  { slug: 'L5', name: '需要开发能力', desc: '面向开发者' },
]

function EssentialSidebar() {
  const [active, setActive] = useState<string>('office')
  // 向导态（已选 Agent 进入清单）：隐藏分类/难度筛选，避免干扰主流程
  // InstallWizard 会在选中 Agent 后给 body 加 arcdock-wizard-active
  const [wizardActive, setWizardActive] = useState(false)
  useEffect(() => {
    const update = () => setWizardActive(document.body.classList.contains('arcdock-wizard-active'))
    update()
    const mo = new MutationObserver(update)
    mo.observe(document.body, { attributes: true, attributeFilter: ['class'] })
    return () => mo.disconnect()
  }, [])

  if (wizardActive) {
    return (
      <div className="px-3 pt-4">
        <div
          className="p-3 rounded-lg text-[12px] leading-relaxed text-[var(--fg3)]"
          style={{ background: 'rgba(var(--dim-rgb),0.05)' }}
        >
          🧭 正在装机向导中 · 分类筛选已隐藏，点清单顶部「换个 Agent」可返回选择
        </div>
      </div>
    )
  }

  return (
    <>
      <SearchBox />

      <div className="mb-1">
        <SectionLabel>工具分类</SectionLabel>
        <div>
          {ESSENTIAL_CATEGORIES.map((c) => (
            <button
              key={c.slug}
              
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md transition-all duration-150"
              style={{ background: active === c.slug ? 'rgba(var(--dim-rgb),0.12)' : 'transparent' }}
              onMouseEnter={(e) => {
                if (active !== c.slug) e.currentTarget.style.background = 'rgba(var(--dim-rgb),0.06)'
              }}
              onMouseLeave={(e) => {
                if (active !== c.slug) e.currentTarget.style.background = 'transparent'
              }}
            >
              <span className="text-[16px]">{c.icon}</span>
              <span
                className="flex-1 text-left text-[14px]"
                style={{
                  fontWeight: active === c.slug ? 600 : 500,
                  color: active === c.slug ? 'var(--primary)' : 'var(--fg)',
                }}
              >
                {c.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <SectionLabel>难度</SectionLabel>
        <div>
          {DIFFICULTY_LEVELS.map((d) => (
            <button
              key={d.slug}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[6px] transition"
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(var(--dim-rgb),0.06)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <span className="flex-1 text-left text-[14px] font-medium text-[var(--fg)]">
                {d.name}
              </span>
              <span className="text-[11px] text-[var(--fg3)]">{d.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <Link
          href="/guide/install-guide"
          className="flex items-center justify-center gap-1.5 py-2.5 rounded-md text-[13px] font-semibold transition"
          style={{ border: '1px solid var(--primary)', color: 'var(--primary)', background: 'transparent' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--primary)'
            e.currentTarget.style.color = '#fff'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--primary)'
          }}
        >
          📖 装机完整指南
        </Link>
      </div>
    </>
  )
}

// ============================================================
// Variant 3: 评测页 — 评测分类 + 最新文章
// ============================================================

const GUIDE_CATEGORIES = [
  { slug: 'ai-image', name: 'AI 图像生成', icon: '🎨' },
  { slug: 'ai-writing', name: 'AI 写作工具', icon: '✍️' },
  { slug: 'ai-coding', name: 'AI 编程助手', icon: '💻' },
  { slug: 'ai-office', name: 'AI 办公工具', icon: '📊' },
  { slug: 'ai-data', name: 'AI 数据分析', icon: '📈' },
  { slug: 'comprehensive', name: '综合对比', icon: '🆚' },
]

const LATEST_ARTICLES = [
  { slug: 'install-guide', title: '装机必备完整指南', icon: '📖' },
  { slug: 'memory-comparison', title: '4 款记忆方案横评', icon: '🧠' },
  { slug: 'search-comparison', title: '3 款搜索方案对比', icon: '🔍' },
  { slug: 'ecommerce-copy', title: '电商文案 Skill 实测', icon: '✍️' },
  { slug: 'top-10-ai-tools-2026', title: '2026 十大 AI 工具', icon: '🏆' },
]

function GuideSidebar() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const active = searchParams.get('cat') || ''

  const selectCat = (slug: string) => {
    const next = active === slug ? '' : slug
    const qs = next ? `?cat=${next}` : ''
    router.replace(qs ? `${pathname}${qs}` : pathname, { scroll: false })
  }

  return (
    <>
      <SearchBox />

      <div className="mb-1">
        <SectionLabel>评测分类</SectionLabel>
        <div>
          {GUIDE_CATEGORIES.map((c) => (
            <button
              key={c.slug}
              onClick={() => selectCat(c.slug)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md transition-all duration-150"
              style={{ background: active === c.slug ? 'rgba(var(--dim-rgb),0.12)' : 'transparent' }}
              onMouseEnter={(e) => {
                if (active !== c.slug) e.currentTarget.style.background = 'rgba(var(--dim-rgb),0.06)'
              }}
              onMouseLeave={(e) => {
                if (active !== c.slug) e.currentTarget.style.background = 'transparent'
              }}
            >
              <span className="text-[16px]">{c.icon}</span>
              <span
                className="flex-1 text-left text-[14px]"
                style={{
                  fontWeight: active === c.slug ? 600 : 500,
                  color: active === c.slug ? 'var(--primary)' : 'var(--fg)',
                }}
              >
                {c.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <SectionLabel>最新文章</SectionLabel>
        <div>
          {LATEST_ARTICLES.map((a) => (
            <Link
              key={a.slug}
              href={`/guide/${a.slug}`}
              className="flex items-center gap-2.5 px-3 py-2 rounded-[6px] transition"
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(var(--dim-rgb),0.06)'
                e.currentTarget.style.color = 'var(--primary)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = 'var(--fg)'
              }}
            >
              <span className="text-[15px]">{a.icon}</span>
              <span className="flex-1 text-[13px] font-medium leading-snug">{a.title}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <Link
          href="/"
          className="block text-center py-2 rounded-md text-[12px] transition"
          style={{ border: '1px dashed var(--border)', color: 'var(--fg2)', background: 'transparent' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--primary)'
            e.currentTarget.style.color = 'var(--primary)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border)'
            e.currentTarget.style.color = 'var(--fg2)'
          }}
        >
          ← 返回首页
        </Link>
      </div>
    </>
  )
}

// ============================================================
// Variant 4: 场景页 — 使用场景列表
// ============================================================

const SCENES = [
  { slug: 'content-creation', name: '内容创作', icon: '✍️' },
  { slug: 'office', name: '办公效率', icon: '📊' },
  { slug: 'code', name: '代码执行', icon: '💻' },
  { slug: 'design', name: '设计海报', icon: '🎨' },
  { slug: 'data-analysis', name: '数据分析', icon: '📈' },
  { slug: 'research', name: '行业调研', icon: '🔬' },
  { slug: 'automation', name: '自动化', icon: '🤖' },
  { slug: 'ecommerce-copy', name: '电商文案', icon: '📝' },
  { slug: 'video', name: '视频创作', icon: '📹' },
  { slug: 'memory', name: '记忆增强', icon: '🧠' },
]

function ScenarioSidebar({ pathname }: { pathname: string }) {
  // 当前场景 slug，如 /scenario/student
  const currentSlug = pathname.split('/')[2] || ''

  return (
    <>
      <SearchBox />

      <div className="mb-1">
        <SectionLabel>使用场景</SectionLabel>
        <div>
          {SCENES.map((s) => {
            const active = currentSlug === s.slug
            return (
              <Link
                key={s.slug}
                href={`/scenario/${s.slug}`}
                className="flex items-center gap-2.5 px-3 py-2 rounded-md transition-all duration-150"
                style={{ background: active ? 'rgba(var(--dim-rgb),0.12)' : 'transparent' }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.background = 'rgba(var(--dim-rgb),0.06)'
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.background = 'transparent'
                }}
              >
                <span className="text-[16px]">{s.icon}</span>
                <span
                  className="flex-1 text-[14px]"
                  style={{ fontWeight: active ? 600 : 500, color: active ? 'var(--primary)' : 'var(--fg)' }}
                >
                  {s.name}
                </span>
                {active && <span className="text-[12px] text-[var(--primary)]">●</span>}
              </Link>
            )
          })}
        </div>
      </div>

      <div className="mt-5">
        <SectionLabel>发现更多</SectionLabel>
        <div>
          <NavLink href="/essential" label="装机必备" />
          <NavLink href="/compare" label="工具对比" />
          <NavLink href="/guide" label="深度评测" />
        </div>
      </div>
    </>
  )
}

// ============================================================
// Variant 5: 平台页 — 平台列表（与首页一致）
// ============================================================

function PlatformSidebar({ pathname }: { pathname: string }) {
  const currentSlug = pathname.split('/')[2] || ''

  const PLATFORMS = usePlatforms()
  return (
    <>
      <SearchBox />

      <div className="mb-1">
        <SectionLabel>平台</SectionLabel>
        <div>
          {PLATFORMS.map((p) => {
            const active = currentSlug === p.slug
            return (
              <Link
                key={p.slug}
                href={`/platform/${p.slug}`}
                className="flex items-center gap-2.5 px-3 py-2 rounded-md transition-all duration-150"
                style={{ background: active ? 'rgba(var(--dim-rgb),0.12)' : 'transparent' }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.background = 'rgba(var(--dim-rgb),0.06)'
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.background = 'transparent'
                }}
              >
                <span
                  className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-[var(--fg3)]"
                  style={{ background: 'transparent', border: '1px solid var(--border)' }}
                >
                  {p.name[0]}
                </span>
                <span
                  className="flex-1 text-[14px]"
                  style={{ fontWeight: active ? 600 : 500, color: active ? 'var(--primary)' : 'var(--fg)' }}
                >
                  {p.name}
                </span>
                <span className="text-xs tabular-nums" style={{ color: active ? 'var(--primary)' : 'var(--fg3)' }}>
                  {p.count}
                </span>
              </Link>
            )
          })}
        </div>
      </div>

      <div className="mt-5">
        <Link
          href="/"
          className="block text-center py-2 rounded-md text-[12px] transition"
          style={{ border: '1px dashed var(--border)', color: 'var(--fg2)', background: 'transparent' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--primary)'
            e.currentTarget.style.color = 'var(--primary)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border)'
            e.currentTarget.style.color = 'var(--fg2)'
          }}
        >
          ← 返回首页
        </Link>
      </div>
    </>
  )
}

// ============================================================
// Variant 6: 搜索页 — 筛选条件（平台/类型/价格 多选）
// ============================================================

const SEARCH_TYPES = [
  { slug: 'skill', name: 'AI Skill', count: 280 },
  { slug: 'mcp', name: 'MCP', count: 22 },
  { slug: 'gpts', name: 'GPTs', count: 86 },
  { slug: 'saas', name: 'SaaS', count: 24 },
]

const PRICE_OPTIONS = [
  { slug: 'free', name: '完全免费', count: 120 },
  { slug: 'freemium', name: '免费额度', count: 180 },
  { slug: 'paid', name: '付费', count: 90 },
]

function SearchSidebarContent() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const platformsList = usePlatforms()
  const selPlatforms = searchParams.get('platform')?.split(',').filter(Boolean) || []
  const selTypes = searchParams.get('type')?.split(',').filter(Boolean) || []
  const selPrices = searchParams.get('price')?.split(',').filter(Boolean) || []

  const updateParam = (key: string, values: string[]) => {
    const params = new URLSearchParams(searchParams.toString())
    if (values.length > 0) params.set(key, values.join(','))
    else params.delete(key)
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }

  const toggle = (slug: string, key: string, current: string[]) => {
    const next = current.includes(slug) ? current.filter(s => s !== slug) : [...current, slug]
    updateParam(key, next)
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4 px-3">
        <span
          className="text-[13px] font-bold text-[var(--fg)]"
        >
          🎛️ 筛选条件
        </span>
        {(selPlatforms.length + selTypes.length + selPrices.length) > 0 && (
          <button
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString())
              params.delete('platform')
              params.delete('type')
              params.delete('price')
              const qs = params.toString()
              router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
            }}
            className="text-[11px] text-[var(--primary)] hover:underline"
          >
            清除
          </button>
        )}
      </div>

      {/* 平台多选 */}
      <div className="mb-4">
        <SectionLabel>平台</SectionLabel>
        <div>
          {platformsList.slice(0, 8).map((p) => (
            <CheckRow
              key={p.slug}
              label={p.name}
              count={p.count}
              checked={selPlatforms.includes(p.slug)}
              onToggle={() => toggle(p.slug, 'platform', selPlatforms)}
            />
          ))}
        </div>
      </div>

      {/* 类型多选 */}
      <div className="mb-4">
        <SectionLabel>类型</SectionLabel>
        <div>
          {SEARCH_TYPES.map((t) => (
            <CheckRow
              key={t.slug}
              label={t.name}
              count={t.count}
              checked={selTypes.includes(t.slug)}
              onToggle={() => toggle(t.slug, 'type', selTypes)}
            />
          ))}
        </div>
      </div>

      {/* 价格多选 */}
      <div className="mb-4">
        <SectionLabel>价格</SectionLabel>
        <div>
          {PRICE_OPTIONS.map((p) => (
            <CheckRow
              key={p.slug}
              label={p.name}
              count={p.count}
              checked={selPrices.includes(p.slug)}
              onToggle={() => toggle(p.slug, 'price', selPrices)}
            />
          ))}
        </div>
      </div>
    </>
  )
}

// ============================================================
// Variant 7: 对比页 — 热门对比 + 相关评测
// ============================================================

const POPULAR_COMPARES = [
  { slug: 'brave-search-mcp,tavily-search', title: 'Brave vs Tavily 搜索', count: 42 },
  { slug: 'hermes-hooks,claude-mem', title: 'Hermes vs Claude 记忆', count: 38 },
  { slug: 'systematic-debugging,ai-tool-evaluation', title: '调试 vs 评测框架', count: 25 },
  { slug: 'github-pr-workflow,popular-web-designs', title: 'GitHub vs Web设计', count: 20 },
  { slug: 'composio,brave-search-mcp', title: 'Composio vs Brave 连接', count: 15 },
]

function CompareSidebar() {
  return (
    <>
      <SearchBox />

      <div className="mb-1">
        <SectionLabel>热门对比</SectionLabel>
        <div>
          {POPULAR_COMPARES.map((c) => (
            <Link
              key={c.slug}
              href={`/compare?slugs=${c.slug}`}
              className="flex items-center gap-2.5 px-3 py-2 rounded-[6px] transition"
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(var(--dim-rgb),0.06)'
                e.currentTarget.style.color = 'var(--primary)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = 'var(--fg)'
              }}
            >
              <span className="text-[13px] text-[var(--fg3)]">⇄</span>
              <span className="flex-1 text-[13px] font-medium leading-snug">{c.title}</span>
              <span className="text-[11px] text-[var(--fg4)]">{c.count}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <SectionLabel>相关评测</SectionLabel>
        <div>
          <NavLink href="/guide/ai-coding-tools-deep-dive" label="编程工具深度对比" />
          <NavLink href="/guide/memory-comparison" label="记忆方案横评" />
          <NavLink href="/guide/search-comparison" label="搜索方案对比" />
        </div>
      </div>

      <div className="mt-5">
        <Link
          href="/"
          className="block text-center py-2 rounded-md text-[12px] transition"
          style={{ border: '1px dashed var(--border)', color: 'var(--fg2)', background: 'transparent' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--primary)'
            e.currentTarget.style.color = 'var(--primary)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border)'
            e.currentTarget.style.color = 'var(--fg2)'
          }}
        >
          ← 返回首页
        </Link>
      </div>
    </>
  )
}

// ============================================================
// Variant 8: 详情页 — 目录 + 相关工具
// ============================================================

// P1-3: 目录锚点对齐 SkillDetailTabs OverviewTab 实际渲染的 section（五问评测/功能亮点/基本信息）。
// 删除了无对应内容的 pricing/tutorial/reviews/alternatives 死链。
const SKILL_TOC = [
  { id: 'overview', label: '五问评测', icon: '📋' },
  { id: 'features', label: '功能亮点', icon: '✨' },
  { id: 'basic', label: '基本信息', icon: '🗂️' },
]

const RELATED_SKILLS = [
  { slug: 'claude', name: 'Claude', icon: '🤖' },
  { slug: 'gpts', name: 'GPTs', icon: '🧠' },
  { slug: 'coze', name: '扣子', icon: '🟢' },
  { slug: 'hermes', name: 'Hermes', icon: '⚡' },
]

function SkillDetailSidebar({ pathname }: { pathname: string }) {
  const [activeSection, setActiveSection] = useState<string>('overview')

  return (
    <>
      <div className="mb-1">
        <SectionLabel>目录</SectionLabel>
        <div>
          {SKILL_TOC.map((t) => {
            const active = activeSection === t.id
            return (
              <a
                key={t.id}
                href={`#${t.id}`}
                onClick={() => setActiveSection(t.id)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-[6px] transition"
                style={{
                  background: active ? 'rgba(var(--dim-rgb),0.12)' : 'transparent',
                  color: active ? 'var(--primary)' : 'var(--fg)',
                  fontWeight: active ? 600 : 500,
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.background = 'rgba(var(--dim-rgb),0.06)'
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.background = 'transparent'
                }}
              >
                <span className="text-[15px]">{t.icon}</span>
                <span className="flex-1 text-[14px]">{t.label}</span>
              </a>
            )
          })}
        </div>
      </div>

      <div className="mt-5">
        <SectionLabel>相关工具</SectionLabel>
        <div>
          {RELATED_SKILLS.map((s) => (
            <Link
              key={s.slug}
              href={`/skill/${s.slug}`}
              className="flex items-center gap-2.5 px-3 py-2 rounded-[6px] transition"
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(var(--dim-rgb),0.06)'
                e.currentTarget.style.color = 'var(--primary)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = 'var(--fg)'
              }}
            >
              <span className="text-[15px]">{s.icon}</span>
              <span className="flex-1 text-[13px] font-medium">{s.name}</span>
              <span className="text-[12px] text-[var(--fg4)]">→</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <Link
          href={`/compare?slugs=${pathname.split('/').pop()}`}
          className="flex items-center justify-center gap-1.5 py-2.5 rounded-md text-[13px] font-semibold transition"
          style={{ border: '1px solid var(--primary)', color: 'var(--primary)', background: 'transparent' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--primary)'
            e.currentTarget.style.color = '#fff'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--primary)'
          }}
        >
          ⇄ 加入对比
        </Link>
      </div>
    </>
  )
}

// ============================================================
// Variant 9: 学习中心 — 学习路径导航
// ============================================================

const LEARN_TOOL_PATHS = [
  { slug: 'hermes', name: 'Hermes', icon: '⚡' },
  { slug: 'coze', name: '扣子', icon: '🟢' },
  { slug: 'claude', name: 'Claude', icon: '🤖' },
  { slug: 'gpts', name: 'GPTs', icon: '🧠' },
]

const LEARN_SCENE_PATHS = [
  { slug: 'write-article', name: '用AI写文章', icon: '✍️' },
  { slug: 'build-agent', name: '搭建AI Agent', icon: '🤖' },
  { slug: 'automate-work', name: '自动化工作', icon: '⚙️' },
  { slug: 'analyze-data', name: '分析数据', icon: '📊' },
]

function LearnSidebar({ pathname }: { pathname: string }) {
  // 当前正在查看的路径 slug
  const segments = pathname.split('/')
  const currentKind = segments[2] // 'tool' | 'scene' | undefined
  const currentSlug = segments[3] || ''

  return (
    <>
      <div className="mb-1">
        <SectionLabel>学习入口</SectionLabel>
        <div>
          <NavLink
            href="/learn"
            label="学习中心首页"
            active={pathname === '/learn'}
          />
        </div>
      </div>

      <div className="mt-5">
        <SectionLabel>🔧 按工具学</SectionLabel>
        <div>
          {LEARN_TOOL_PATHS.map((p) => {
            const active = currentKind === 'tool' && currentSlug === p.slug
            return (
              <Link
                key={p.slug}
                href={`/learn/tool/${p.slug}`}
                className="flex items-center gap-2.5 px-3 py-2 rounded-[6px] transition"
                style={{
                  background: active ? 'rgba(var(--dim-rgb),0.12)' : 'transparent',
                  color: active ? 'var(--primary)' : 'var(--fg)',
                  fontWeight: active ? 600 : 500,
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = 'rgba(var(--dim-rgb),0.06)'
                    e.currentTarget.style.color = 'var(--primary)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = 'var(--fg)'
                  }
                }}
              >
                <span className="text-[15px]">{p.icon}</span>
                <span className="flex-1 text-[14px]">{p.name}</span>
              </Link>
            )
          })}
        </div>
      </div>

      <div className="mt-5">
        <SectionLabel>🎯 按场景学</SectionLabel>
        <div>
          {LEARN_SCENE_PATHS.map((s) => {
            const active = currentKind === 'scene' && currentSlug === s.slug
            return (
              <Link
                key={s.slug}
                href={`/learn/scene/${s.slug}`}
                className="flex items-center gap-2.5 px-3 py-2 rounded-[6px] transition"
                style={{
                  background: active ? 'rgba(var(--dim-rgb),0.12)' : 'transparent',
                  color: active ? 'var(--primary)' : 'var(--fg)',
                  fontWeight: active ? 600 : 500,
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = 'rgba(var(--dim-rgb),0.06)'
                    e.currentTarget.style.color = 'var(--primary)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = 'var(--fg)'
                  }
                }}
              >
                <span className="text-[15px]">{s.icon}</span>
                <span className="flex-1 text-[14px]">{s.name}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </>
  )
}

// ============================================================
// 主组件
// ============================================================

export default function AppSidebar() {
  const pathname = usePathname() || '/'
  const variant = getVariant(pathname)

  return (
    <aside
      suppressHydrationWarning
      className="hidden sm:block w-56 shrink-0 sticky top-[108px] h-[calc(100vh-108px)] overflow-y-auto"
    >
      <div className="pb-6">
        {variant === 'home' && <HomeSidebar />}
        {variant === 'essential' && <EssentialSidebar />}
        {variant === 'guide' && <GuideSidebar />}
        {variant === 'scenario' && <ScenarioSidebar pathname={pathname} />}
        {variant === 'platform' && <PlatformSidebar pathname={pathname} />}
        {variant === 'search' && <SearchSidebarContent />}
        {variant === 'compare' && <CompareSidebar />}
        {variant === 'skill' && <SkillDetailSidebar pathname={pathname} />}
        {variant === 'learn' && <LearnSidebar pathname={pathname} />}
        {(variant === 'default') && <HomeSidebar />}
      </div>
    </aside>
  )
}
