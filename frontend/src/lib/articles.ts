import fs from 'node:fs'
import path from 'node:path'

/**
 * 深度指南 / 全站文章索引
 *
 * 文章源文件存放在 src/content/articles/*.md。
 * 元信息（title / summary / icon / tag / 顺序）统一由
 * src/content/articles/manifest.json 维护，新增文章只需：
 *   1. 把 *.md 放进 articles 目录
 *   2. 在 manifest.json 追加一条记录
 *
 * 构建时用 node:fs 读取，避免把大段 markdown 内联进 TS。
 */

export interface ArticleMeta {
  /** URL slug，如 "install-guide"（同时也是 .md 文件名） */
  slug: string
  /** 展示标题（同时作为 OG/SEO 标题） */
  title: string
  /** 卡片/列表用副标题 */
  summary: string
  /** emoji 图标 */
  icon: string
  /** 分类标签 */
  tag: string
  /** 列表排序权重（越小越靠前） */
  order: number
}

export interface Article extends ArticleMeta {
  /** markdown 原文 */
  content: string
}

interface ManifestEntry {
  slug: string
  title: string
  summary: string
  icon: string
  tag: string
  source: string
}

const ARTICLES_DIR = path.join(process.cwd(), 'src', 'content', 'articles')
const MANIFEST_PATH = path.join(ARTICLES_DIR, 'manifest.json')

/** 读取 manifest.json，按数组顺序赋 order（0-based）。 */
function loadManifest(): ArticleMeta[] {
  const raw = fs.readFileSync(MANIFEST_PATH, 'utf8')
  const entries: ManifestEntry[] = JSON.parse(raw)
  return entries.map((e, i) => ({
    slug: e.slug,
    title: e.title,
    summary: e.summary,
    icon: e.icon,
    tag: e.tag,
    order: i,
  }))
}

// 模块级缓存：构建期只解析一次 manifest
const ALL_METAS = loadManifest()
const META_BY_SLUG = new Map(ALL_METAS.map((m) => [m.slug, m]))

function readRaw(slug: string): string {
  const file = path.join(ARTICLES_DIR, `${slug}.md`)
  return fs.readFileSync(file, 'utf8')
}

/** 所有文章 slug（manifest 顺序） */
export function getArticleSlugs(): string[] {
  return ALL_METAS.map((m) => m.slug)
}

/** 获取单篇文章（含 markdown 原文）。slug 不存在时返回 null。 */
export function getArticle(slug: string): Article | null {
  const meta = META_BY_SLUG.get(slug)
  if (!meta) return null
  return { ...meta, content: readRaw(slug) }
}

/** 获取所有文章的元信息（不含正文），按 order 升序。用于列表页。 */
export function getAllArticleMetas(): ArticleMeta[] {
  return [...ALL_METAS].sort((a, b) => a.order - b.order)
}
