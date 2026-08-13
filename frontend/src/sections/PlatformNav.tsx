import Link from 'next/link'
import { getPlatforms } from '@/lib/supabase'

export default async function PlatformNav() {
  const platforms = await getPlatforms().catch(() => [])
  return (
    <section className="max-w-7xl mx-auto px-4 pb-12">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">📍 按平台浏览</h2>
        <p className="text-gray-400 text-sm mt-1">你在用哪个平台？看该平台下的推荐</p>
      </div>
      <div className="flex flex-wrap gap-2.5">
        {platforms.filter(p => p.skill_count > 0).map(platform => (
          <Link key={platform.slug} href={`/platform/${platform.slug}`}
            className="platform-tag flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-4 py-2.5">
            <span className="text-sm font-medium text-gray-600">{platform.name}</span>
            <span className="text-xs bg-indigo-50 text-indigo-500 px-1.5 py-0.5 rounded-md font-medium">{platform.skill_count}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
