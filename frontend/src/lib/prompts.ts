// 提示词库数据层 — SERVER ONLY（构建期直接读 public/prompts/*.json，SSG 零运行时 IO）
// ⚠️ 客户端组件禁 import 本文件（node:fs）——类型与常量请用 @/lib/prompts-shared
// 口径纪律：数字一律真数派生，禁手写。
import fs from 'node:fs'
import path from 'node:path'
import type { PromptItem } from './prompts-shared'
import { GROUPS } from './prompts-shared'

const DIR = path.join(process.cwd(), 'public', 'prompts')
const SLUG2NAME: Record<string, string> = Object.fromEntries(GROUPS.map((g) => [g.slug, g.name]))

function readJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(path.join(DIR, file), 'utf-8')) as T
}

type FileGroup = { slug: string; name: string; desc: string; total: number; items: PromptItem[] }
type FileIndex = {
  totalLibrary: number
  totalShelf: number
  totalZh: number
  totalTested: number
  groups: Array<{ slug: string; name: string; desc: string; total: number; zh: number; tested: number }>
}

/** 全站统计（index.json，真数派生） */
export function getIndex(): FileIndex {
  return readJson<FileIndex>('index.json')
}

/** 读一组（全部条目） */
export function getGroup(slug: string): FileGroup | null {
  if (!(slug in SLUG2NAME)) return null
  try {
    return readJson<FileGroup>(`${slug}.json`)
  } catch {
    return null
  }
}

/** 读一组前 N 条（列表页首屏） */
export function getGroupHead(slug: string, n = 30): { group: FileGroup; head: PromptItem[] } | null {
  const group = getGroup(slug)
  if (!group) return null
  return { group, head: group.items.slice(0, n) }
}

/** 详情：跨组查找 */
export function getPrompt(id: string): { item: PromptItem; group: FileGroup } | null {
  for (const g of GROUPS) {
    const group = getGroup(g.slug)
    if (!group) continue
    const item = group.items.find((x) => x.id === id)
    if (item) return { item, group }
  }
  return null
}

/** 组内上一条/下一条 */
export function getNeighbors(id: string): { prev: PromptItem | null; next: PromptItem | null } {
  for (const g of GROUPS) {
    const group = getGroup(g.slug)
    if (!group) continue
    const i = group.items.findIndex((x) => x.id === id)
    if (i >= 0) {
      return { prev: i > 0 ? group.items[i - 1] : null, next: i < group.items.length - 1 ? group.items[i + 1] : null }
    }
  }
  return { prev: null, next: null }
}

/** 首批静态参数：五组各前 150 条（详情页 SSG；余量 ISR dynamicParams） */
export function getPromptStaticIds(): string[] {
  const ids: string[] = []
  for (const g of GROUPS) {
    const group = getGroup(g.slug)
    if (group) ids.push(...group.items.slice(0, 150).map((x) => x.id))
  }
  return ids
}

/** sitemap 用：五组全部条目 id（2908 条全量进 sitemap） */
export function getAllPromptIds(): Array<{ id: string; collectedAt: string }> {
  const out: Array<{ id: string; collectedAt: string }> = []
  for (const g of GROUPS) {
    const group = getGroup(g.slug)
    if (group) for (const it of group.items) out.push({ id: it.id, collectedAt: it.collectedAt })
  }
  return out
}

export { GROUPS }
