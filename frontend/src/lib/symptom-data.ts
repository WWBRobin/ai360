import entriesData from '../data/symptom-entries.json'

/**
 * 问诊百科数据层（/ask）
 * 数据源：src/data/symptom-entries.json（首批 15 条 SymptomEntry，Phase2 再入库）
 * 纪律：本地静态匹配，无 DB 依赖；加载失败降级为空数组（对齐 src/lib/supabase.ts 的 try-catch 降级）。
 */

export interface SymptomCause {
  type: string
  desc: string
  ratio: string
}

export interface SymptomSolution {
  step: string
  exit: string
  ref: string
}

export interface SymptomEntry {
  id: string
  symptom: string
  aliases: string[]
  causes: SymptomCause[]
  solutions: SymptomSolution[]
  prevention: string
  evidence: string
  status: string
  estimated: boolean
  body: string
}

interface SymptomBundle {
  meta: Record<string, unknown>
  entries: SymptomEntry[]
}

const bundle = entriesData as unknown as SymptomBundle

/** 加载全部条目（JSON 静态引用，不抛错——最坏返回空数组，页面渲染空状态指向 /install） */
export function getAllEntries(): SymptomEntry[] {
  try {
    return Array.isArray(bundle?.entries) ? bundle.entries : []
  } catch {
    return []
  }
}

/** 本地检索：query 匹配 symptom 或 aliases（子串、大小写不敏感；空查询返回全部） */
export function searchSymptoms(entries: SymptomEntry[], query: string): SymptomEntry[] {
  const q = query.trim().toLowerCase()
  if (!q) return entries
  return entries.filter(
    (e) =>
      e.symptom.toLowerCase().includes(q) ||
      e.aliases.some((a) => a.toLowerCase().includes(q)),
  )
}

/** 症状聚类分类（chips：全部/不听话/不诚实/失忆/装不上/费用安全） */
export const SYMPTOM_CATEGORIES = [
  '全部',
  '不听话',
  '不诚实',
  '失忆',
  '装不上',
  '费用安全',
] as const

export type SymptomCategory = (typeof SYMPTOM_CATEGORIES)[number]

/** 条目 → 分类（按症状主题聚类，覆盖 15 条） */
const CATEGORY_BY_ID: Record<string, SymptomCategory> = {
  'sym-001': '不诚实', // 编造事实
  'sym-002': '失忆', // 老忘记
  'sym-003': '不听话', // 不听话
  'sym-004': '装不上', // 安装失败
  'sym-005': '费用安全', // key 泄露
  'sym-006': '费用安全', // 429 限流（配额）
  'sym-007': '费用安全', // token 烧钱
  'sym-008': '装不上', // 切模型后错误 key（配置类）
  'sym-009': '不诚实', // 静默降级偷偷换模型
  'sym-010': '装不上', // voice id 不存在（配置/工具缺陷）
  'sym-011': '不听话', // 豆包不好用（实为不会用）
  'sym-012': '不听话', // 答非所问
  'sym-013': '费用安全', // 搜索配额耗尽
  'sym-014': '装不上', // 推送后生产没更新（部署类）
  'sym-015': '费用安全', // 数据库 42501 权限
}

export function entryCategory(e: SymptomEntry): SymptomCategory {
  return CATEGORY_BY_ID[e.id] ?? '不听话'
}

/** solutions 的 exit 链接映射（与 JSON meta.exit_ref_source 对齐）：
 *  装机单→/install  灯盏→/learn/star/{ref}  横评→/guide/{ref}  对比卡→/compare?slugs={ref}
 *  百科自链→/ask/{ref}（Phase2 补详情路由）→ 暂返回 null，渲染纯文字不渲染链接 */
export function exitHref(exit: string, ref: string): string | null {
  switch (exit) {
    case '装机单':
      return '/install'
    case '灯盏':
      return `/learn/star/${ref}`
    case '横评':
      return `/guide/${ref}`
    case '对比卡':
      return `/compare?slugs=${ref}`
    case '百科自链':
      return null
    default:
      return null
  }
}

/** 出口类型的中文短标签（链接文字用） */
export const EXIT_LABEL: Record<string, string> = {
  装机单: '装机单',
  灯盏: '灯盏',
  横评: '横评',
  对比卡: '对比卡',
  百科自链: '自查',
}
