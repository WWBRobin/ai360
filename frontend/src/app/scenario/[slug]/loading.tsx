export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* 标题骨架 */}
      <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2" />
      <div className="h-4 w-72 bg-gray-100 rounded animate-pulse mb-2" />
      <div className="h-4 w-32 bg-gray-100 rounded animate-pulse mb-8" />

      {/* 筛选栏骨架 */}
      <div className="flex gap-2 mb-8">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-9 w-20 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>

      {/* 卡片网格骨架 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-[var(--card)] rounded-2xl border border-gray-200 p-5 animate-pulse">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-5 w-16 bg-gray-200 rounded" />
              <div className="h-5 w-12 bg-gray-200 rounded" />
            </div>
            <div className="h-5 w-3/4 bg-gray-200 rounded mb-2" />
            <div className="h-4 w-full bg-gray-100 rounded mb-1" />
            <div className="h-4 w-2/3 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
