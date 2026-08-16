import { supabase } from '@/lib/supabase'

/**
 * 灯盏数据层（学习板块 v3 · 指导手册模式）
 *
 * 数据源：Supabase content_items JOIN content_versions
 *   - content_items：slug = 'xhs-lamp-0'..'xhs-lamp-4'，status = 'published'
 *   - content_versions：version_type = 'beginner'，取 version_number 最大
 * 正文是 markdown：`## ` 分节；表格行（| 开头）→ { headers, rows }；
 * 来源清单节（- 标签：URL）单独解析成 sources。
 */

export interface LampTable {
  headers: string[]
  rows: string[][]
}

export interface LampSource {
  label: string
  url: string
}

export type LampBlock =
  | { kind: 'p'; text: string }
  | { kind: 'table'; table: LampTable }
  | { kind: 'checklist'; items: string[] }
  | { kind: 'methodNote'; text: string }
  | { kind: 'sources'; sources: LampSource[] }

export interface LampSection {
  head: string
  blocks: LampBlock[]
}

export interface Lamp {
  slug: string
  title: string
  sections: LampSection[]
  /** 首节第一段当简介（列表页卡片用） */
  intro: string
}

/** 星级字符串里的 ★/⭐ 个数 → 1-5；解析失败给 0（UI 按 0 显示"—"） */
export function starCount(s: string): number {
  const m = s.match(/[★⭐]/g)
  return m ? m.length : 0
}

/** 表头是"工具方案"类节 → 渲染成可交互评判矩阵（v3 机制） */
export function isMatrixHead(head: string): boolean {
  return head.includes('工具方案') || head.includes('三条路线') || head.includes('路线')
}

/**
 * 解析一盏灯的 markdown 正文 → 分节结构。
 * 手写简易解析器（项目规则：不引 markdown 库，原型同款做法）。
 */
export function parseLampMarkdown(md: string): LampSection[] {
  const lines = md.split('\n')
  const sections: LampSection[] = []
  let cur: LampSection | null = null
  let para: string[] = []
  let table: LampTable | null = null
  let inSources = false
  let sources: LampSource[] = []
  let checklist: string[] = []
  let methodNote: string[] = []

  const flushPara = () => {
    if (para.length && cur) {
      cur.blocks.push({ kind: 'p', text: para.join(' ') })
      para = []
    }
  }
  const flushTable = () => {
    if (table && table.rows.length && cur) {
      cur.blocks.push({ kind: 'table', table })
    }
    table = null
  }
  const flushAll = () => {
    flushPara()
    flushTable()
    if (methodNote.length && cur) {
      cur.blocks.push({ kind: 'methodNote', text: methodNote.join(' ') })
      methodNote = []
    }
    if (checklist.length && cur) {
      cur.blocks.push({ kind: 'checklist', items: checklist })
      checklist = []
    }
    if (inSources && sources.length && cur) {
      cur.blocks.push({ kind: 'sources', sources })
      sources = []
      inSources = false
    }
  }

  for (const raw of lines) {
    const line = raw.trimEnd()

    // 新节
    if (line.startsWith('## ')) {
      flushAll()
      cur = { head: line.slice(3).trim(), blocks: [] }
      sections.push(cur)
      inSources = cur.head.includes('来源')
      continue
    }
    if (!cur) continue

    // 表格行
    if (line.startsWith('|')) {
      flushPara()
      const cells = line
        .split('|')
        .map((c) => c.trim())
        // 首尾空串是边界 | 产生的
        .filter((_, i, arr) => !(i === 0 && arr[0] === '') && !(i === arr.length - 1 && arr[arr.length - 1] === ''))
      // 分隔行 |---|---|
      if (cells.every((c) => /^:?-{2,}:?$/.test(c))) continue
      if (!table) table = { headers: cells, rows: [] }
      else table.rows.push(cells)
      continue
    }
    if (table) flushTable()

    // 清单 - [ ] xxx
    const ck = line.match(/^-\s*\[ \]\s*(.+)$/)
    if (ck) {
      flushPara()
      checklist.push(ck[1])
      continue
    }

    // 来源清单 - 标签：URL
    if (inSources) {
      const src = line.match(/^-\s*(.+?)[:：]\s*(https?:\/\/\S+)\s*$/)
      if (src) {
        flushPara()
        sources.push({ label: src[1], url: src[2] })
        continue
      }
    }

    // 方法论来源说明（blockquote）
    if (line.startsWith('>')) {
      flushPara()
      const t = line.replace(/^>\s*/, '').trim()
      if (t) methodNote.push(t)
      continue
    }

    // 空行 = 段落边界
    if (!line.trim()) {
      flushPara()
      continue
    }

    para.push(line.trim())
  }
  flushAll()
  return sections
}

/** markdown 行内元素 → HTML 片段（strong/em/code/链接）。先转义再受控还原，防注入。 */
export function inlineMd(s: string): string {
  const esc = s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
  return esc
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
}

/** 拉一盏星的全部灯（slug 升序）。RLS：anon 只读 published。 */
export async function getLampsByStarPrefix(prefix: string): Promise<Lamp[]> {
  const { data, error } = await supabase
    .from('content_items')
    .select('slug, title, content_versions!inner(version_number, version_type, content, title)')
    .like('slug', `${prefix}%`)
    .eq('status', 'published')
    .order('slug', { ascending: true })

  if (error || !data) {
    console.error('getLampsByStarPrefix error:', error)
    return []
  }

  const lamps: Lamp[] = []
  for (const row of data as unknown as RawRow[]) {
    // 取 version_type=beginner 里 version_number 最大的一条
    const versions = (row.content_versions || []).filter((v) => v.version_type === 'beginner')
    if (!versions.length) continue
    const best = versions.reduce((a, b) => (a.version_number >= b.version_number ? a : b))
    const sections = parseLampMarkdown(best.content || '')
    const firstText = sections
      .flatMap((s) => s.blocks)
      .find((b): b is Extract<LampBlock, { kind: 'p' }> => b.kind === 'p')?.text || ''
    lamps.push({
      slug: row.slug,
      title: row.title,
      sections,
      intro: firstText.slice(0, 80),
    })
  }
  return lamps
}

interface RawRow {
  slug: string
  title: string
  content_versions: {
    version_number: number
    version_type: string
    content: string | null
    title: string | null
  }[]
}
