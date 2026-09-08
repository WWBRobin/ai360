import type { Metadata } from 'next'
import { getIndex, GROUPS, getGroupHead } from '@/lib/prompts'
import PromptShelf, { type ShelfGroup } from '@/components/prompts/PromptShelf'

/**
 * /prompts — 提示词库列表页（v1 线框 α 拍板版）
 * SSG：构建期读 public/prompts/*.json 直出（五组并置总览 + 组 Tab 首 30）。
 * 真数纪律：读数行全部来自 index.json 真数派生。
 */
export const metadata: Metadata = {
  title: '提示词库 — 被验证过的 AI 使用经验 | ArcDock',
  description:
    '被验证过的 AI 使用经验，每条带出处。五组：让AI变成某个人 / 任务指令 / 填空即用的框架 / 治AI的毛病 / 写作风格。未实测的标「未验证」，不装懂。',
  alternates: { canonical: '/prompts' },
  openGraph: {
    title: '提示词库 — 被验证过的 AI 使用经验 | ArcDock',
    description: '五组提示词：角色扮演 / 任务指令 / 填空框架 / 治AI毛病 / 写作风格。每条带出处。',
    type: 'website',
  },
}

export default async function PromptsPage({
  searchParams,
}: {
  searchParams: Promise<{ g?: string }>
}) {
  const { g } = await searchParams
  const idx = getIndex()
  const groups: ShelfGroup[] = GROUPS.map((g) => {
    const hit = getGroupHead(g.slug, 30)
    const meta = idx.groups.find((x) => x.slug === g.slug)
    return {
      slug: g.slug,
      name: g.name,
      desc: g.desc,
      total: meta?.total ?? hit?.group.total ?? 0,
      zh: meta?.zh ?? 0,
      tested: meta?.tested ?? 0,
      head: hit?.head ?? [],
    }
  })

  // 首屏首条条目全文进 noscript? 不需要——SSR 已直出前 30 条标题+摘要
  return (
    <div className="page-wrapper min-h-screen px-4 sm:px-6 lg:px-8">
      {/* 标题板块 — /news 同构 */}
      <div className="pt-10 pb-8">
        <h1 className="text-[28px] leading-tight font-bold text-[var(--fg)]">提示词库</h1>
        <p className="mt-1.5 text-[15px] text-[var(--fg3)]">
          被验证过的 AI 使用经验，每条带出处。未实测的标「未验证」，不装懂。
        </p>
        {/* 读数行：真数派生 */}
        <div className="mt-4 flex flex-wrap items-baseline gap-7">
          <span className="flex items-baseline gap-1.5">
            <b className="font-mono text-[26px] font-extrabold tracking-wide text-[var(--green)]">{idx.totalShelf}</b>
            <span className="text-[12.5px] text-[var(--fg3)]">条已上架</span>
          </span>
          <span className="flex items-center gap-2 self-center">
            <span className="block h-1.5 w-[170px] overflow-hidden rounded-full bg-[var(--bg2)]">
              <i
                className="block h-full rounded-full bg-[var(--green)]"
                style={{ width: `${Math.round((idx.totalShelf / idx.totalLibrary) * 100)}%` }}
              />
            </span>
            <span className="text-[12.5px] text-[var(--fg3)]">
              {idx.totalShelf} / {idx.totalLibrary} · 分批放行
            </span>
          </span>
          <span className="flex items-baseline gap-1.5">
            <b className="font-mono text-[26px] font-extrabold tracking-wide text-[var(--fg)]">{idx.totalZh}</b>
            <span className="text-[12.5px] text-[var(--fg3)]">条中文</span>
          </span>
          <span className="flex items-baseline gap-1.5">
            <b className="font-mono text-[26px] font-extrabold tracking-wide text-[var(--fg)]">{idx.totalTested}</b>
            <span className="text-[12.5px] text-[var(--fg3)]">条已实测✓</span>
          </span>
        </div>
      </div>

      <PromptShelf groups={groups} initialTab={g && groups.some((x) => x.slug === g) ? g : 'all'} />

      <div className="h-16" />
    </div>
  )
}
