import Link from 'next/link'

interface PaginationProps {
  currentPage: number
  totalPages: number
  basePath: string // e.g. /platform/hermes
  searchParams: Record<string, string | undefined> // 保留其他查询参数（如 sort）
}

/**
 * 服务端分页组件（基于 URL ?page=N）
 * - 保留其他 searchParams（sort 等）
 * - 首页/末页/前后页 + 数字页码
 * - 页码过多时只显示首末 + 当前附近
 */
export default function Pagination({
  currentPage,
  totalPages,
  basePath,
  searchParams = {},
}: PaginationProps) {
  if (totalPages <= 1) return null

  const buildHref = (page: number) => {
    const params = new URLSearchParams()
    Object.entries(searchParams).forEach(([k, v]) => {
      if (v && k !== 'page') params.set(k, v)
    })
    if (page > 1) params.set('page', String(page))
    const qs = params.toString()
    return qs ? `${basePath}?${qs}` : basePath
  }

  // 生成要显示的页码（首页、末页、当前±1，去重排序）
  const pageSet = new Set<number>([1, totalPages, currentPage])
  if (currentPage > 1) pageSet.add(currentPage - 1)
  if (currentPage < totalPages) pageSet.add(currentPage + 1)
  const pages = [...pageSet].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b)

  // 插入省略号标记
  const items: (number | 'ellipsis')[] = []
  for (let i = 0; i < pages.length; i++) {
    items.push(pages[i])
    if (i < pages.length - 1 && pages[i + 1] - pages[i] > 1) {
      items.push('ellipsis')
    }
  }

  const btnBase =
    'inline-flex items-center justify-center min-w-[2.25rem] h-9 px-3 rounded-lg text-sm font-medium transition'
  const btnActive = 'bg-indigo-500 text-white'
  const btnIdle = 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
  const btnDisabled = 'bg-gray-50 text-gray-300 border border-gray-100 cursor-not-allowed'

  return (
    <nav className="flex items-center justify-center gap-1.5 mt-10 mb-4" aria-label="分页">
      {/* 上一页 */}
      {currentPage > 1 ? (
        <Link href={buildHref(currentPage - 1)} className={`${btnBase} ${btnIdle}`} aria-label="上一页">
          ‹
        </Link>
      ) : (
        <span className={`${btnBase} ${btnDisabled}`} aria-disabled>
          ‹
        </span>
      )}

      {/* 页码 */}
      {items.map((item, i) =>
        item === 'ellipsis' ? (
          <span key={`e${i}`} className="px-1 text-gray-400 select-none">
            …
          </span>
        ) : (
          <Link
            key={item}
            href={buildHref(item)}
            className={`${btnBase} ${item === currentPage ? btnActive : btnIdle}`}
            aria-current={item === currentPage ? 'page' : undefined}
          >
            {item}
          </Link>
        )
      )}

      {/* 下一页 */}
      {currentPage < totalPages ? (
        <Link href={buildHref(currentPage + 1)} className={`${btnBase} ${btnIdle}`} aria-label="下一页">
          ›
        </Link>
      ) : (
        <span className={`${btnBase} ${btnDisabled}`} aria-disabled>
          ›
        </span>
      )}
    </nav>
  )
}
