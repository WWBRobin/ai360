/**
 * 相关文章匹配：根据 Skill 信息推荐站内文章
 *
 * 文章源：src/content/articles/*.md，元信息由 manifest.json 维护。
 * 匹配策略（按优先级）：
 *   1. 文章 manifest tag 与 Skill 场景/分类关键词直接命中
 *   2. 文章标题/摘要包含 Skill 名称或平台名
 *   3. 兜底：返回通用热门文章
 *
 * 全部基于本地 manifest，无额外网络请求，构建期即可完成。
 */
import { getAllArticleMetas, type ArticleMeta } from '@/lib/articles'

export interface SkillRef {
  name: string
  slug: string
  category: string
  platform_name?: string
  platform_slug?: string
  scenario_slugs?: string[]
  tagline?: string | null
  description?: string | null
}

/** Skill 分类/场景 -> 推荐文章 tag 的关键词映射 */
const CATEGORY_TAG_MAP: Record<string, string[]> = {
  infrastructure: ['装机必备', '联网搜索', '记忆增强', '开发者'],
  scene: ['场景实战', '教程', '电商文案'],
  efficiency: ['效率提升', '工具盘点', 'AI编程'],
}

/** 平台 slug -> 推荐文章 tag 关键词 */
const PLATFORM_TAG_MAP: Record<string, string[]> = {
  claude: ['AI编程', '开发者', '教程'],
  codex: ['AI编程', '开发者'],
  cursor: ['AI编程', '开发者'],
  coze: ['教程', '场景实战'],
  dify: ['开发者', '教程'],
  gpts: ['教程', '工具盘点'],
}

/** 场景 slug -> 文章 tag 关键词 */
const SCENARIO_TAG_MAP: Record<string, string[]> = {
  memory: ['记忆增强'],
  search: ['联网搜索'],
  code: ['AI编程', '开发者'],
  'content-creation': ['场景实战', '电商文案'],
  ecommerce: ['电商文案'],
  'data-analysis': ['效率提升'],
  office: ['效率提升', '场景实战'],
  research: ['方法论'],
  education: ['教育'],
  hr: ['行业应用'],
  legal: ['行业应用'],
  security: ['AI安全'],
  'token-saving': ['AI成本'],
  finance: ['行业应用'],
}

/** 把 Skill 信息汇总成一串关键词用于模糊匹配标题/摘要 */
function buildKeywordSet(skill: SkillRef): Set<string> {
  const kw = new Set<string>()
  if (skill.name) {
    kw.add(skill.name.toLowerCase())
    // 中文场景：把名称里的英文部分也加入
    skill.name
      .toLowerCase()
      .split(/[\s/—\-·]+/)
      .filter((w) => w.length >= 3)
      .forEach((w) => kw.add(w))
  }
  if (skill.platform_name) kw.add(skill.platform_name.toLowerCase())
  if (skill.tagline) {
    skill.tagline
      .toLowerCase()
      .split(/[\s,，。、；;]+/)
      .filter((w) => w.length >= 3)
      .forEach((w) => kw.add(w))
  }
  return kw
}

/** 文章标题/摘要里是否命中任意关键词 */
function articleMatchesKeywords(a: ArticleMeta, keywords: Set<string>): boolean {
  const hay = `${a.title} ${a.summary}`.toLowerCase()
  for (const k of keywords) {
    if (k.length >= 3 && hay.includes(k)) return true
  }
  return false
}

/**
 * 取相关文章（最多 limit 篇，默认 4）。
 * 排除 slug 等于 excludeSlug 的文章。
 */
export function getRelatedArticles(
  skill: SkillRef,
  limit = 4,
  excludeSlug?: string
): ArticleMeta[] {
  const all = getAllArticleMetas()

  // 收集候选 tag
  const wantedTags = new Set<string>()
  ;(CATEGORY_TAG_MAP[skill.category] || []).forEach((t) => wantedTags.add(t))
  if (skill.platform_slug && PLATFORM_TAG_MAP[skill.platform_slug]) {
    PLATFORM_TAG_MAP[skill.platform_slug].forEach((t) => wantedTags.add(t))
  }
  ;(skill.scenario_slugs || []).forEach((s) => {
    const tags = SCENARIO_TAG_MAP[s]
    if (tags) tags.forEach((t) => wantedTags.add(t))
  })

  const keywords = buildKeywordSet(skill)

  // 计分排序
  type Scored = { meta: ArticleMeta; score: number }
  const scored: Scored[] = all
    .filter((a) => a.slug !== excludeSlug)
    .map((a) => {
      let score = 0
      if (wantedTags.has(a.tag)) score += 3
      if (articleMatchesKeywords(a, keywords)) score += 2
      return { meta: a, score }
    })
    .filter((s) => s.score > 0)
    .sort((x, y) => y.score - x.score)

  if (scored.length > 0) {
    return scored.slice(0, limit).map((s) => s.meta)
  }

  // 兜底：返回通用热门文章（排除当前 skill 的同名文章）
  const fallback = all.filter((a) => a.slug !== excludeSlug)
  // 优先入门/盘点/方法论类
  const priorityTags = ['入门指南', '工具盘点', '方法论', '装机必备']
  const prioritized = fallback.filter((a) => priorityTags.includes(a.tag))
  return (prioritized.length > 0 ? prioritized : fallback).slice(0, limit)
}
