import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { getPrompt, getNeighbors, getPromptStaticIds } from '@/lib/prompts'
import { SMOKE_OK } from '@/lib/prompts-shared'
import CopyBtn, { Badge } from '@/components/prompts/PromptDetailClient'

/**
 * /prompts/[id] — 提示词详情页（拍板 D2：详情页，GEO 硬要求）
 * 首批 150×5 组生成静态参数，余量 ISR 兜底（revalidate 3600 + 动态按需）。
 * title 规范：「{标题} - AI提示词 - ArcDock」（任务书 §四）。
 */
export const revalidate = 3600
export const dynamicParams = true

export function generateStaticParams() {
  return getPromptStaticIds().map((id) => ({ id }))
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const hit = getPrompt(id)
  if (!hit) return { title: '未找到该提示词 | ArcDock' }
  const { item, group } = hit
  return {
    title: `${item.title} - AI提示词 - ArcDock`,
    description: `${item.summary.slice(0, 120)}｜${group.name} · ${item.language === 'zh' ? '中文' : '英文'}提示词，来源：${item.sourceName || '见详情'}。`,
    alternates: { canonical: `/prompts/${item.id}` },
    openGraph: {
      title: `${item.title} - AI提示词 - ArcDock`,
      description: item.summary.slice(0, 160),
      type: 'article',
    },
  }
}

export default async function PromptDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const hit = getPrompt(id)
  if (!hit) notFound()
  const { item, group } = hit
  const { prev, next } = getNeighbors(id)

  // JSON-LD（任务书 §四：source_url 作 isBasedOn）
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: item.title,
    articleSection: group.name,
    inLanguage: item.language === 'zh' ? 'zh-CN' : 'en',
    text: item.content.slice(0, 2000),
    isPartOf: { '@type': 'CollectionPage', name: 'ArcDock 提示词库', url: 'https://tools.vokki.cn/prompts' },
    ...(item.sourceUrl ? { isBasedOn: item.sourceUrl } : {}),
  }

  const isConfig = item.applyType !== 'chat'

  return (
    <div className="page-wrapper min-h-screen px-4 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="mx-auto max-w-[860px]">
        {/* 面包屑 */}
        <div className="flex items-center gap-2 pt-[18px] pb-1 text-[12.5px] text-[var(--fg3)]">
          <Link href="/prompts" className="hover:text-[var(--fg)]">
            提示词库
          </Link>
          <span>/</span>
          <Link href={`/prompts?g=${group.slug}`} className="hover:text-[var(--fg)]">
            {group.name}
          </Link>
          <span>/</span>
          <span className="truncate">{item.title}</span>
        </div>

        <h1 className="mt-2.5 mb-3 text-[24px] leading-[1.35] font-bold text-[var(--fg)]">{item.title}</h1>

        <div className="mb-4.5 flex flex-wrap gap-1.5">
          <Badge item={item} />
          <span className="inline-flex h-[22px] items-center rounded-full bg-[var(--bg2)] px-[9px] font-mono text-[11px] font-semibold text-[var(--fg3)]">
            {item.id}
          </span>
          {!SMOKE_OK.has(item.smoke) && (
            <span className="inline-flex h-[22px] items-center rounded-full bg-[var(--bg2)] px-[9px] text-[11px] font-semibold text-[var(--fg3)]">
              未验证
            </span>
          )}
        </div>

        {/* 提示词全文 */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-[22px] py-5 text-[13.5px] leading-[1.75] whitespace-pre-wrap break-words text-[var(--fg)]">
          {item.content}
        </div>

        {/* 复制 CTA */}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <CopyBtn item={item} />
          <span className="text-[12.5px] text-[var(--fg3)]">
            {isConfig ? '复制后按「写进配置」说明使用' : '复制后粘贴到 AI 对话框发送，本次对话全程生效'}
          </span>
        </div>

        {/* 来源卡 */}
        <div className="mt-3.5 flex items-start gap-2.5 rounded-[10px] bg-[var(--bg2)] px-4 py-3.5 text-[12.5px] text-[var(--fg2)]">
          <span className="shrink-0">出处：</span>
          <span className="min-w-0">
            <b className="text-[var(--fg)]">{item.sourceName || '（未记录）'}</b>
            {item.sourceUrl && (
              <>
                {' '}
                ·{' '}
                <a
                  href={item.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="break-all border-b border-[rgba(0,111,214,0.3)] text-[var(--blue)]"
                >
                  {item.sourceUrl.replace(/^https?:\/\//, '').slice(0, 80)}
                </a>
              </>
            )}{' '}
            · 可信度 {item.credibility || '—'}
            {item.tags.length > 0 && (
              <>
                {' '}
                · 标签：{item.tags.slice(0, 6).join(' / ')}
              </>
            )}
          </span>
        </div>

        {/* 用法说明（PASTE 双说明，桌面端文案照搬） */}
        {isConfig ? (
          <div className="mt-3.5 flex flex-wrap gap-3">
            <div className="min-w-[280px] flex-1 rounded-[10px] bg-[var(--green-bg)] px-3.5 py-3 text-[12.5px] leading-[1.65] text-[var(--fg2)]">
              <b className="mb-1 block text-[12px] text-[var(--green)]">写进配置（长期生效）</b>
              文件权限型：Hermes / Claude Code / WorkBuddy 桌面版写进配置文件，此后每次对话生效。记忆型：ChatGPT / Gemini /
              豆包 / Kimi 存入记忆，跨对话生效。兜底：都不支持的产品，规则至少在当前对话全程生效——不会白粘。
            </div>
          </div>
        ) : (
          <div className="mt-3.5 flex flex-wrap gap-3">
            <div className="min-w-[280px] flex-1 rounded-[10px] bg-[var(--green-bg)] px-3.5 py-3 text-[12.5px] leading-[1.65] text-[var(--fg2)]">
              <b className="mb-1 block text-[12px] text-[var(--green)]">怎么用（对话型）</b>
              复制后粘贴到对话框发送，本次对话全程生效。想长期用：支持自定义指令的产品（设置→个性化）可设为默认。
            </div>
          </div>
        )}

        {/* 上一条 / 下一条 */}
        <div className="mt-7 flex justify-between gap-4 border-t border-[var(--border)] pt-4 text-[13px] text-[var(--fg3)]">
          {prev ? (
            <Link href={`/prompts/${prev.id}`} className="min-w-0 flex-1 truncate hover:text-[var(--fg)]">
              ← 上一条：{prev.title}
            </Link>
          ) : (
            <span className="min-w-0 flex-1" />
          )}
          <Link href={`/prompts?g=${group.slug}`} className="shrink-0 hover:text-[var(--fg)]">
            回到「{group.name}」
          </Link>
          {next ? (
            <Link href={`/prompts/${next.id}`} className="min-w-0 flex-1 truncate text-right hover:text-[var(--fg)]">
              下一条：{next.title} →
            </Link>
          ) : (
            <span className="min-w-0 flex-1 text-right" />
          )}
        </div>

        <div className="h-16" />
      </div>
    </div>
  )
}
