/**
 * 软件管家数据层 — /tools 页
 * 数据源：src/data/tools-data.json（235 条，final 版：
 *   - Codex 重复合并（保留 OpenAI Codex）
 *   - 中转/API网关只留 ArcDock 中转站）
 * 修改记录见 OB 04-内容/软件管家-头部数据-final.json _meta。
 */

import raw from '@/data/tools-data.json'

export interface ToolItem {
  slug: string
  category: string
  name: string
  desc: string
  url: string
  sort: number
  verify: string
  /** Skill 类深链平台 slug（Coze/GPTs/Claude/Codex/Dify/n8n） */
  skillPlatform?: string
}

export const TOOLS_DATA: ToolItem[] = (raw as ToolItem[])
  .slice()
  .sort((a, b) => a.sort - b.sort)

export function toolsByCat(slug: string): ToolItem[] {
  return TOOLS_DATA.filter((t) => t.slug === slug)
}

export const TOOLS_TOTAL = TOOLS_DATA.length
