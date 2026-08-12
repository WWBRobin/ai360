import fs from 'node:fs'
import path from 'node:path'

/**
 * 深度指南 / 横评文章
 *
 * 文章源文件存放在 src/content/articles/*.md（从 ai-skill-content 同步），
 * 构建时用 node:fs 读取，避免把大段 markdown 内联进 TS。
 *
 * Slug 映射：
 *   install-guide      → 01-装机必备完整指南
 *   memory-comparison  → 02-AI怎么记住你
 *   search-comparison  → 03-怎么让AI能上网
 *   ecommerce-copy     → 04-电商文案Skill实测对比
 */

export interface ArticleMeta {
  /** URL slug，如 "install-guide" */
  slug: string
  /** 展示标题（同时作为 OG/SEO 标题） */
  title: string
  /** 卡片/列表用副标题 */
  summary: string
  /** emoji 图标 */
  icon: string
  /** 分类标签 */
  tag: string
  /** 列表排序权重（越大越靠前） */
  order: number
}

export interface Article extends ArticleMeta {
  /** markdown 原文 */
  content: string
}

const ARTICLES_DIR = path.join(process.cwd(), 'src', 'content', 'articles')

// slug → 元信息。title/summary 与各 md 文件首行的 H1 保持一致。
const ARTICLE_META: Record<string, ArticleMeta> = {
  'install-guide': {
    slug: 'install-guide',
    title: 'AI Agent 装机必备：2026 年基础工具链完整指南',
    summary: '刚接触 AI Agent？记忆/搜索/文件/代码/连接，30 分钟一次配齐，附安装命令和实测评价。',
    icon: '📖',
    tag: '装机必备',
    order: 10,
  },
  'memory-comparison': {
    slug: 'memory-comparison',
    title: 'AI 怎么记住你？4 款记忆方案横评',
    summary: 'claude-mem / Mem0 / Supermemory / Hermes Hindsight 实测对比，告诉你哪个让 AI 真正记住你。',
    icon: '🧠',
    tag: '记忆增强',
    order: 20,
  },
  'search-comparison': {
    slug: 'search-comparison',
    title: '怎么让 AI 能上网？3 款搜索方案对比',
    summary: 'Tavily / Firecrawl / Brave Search MCP 实测，AI 联网搜索到底装哪个。',
    icon: '🔍',
    tag: '联网搜索',
    order: 30,
  },
  'ecommerce-copy': {
    slug: 'ecommerce-copy',
    title: '电商文案 Skill 实测对比',
    summary: '小红书图文神器Pro vs 品牌朋友圈文案 vs 文心一言4.5，谁写出来的文案能直接发？',
    icon: '✍️',
    tag: '电商文案',
    order: 40,
  },
}

function readRaw(slug: string): string {
  const file = path.join(ARTICLES_DIR, `${slug}.md`)
  return fs.readFileSync(file, 'utf8')
}

/** 所有文章 slug（固定 4 篇） */
export function getArticleSlugs(): string[] {
  return Object.keys(ARTICLE_META)
}

/** 获取单篇文章（含 markdown 原文）。slug 不存在时返回 null。 */
export function getArticle(slug: string): Article | null {
  const meta = ARTICLE_META[slug]
  if (!meta) return null
  return { ...meta, content: readRaw(slug) }
}

/** 获取所有文章的元信息（不含正文），按 order 升序。用于列表页。 */
export function getAllArticleMetas(): ArticleMeta[] {
  return Object.values(ARTICLE_META).sort((a, b) => a.order - b.order)
}
