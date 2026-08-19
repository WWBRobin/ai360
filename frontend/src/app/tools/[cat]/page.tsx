import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { TOOLS_DATA, toolsByCat, type ToolItem } from '@/lib/tools-data'

/**
 * 软件管家二级页（A 形态：类目侧栏 + 高密度列表）
 * 动态路由 /tools/[cat]，11 个类目 slug。
 */

const CAT_META: Record<string, { name: string; desc: string }> = {
  llm: { name: '大模型', desc: 'GPT、Claude、DeepSeek……这些是 AI 世界的发动机' },
  apps: { name: 'AI 软件 / 独立产品', desc: '装上就能用的完整 AI 产品' },
  search: { name: 'AI 搜索', desc: '用 AI 的方式找答案' },
  gen: { name: '内容生成', desc: '写、画、剪、配音——AI 替你生产内容' },
  office: { name: '办公生产力', desc: '文档、表格、会议——日常工作的 AI 加速' },
  coding: { name: '编程开发', desc: '写代码的 AI 同事' },
  agent: { name: 'Agent 平台 / 框架', desc: '搭自己的 AI 机器人' },
  skill: { name: 'Skill / 插件', desc: '给 AI 装上新能力' },
  mcp: { name: 'MCP / 工具协议', desc: '让 AI 连接外部世界的标准协议' },
  data: { name: '数据源 / 知识库', desc: '喂给 AI 的数据底座' },
  relay: { name: '中转 / API 网关', desc: '一个密钥用所有模型' },
}

/** 三段分组（侧栏展示） */
const GROUPS: { label: string; cats: string[] }[] = [
  { label: '认识 AI', cats: ['llm', 'apps', 'search', 'gen'] },
  { label: '用好 AI', cats: ['office', 'coding', 'agent'] },
  { label: '玩透 AI', cats: ['skill', 'mcp', 'data', 'relay'] },
]

export function generateStaticParams() {
  return Object.keys(CAT_META).map((cat) => ({ cat }))
}

export async function generateMetadata({ params }: { params: Promise<{ cat: string }> }): Promise<Metadata> {
  const { cat } = await params
  const meta = CAT_META[cat]
  if (!meta) return {}
  return {
    title: `${meta.name} · 软件管家`,
    description: `ArcDock 软件管家 · ${meta.name}——${meta.desc}。头部工具收录与装机指引。`,
    alternates: { canonical: `/tools/${cat}` },
  }
}

export default async function ToolsCatPage({ params }: { params: Promise<{ cat: string }> }) {
  const { cat } = await params
  const meta = CAT_META[cat]
  if (!meta) notFound()

  const list = toolsByCat(cat)

  return (
    <div className="page-wrapper px-4 sm:px-6 lg:px-8 pb-16">
      {/* 面包屑 */}
      <div className="pt-6 text-[12.5px] text-[var(--fg3)] mb-4">
        <Link href="/tools" className="hover:text-[var(--fg)]">软件管家</Link>
        <span className="mx-1.5">/</span>
        <span className="text-[var(--fg2)]">{meta.name}</span>
      </div>

      <div className="flex gap-6 items-start">
        {/* A 形态侧栏：三段分组 */}
        <aside className="hidden sm:block w-[180px] shrink-0 sticky top-[108px]">
          {GROUPS.map((g) => (
            <div key={g.label} className="mb-5">
              <div className="text-[11px] text-[var(--fg4)] tracking-wider px-1 mb-2">{g.label}</div>
              {g.cats.map((c) => {
                const m = CAT_META[c]
                const n = TOOLS_DATA.filter((t) => t.slug === c).length
                const on = c === cat
                return (
                  <Link
                    key={c}
                    href={`/tools/${c}`}
                    className={`flex items-center justify-between px-3 h-9 rounded-[8px] text-[13px] mb-1 transition ${
                      on
                        ? 'bg-[var(--primary)] text-[var(--on-primary)] font-medium'
                        : 'bg-[var(--bg2)] text-[var(--fg2)] hover:text-[var(--fg)]'
                    }`}
                  >
                    <span className="truncate">{m.name}</span>
                    <span className={`text-[11px] tabular-nums ${on ? 'text-[var(--on-primary)] opacity-70' : 'text-[var(--fg4)]'}`}>{n}</span>
                  </Link>
                )
              })}
            </div>
          ))}
        </aside>

        {/* 主列表 */}
        <div className="flex-1 min-w-0">
          <div className="mb-5">
            <h1 className="text-[24px] font-bold text-[var(--fg)] leading-tight">{meta.name}</h1>
            <p className="text-[13px] text-[var(--fg2)] mt-1.5">{meta.desc} · 共 {list.length} 款</p>
          </div>

          {cat === 'skill' && (
            <div className="mb-4 px-4 py-3 rounded-[10px] border border-[var(--border)] bg-[var(--card)] text-[13px] text-[var(--fg2)]">
              Skill / 插件类是生态平台级入口——更全的 Skill 目录（307 条 · 平台筛选 · 场景 Tab）在
              <Link href="/skills/classic" className="text-[var(--blue)] mx-1 hover:underline font-medium">Skill中心</Link>
              。
            </div>
          )}

          <div className="content-card !p-0">
            <ul className="divide-y divide-[var(--border)]">
              {list.map((t: ToolItem, i) => (
                <li key={t.name} className="flex items-center gap-4 px-5 py-3.5 hover:bg-[var(--bg2)]/40 transition">
                  <span className="text-[12px] text-[var(--fg4)] tabular-nums w-6 text-right shrink-0">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <a
                        href={t.url}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="text-[14px] font-medium text-[var(--fg)] hover:underline truncate"
                      >
                        {t.name}
                      </a>
                      {t.verify === 'verified' ? (
                        <span className="tag tag-tested !text-[10px] !px-1.5 !py-0">实测</span>
                      ) : (
                        <span className="tag !text-[10px] !px-1.5 !py-0 text-[var(--fg3)] bg-[var(--bg2)]">境内需梯</span>
                      )}
                    </div>
                    <div className="text-[12.5px] text-[var(--fg2)] truncate mt-0.5">{t.desc}</div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[11px] px-2 py-0.5 rounded text-[var(--fg4)] bg-[var(--bg2)] cursor-not-allowed" title="评测制作中">评测</span>
                    <a
                      href={t.url}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="text-[11px] px-2 py-0.5 rounded text-[var(--fg2)] bg-[var(--bg2)] hover:text-[var(--fg)]"
                    >
                      官网↗
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
