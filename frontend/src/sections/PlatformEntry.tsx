import Link from 'next/link'
import { getPlatforms } from '@/lib/supabase'

/**
 * 平台入口区 - 首屏核心
 * 用户心智："我用了XX平台，该装什么？"
 */

const PLATFORM_META: Record<string, { icon: string; shortName: string; color: string }> = {
  coze:          { icon: '🤖', shortName: '扣子',     color: '#fef3c7' },
  gpts:          { icon: '💬', shortName: 'GPTs',     color: '#dcfce7' },
  claude:        { icon: '🧠', shortName: 'Claude',   color: '#fce7f3' },
  'claude-code': { icon: '⚡', shortName: 'Claude Code', color: '#fce7f3' },
  hermes:        { icon: '🔧', shortName: 'Hermes',   color: '#e0e7ff' },
  openclaw:      { icon: '🦅', shortName: 'OpenClaw', color: '#fef2f2' },
  mcp:           { icon: '🔌', shortName: 'MCP',      color: '#f3e8ff' },
  dify:          { icon: '🏗️', shortName: 'Dify',     color: '#e0f2fe' },
  codex:         { icon: '📦', shortName: 'Codex',    color: '#f1f5f9' },
  qwen:          { icon: '🌟', shortName: '千问',     color: '#fffbeb' },
  ernie:         { icon: '🐼', shortName: '文心',     color: '#f0fdf4' },
  lobechat:      { icon: '💬', shortName: 'LobeChat', color: '#ecfdf5' },
  workbuddy:     { icon: '💼', shortName: 'WorkBuddy',color: '#fef3c7' },
  n8n:           { icon: '🔄', shortName: 'n8n',      color: '#fee2e2' },
  poe:           { icon: '📱', shortName: 'Poe',      color: '#f3e8ff' },
  flowise:       { icon: '⚡', shortName: 'Flowise',  color: '#e0e7ff' },
  agensi:        { icon: '🎯', shortName: 'Agensi',   color: '#fce7f3' },
  saas:          { icon: '☁️', shortName: 'SaaS',     color: '#f0f9ff' },
  sdk:           { icon: '🛠️', shortName: 'SDK',      color: '#f5f5f4' },
}

export default async function PlatformEntry() {
  const platforms = await getPlatforms().catch(() => [])
  
  const main = platforms.filter(p => p.skill_count >= 4).sort((a, b) => b.skill_count - a.skill_count)
  const minor = platforms.filter(p => p.skill_count > 0 && p.skill_count < 4).sort((a, b) => b.skill_count - a.skill_count)

  return (
    <section className="bg-white py-8 md:py-12 border-b border-gray-100">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">你用哪个平台？</h2>
          <p className="text-gray-400 text-sm">选你的平台，看该装什么</p>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5">
          {main.map(p => {
            const meta = PLATFORM_META[p.slug] || { icon: '🔹', shortName: p.name, color: '#f8fafc' }
            return (
              <Link
                key={p.slug}
                href={`/platform/${p.slug}`}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-gray-100 hover:border-indigo-200 hover:shadow-sm transition-all group"
                style={{ backgroundColor: meta.color }}
              >
                <span className="text-2xl">{meta.icon}</span>
                <span className="text-xs font-medium text-gray-700 group-hover:text-indigo-600">{meta.shortName}</span>
                <span className="text-[10px] text-gray-400">{p.skill_count}个</span>
              </Link>
            )
          })}
        </div>

        {minor.length > 0 && (
          <details className="mt-3 text-center">
            <summary className="text-xs text-gray-400 cursor-pointer hover:text-indigo-500">
              更多平台（{minor.length}个）
            </summary>
            <div className="flex flex-wrap justify-center gap-2 mt-3">
              {minor.map(p => (
                <Link key={p.slug} href={`/platform/${p.slug}`}
                  className="text-xs text-gray-500 hover:text-indigo-500 px-2 py-1">
                  {p.name}（{p.skill_count}）
                </Link>
              ))}
            </div>
          </details>
        )}
      </div>
    </section>
  )
}
