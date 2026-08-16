import type { Metadata } from 'next'
import Link from 'next/link'
import '../star-lamp.css'
import { getLampsByStarPrefix } from '@/lib/lamp-data'
import { XHS_STAR } from '@/lib/star-meta'
import StarPageClient from '@/components/learn/lamp/StarPageClient'

export const metadata: Metadata = {
  title: `${XHS_STAR.title} · 学习中心`,
  description: `${XHS_STAR.desc} 五盏灯指导手册：找对标 → 写文案 → 生图 → 风格统一 → 数据复盘，每步带工具评判矩阵与随叫随到的诊断教练。`,
  alternates: { canonical: `/learn/star/${XHS_STAR.slug}` },
}

export const revalidate = 300

export default async function StarPage() {
  const lamps = await getLampsByStarPrefix('xhs-lamp-')

  if (!lamps.length) {
    return (
      <div className="page-wrapper px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-[24px] font-medium text-[var(--fg)]">灯盏内容暂未发布</h1>
        <p className="text-[var(--fg2)] mt-2 text-[14px]">
          「{XHS_STAR.title}」的 5 盏灯正在入库中（xhs-lamp-0..4 · published）。稍后再来。
        </p>
        <Link href="/learn" className="text-[var(--blue)] text-[14px] mt-4 inline-block">
          ← 返回学习中心
        </Link>
      </div>
    )
  }

  return (
    <div className="page-wrapper px-4 sm:px-6 lg:px-8">
      <div className="lamp-page max-w-[860px] mx-auto pt-8 pb-16">
        <StarPageClient lamps={lamps} />
      </div>
    </div>
  )
}
