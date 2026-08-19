import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import CatListClient from '@/components/tools/CatListClient'
import { TOOLS_DATA, toolsByCat } from '@/lib/tools-data'
import '@/components/tools/tools.css'

/**
 * 软件管家二级页（A 形态 · 精确对齐线框视觉规格）
 * - 侧栏：全部工具 + 11 类按 L1/L2/L3 分组（与一层门户同构，认知不跳变），当前类黑底白字
 * - 面包屑：软件管家 / 层名 / 类名（三级，含层）
 * - toolbar：类内搜索 + 综合/实测优先/名称排序 + 仅实测筛选
 * - 列表行：行卡（名称定宽 + 描述 + 评分位留槽 + 评测/装机/官网），装机黑色实心=主按钮
 * - 加载更多（默认 8 条，分页展开）
 */

const CAT_META: Record<string, { name: string; desc: string; layer: string }> = {
  llm: { name: '大模型', desc: 'AI 世界的发动机', layer: '认识 AI' },
  apps: { name: 'AI 软件 / 独立产品', desc: '装上就能用的完整 AI 产品', layer: '认识 AI' },
  search: { name: 'AI 搜索', desc: '用 AI 的方式找答案', layer: '认识 AI' },
  gen: { name: '内容生成', desc: '写、画、剪、配音', layer: '认识 AI' },
  office: { name: '办公生产力', desc: '日常工作的 AI 加速', layer: '用好 AI' },
  coding: { name: '编程开发', desc: '写代码的 AI 同事', layer: '用好 AI' },
  agent: { name: 'Agent 平台 / 框架', desc: '搭自己的 AI 机器人', layer: '用好 AI' },
  skill: { name: 'Skill / 插件', desc: '给 AI 装上新能力', layer: '玩透 AI' },
  mcp: { name: 'MCP / 工具协议', desc: 'AI 连接外部世界的协议', layer: '玩透 AI' },
  data: { name: '数据源 / 知识库', desc: '喂给 AI 的数据底座', layer: '玩透 AI' },
  relay: { name: '中转 / API 网关', desc: '一个密钥用所有模型', layer: '玩透 AI' },
}

const GROUPS: { label: string; cats: string[] }[] = [
  { label: 'L1 · 认识 AI', cats: ['llm', 'apps', 'search', 'gen'] },
  { label: 'L2 · 用好 AI', cats: ['office', 'coding', 'agent'] },
  { label: 'L3 · 玩透 AI', cats: ['skill', 'mcp', 'data', 'relay'] },
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
      <div className="flex gap-4 items-start mt-4">
        {/* ===== 侧栏：L1/L2/L3 分组（A 形态）===== */}
        <aside className="hidden sm:block w-[220px] shrink-0 sticky top-[108px]">
          <Link
            href="/tools"
            className="flex items-center justify-between h-8 px-3 rounded-[6px] mb-1.5 text-[12.5px] bg-[var(--bg2)] text-[var(--fg2)] hover:text-[var(--fg)]"
          >
            <span>全部工具</span>
            <span className="text-[10px] opacity-70">{TOOLS_DATA.length}</span>
          </Link>
          {GROUPS.map((g) => (
            <div key={g.label} className="mb-3">
              <div className="text-[10px] text-[var(--fg4)] tracking-[1px] px-1 pt-2.5 pb-1">{g.label}</div>
              {g.cats.map((c) => {
                const m = CAT_META[c]
                const n = TOOLS_DATA.filter((t) => t.slug === c).length
                const on = c === cat
                return (
                  <Link
                    key={c}
                    href={`/tools/${c}`}
                    className={`flex items-center justify-between h-8 px-3 rounded-[6px] mb-1.5 text-[12.5px] transition ${
                      on
                        ? 'bg-[var(--primary)] text-[var(--on-primary)] font-medium'
                        : 'bg-[var(--bg2)] text-[var(--fg2)] hover:text-[var(--fg)]'
                    }`}
                  >
                    <span className="truncate">{m.name}</span>
                    <span className={`text-[10px] tabular-nums ${on ? 'opacity-70' : 'text-[var(--fg4)]'}`}>{n}</span>
                  </Link>
                )
              })}
            </div>
          ))}
        </aside>

        {/* ===== 主区 ===== */}
        <div className="flex-1 min-w-0">
          {/* 三级面包屑：软件管家 / 层名 / 类名（线框 .crumb） */}
          <div className="text-[11.5px] text-[var(--fg3)] mb-2.5">
            <Link href="/tools" className="hover:text-[var(--fg)]">软件管家</Link>
            <span className="mx-1.5">/</span>
            <span>{meta.layer}</span>
            <span className="mx-1.5">/</span>
            <b className="text-[var(--fg2)] font-medium">{meta.name}</b>
            <span className="ml-1">（{list.length} 个）</span>
          </div>

          {cat === 'skill' && (
            <div className="mb-2.5 px-4 py-2.5 rounded-[8px] bg-[var(--bg2)] border-l-[3px] border-[var(--primary)] text-[12.5px] text-[var(--fg2)] rounded-l-none">
              Skill / 插件类是生态平台级入口——更全的 Skill 目录（307 条 · 平台筛选）在
              <Link href="/skills/classic" className="text-[var(--blue)] mx-1 hover:underline font-medium">Skill中心</Link>
              ，本页收录各平台官方入口。
            </div>
          )}

          <CatListClient cat={cat} list={list} />
        </div>
      </div>
    </div>
  )
}
