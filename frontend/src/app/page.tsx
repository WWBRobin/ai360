import Link from 'next/link'
import type { Metadata } from 'next'
import SoftwareCard from '@/components/home/SoftwareCard'
import type { SoftwareCardData } from '@/components/home/SoftwareCard'
import { getTopModels } from '@/lib/models-data'
import { getScenarios } from '@/lib/supabase'
import { getPublishedNews, formatDate } from '@/app/news/queries'
import softwareCards from '@/lib/software-cards.json'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'ArcDock — AI 装备一站式配齐',
  description:
    '装错 Skill、配错 Key、用错工具——AI 时代的坑比你想的多。3 分钟配齐第一套 AI 装备：工作台、助手、大模型、场景、进阶能力扩展一次看全。',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'ArcDock — AI 装备一站式配齐',
    description:
      '装错 Skill、配错 Key、用错工具——AI 时代的坑比你想的多。3 分钟配齐第一套 AI 装备。',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://tools.vokki.cn',
    siteName: 'ArcDock',
    locale: 'zh_CN',
    type: 'website',
  },
}

export default async function HomePage() {
  // ===== 数据获取：全走现有容错函数（红线：首页查询 ≤2 + models 数据层，禁新写裸 supabase.from）=====
  // ① getScenarios() ② getPublishedNews(1,3) —— models 走 models-data.ts（已容错）
  // 软件卡静态 JSON 零查询。所有查询 try-catch 降级，build 预渲染绝不 rethrow。
  const [models, scenarios, newsRes] = await Promise.all([
    getTopModels(6),
    getScenarios().catch(() => []),
    getPublishedNews(1, 3).catch(() => ({ items: [], total: 0 })),
  ])

  // 软件卡静态数据（永远渲染，最低保底）
  const allCards = (softwareCards as { software_cards: SoftwareCardData[] }).software_cards || []
  const workbenchCards = allCards.filter((c) => c.layer === 'workbench').slice(0, 4)
  const assistantCards = allCards.filter((c) => c.layer === 'assistant').slice(0, 3)

  const newsItems = newsRes.items || []

  return (
    <div className="page-wrapper px-4 sm:px-6 lg:px-8 pb-16">
      {/* ===== ① 英雄区（E3 双驱动 · 纯排版，无图）===== */}
      <section className="home-hero">
        <h1 className="home-hero-title">你的 AI 装备，配齐了吗？</h1>
        <p className="home-hero-sub">
          装错 Skill、配错 Key、用错工具——AI 时代的坑比你想的多。3 分钟配齐第一套装备。
        </p>
        <div className="home-hero-cta">
          <Link href="/install" className="home-btn-primary">
            一键配装备 →
          </Link>
          <Link href="/assessment" className="home-btn-ghost">
            测测我的装备健康度 →
          </Link>
        </div>
      </section>

      {/* ===== ② AI 工作台区（4 卡 + 全部）===== */}
      <section className="home-section">
        <div className="home-section-head">
          <h2 className="home-section-title">AI 工作台</h2>
          <Link href="/skills" className="home-section-more">
            全部 →
          </Link>
        </div>
        <div className="home-grid-soft">
          {workbenchCards.map((card) => (
            <SoftwareCard key={card.id} card={card} />
          ))}
        </div>
      </section>

      {/* ===== ③ AI 助手区（3 卡 + 全部）===== */}
      <section className="home-section">
        <div className="home-section-head">
          <h2 className="home-section-title">AI 助手</h2>
          <Link href="/skills" className="home-section-more">
            全部 →
          </Link>
        </div>
        <div className="home-grid-soft">
          {assistantCards.map((card) => (
            <SoftwareCard key={card.id} card={card} />
          ))}
        </div>
      </section>

      {/* ===== ④ 大模型横带（L2 上下文层 · 数据空 → 整区隐藏）===== */}
      {models.length > 0 && (
        <section className="home-section">
          <div className="home-section-head">
            <h2 className="home-section-title">聊天 AI 背后的引擎：谁便宜 / 谁聪明</h2>
            <span className="home-section-note">按能力档位排序</span>
          </div>
          <div className="home-band">
            {models.map((m) => (
              <div key={m.id} className="home-band-card">
                <div className="home-band-name">
                  {m.name}
                  <span className="home-band-tier" aria-label={`能力档位 ${m.capability_tier ?? 0} 星`}>
                    {'★'.repeat(Math.max(0, Math.min(5, m.capability_tier ?? 0)))}
                  </span>
                </div>
                <p className="home-band-liner">{m.one_liner}</p>
                <div className="home-band-price">
                  {m.price_input != null
                    ? `输入 ¥${Number(m.price_input).toLocaleString('zh-CN', { maximumFractionDigits: 1 })}/百万 tokens`
                    : '价格待核'}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ===== ⑤ 场景入口区（复用 getScenarios · 空 → 引导文案）===== */}
      <section className="home-section">
        <div className="home-section-head">
          <h2 className="home-section-title">我想用 AI：</h2>
          <span className="home-section-note">按场景挑 Skill</span>
        </div>
        {scenarios.length > 0 ? (
          <div className="home-scene-grid">
            {scenarios.map((s) => (
              <Link key={s.id} href={`/scenario/${s.slug}`} className="home-scene-card">
                <span className="home-scene-icon" aria-hidden>
                  {s.icon || '🎯'}
                </span>
                <span className="home-scene-name">{s.name}</span>
                {s.skill_count != null && s.skill_count > 0 && (
                  <span className="home-scene-count">{s.skill_count} 个 Skill</span>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <div className="home-empty">
            场景数据加载中，稍后再来看看～也可以先逛逛{' '}
            <Link href="/skills" className="underline decoration-dotted underline-offset-4">
              能力扩展库
            </Link>
          </div>
        )}
      </section>

      {/* ===== ⑥ 中阶通道一行 ===== */}
      <Link href="/skills" className="home-channel">
        已有 Agent？浏览 Skill / MCP 能力扩展 →
      </Link>

      {/* ===== ⑦ 新闻快讯（最新 3 条 · 空 → 整行隐藏）===== */}
      {newsItems.length > 0 && (
        <section className="home-section">
          <div className="home-section-head">
            <h2 className="home-section-title">新闻快讯</h2>
            <Link href="/news" className="home-section-more">
              更多 →
            </Link>
          </div>
          <div className="home-news">
            {newsItems.map((n) => (
              <Link key={n.id} href={`/news/${n.slug}`} className="home-news-item">
                <span className="home-news-title">{n.title}</span>
                <span className="home-news-date">{formatDate(n.published_at)}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
