import Link from 'next/link';
import { isSupabaseConfigured } from './lib/supabase';
import { fetchSkillCards } from './lib/site';

export const dynamic = 'force-dynamic';

// 首页四大入口：搜索 / 场景标签 / 平台导航 / 推荐发现（场景与平台入口 MVP 阶段由 site_config 配置化，这里先静态渲染）
const SCENARIO_TAGS = [
  { name: '做电商文案', slug: 'ecommerce-copy' },
  { name: '做PPT', slug: 'ppt' },
  { name: '做短视频', slug: 'short-video' },
  { name: '写代码', slug: 'coding' },
  { name: '数据分析', slug: 'data-analysis' },
  { name: '做海报', slug: 'poster' },
  { name: '客服Bot', slug: 'customer-service-bot' },
  { name: '写周报', slug: 'weekly-report' },
];

const CATEGORY_LABELS: Record<string, string> = {
  infrastructure: '🛡️ 基础设施增强',
  scene: '🎯 场景应用',
  efficiency: '⚡ 效率工具',
};

export default async function HomePage() {
  const skills = await fetchSkillCards();

  return (
    <div className="space-y-10">
      {/* 入口1：搜索 */}
      <section className="rounded-container bg-white p-6 shadow-sm">
        <form action="/search" className="flex gap-2">
          <input
            name="q"
            type="search"
            placeholder="🔍 搜索 Skill 名 / 场景 / 平台 ..."
            className="flex-1 rounded-btn border border-gray-300 px-4 py-2 text-sm outline-none focus:border-primary"
          />
          <button type="submit" className="button-primary">搜索</button>
        </form>
      </section>

      {/* 入口2：场景标签 */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">你想用 AI 做什么？</h2>
        <div className="flex flex-wrap gap-2">
          {SCENARIO_TAGS.map((tag) => (
            <Link
              key={tag.slug}
              href={`/search?scenario=${tag.slug}`}
              className="rounded-full border border-gray-200 bg-white px-4 py-1.5 text-sm text-gray-700 hover:border-primary hover:text-primary"
            >
              {tag.name}
            </Link>
          ))}
        </div>
      </section>

      {/* 入口3：平台导航 */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">你在用哪个平台？</h2>
        <div className="flex flex-wrap gap-2">
          {['扣子Coze', 'GPTs', 'Claude', 'Dify', 'Hermes', '千问', '文心', 'Codex', 'WorkBuddy', 'LobeChat'].map((platform) => (
            <Link
              key={platform}
              href="/search?platform=all"
              className="rounded-full border border-gray-200 bg-white px-4 py-1.5 text-sm text-gray-700 hover:border-primary hover:text-primary"
            >
              {platform}
            </Link>
          ))}
        </div>
      </section>

      {/* 入口4：推荐发现 */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">📋 最新评测</h2>
        {!isSupabaseConfigured && (
          <div className="rounded-card border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            未配置 Supabase 环境变量（NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY），
            数据无法加载。请先执行 database/init.sql 并复制 .env.example → .env.local。
          </div>
        )}
        {isSupabaseConfigured && skills.length === 0 && (
          <div className="rounded-card border border-gray-200 bg-white p-4 text-sm text-gray-500">
            暂无已发布 Skill。请确认已执行 database/init.sql（含示例数据）。
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {skills.map((skill) => (
            <Link
              key={skill.id}
              href={`/skills/${skill.slug}`}
              className="rounded-card border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-1 flex items-center justify-between text-xs text-gray-400">
                <span>{skill.platform_name}</span>
                <span>{skill.category ? CATEGORY_LABELS[skill.category] : ''}</span>
              </div>
              <h3 className="font-semibold text-gray-900">{skill.name}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-gray-600">{skill.tagline}</p>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="font-medium text-amber-600">
                  {skill.overall_score !== null ? `⭐ ${skill.overall_score}/5` : '待评测'}
                </span>
                {skill.trial_enabled ? (
                  <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs text-green-700">免费试用</span>
                ) : (
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">去安装</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
