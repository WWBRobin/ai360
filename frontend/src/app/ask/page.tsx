import type { Metadata } from 'next'
import Link from 'next/link'
import './ask.css'
import { getAllEntries } from '@/lib/symptom-data'
import AskClient from '@/components/ask/AskClient'

export const metadata: Metadata = {
  title: 'AI 问诊 — 说症状，找方案',
  description:
    'AI 不听话、失忆、装不上、偷偷烧钱？说症状，问诊百科给你原因和解决方案——第一批 15 条常见问题，找不到就提交给我们。',
  alternates: { canonical: '/ask' },
}

/**
 * 问诊百科（/ask）。
 * 数据：src/data/symptom-entries.json 静态引用（Phase2 再入库），
 * 无 DB 依赖，SSR 直出 15 条（curl 可见，SEO），搜索/分类/展开在客户端。
 */
export default function AskPage() {
  const entries = getAllEntries()

  // 空状态（15 条都渲染不出时——理论不会发生，但要有）：指向 /install
  if (entries.length === 0) {
    return (
      <div className="page-wrapper px-4 sm:px-6 lg:px-8">
        <div className="ask-page max-w-[860px] mx-auto pt-8 pb-16">
          <div className="ask-head">
            <h1 className="ask-title">AI 问诊</h1>
            <p className="ask-sub">用 AI 遇到问题？说症状，找方案。</p>
          </div>
          <div className="ask-empty">
            <h2 className="ask-empty-title">问诊百科还没装好</h2>
            <p className="ask-empty-sub">
              症状方案正在整理中——先去装好装备，遇到问题再回来问。
            </p>
            <Link href="/install" className="ask-empty-cta">
              去装机 →
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-wrapper px-4 sm:px-6 lg:px-8">
      <div className="ask-page max-w-[860px] mx-auto pt-8 pb-16">
        <AskClient entries={entries} />
      </div>
    </div>
  )
}
