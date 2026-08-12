export default function Loading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center">
        {/* 骨架屏：模拟内容卡片加载 */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <span className="sr-only">加载中</span>
          <span className="w-3 h-3 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
          <span className="w-3 h-3 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
          <span className="w-3 h-3 bg-indigo-400 rounded-full animate-bounce" />
        </div>

        {/* 卡片骨架 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto" aria-hidden>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-gray-200 p-5 animate-pulse"
            >
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
    </div>
  )
}
