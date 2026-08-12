import Link from 'next/link'
import type { SkillCard } from '@/types'
import { CATEGORY_LABELS, CATEGORY_ICONS, scoreToStars } from '@/lib/supabase'

export default function SkillCardComponent({ skill }: { skill: SkillCard }) {
  return (
    <Link href={`/skill/${skill.slug}`} className="block">
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-indigo-300 transition-all duration-200 group">
        <div className="p-5">
          {/* 标签行 */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded ${
                skill.category === 'infra' ? 'bg-blue-100 text-blue-600' :
                skill.category === 'scene' ? 'bg-indigo-100 text-indigo-600' :
                'bg-amber-100 text-amber-600'
              }`}>
                {CATEGORY_ICONS[skill.category]} {CATEGORY_LABELS[skill.category]}
              </span>
              <span className="text-xs text-gray-400">{skill.platform_name}</span>
            </div>
            {skill.overall_score && (
              <span className={`text-xs font-medium ${
                skill.overall_score >= 4 ? 'text-green-500' :
                skill.overall_score >= 3 ? 'text-amber-500' :
                'text-gray-400'
              }`}>
                ⭐ {skill.overall_score.toFixed(1)}
              </span>
            )}
          </div>

          {/* 标题 + 描述 */}
          <h3 className="font-bold text-gray-900 mb-1 group-hover:text-indigo-600 transition">
            {skill.name}
          </h3>
          <p className="text-sm text-gray-500 mb-3 line-clamp-2">{skill.tagline}</p>

          {/* 评测摘要 */}
          {skill.difficulty_score && (
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span>上手 {skill.difficulty_score}/5</span>
              {skill.stability_score && <span>稳定 {skill.stability_score}/5</span>}
              {skill.free_quota && <span className="truncate max-w-[100px]">{skill.free_quota}</span>}
            </div>
          )}
        </div>

        {/* 底部操作 */}
        <div className="border-t border-gray-100 px-5 py-3 flex items-center justify-between bg-gray-50/50">
          <span className="text-xs text-indigo-600 font-medium group-hover:underline">
            查看评测 →
          </span>
          {skill.trial_enabled ? (
            <span className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg font-medium">
              免费试用
            </span>
          ) : (
            <span className="text-xs bg-gray-100 text-gray-500 px-3 py-1 rounded-lg font-medium">
              去安装
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
