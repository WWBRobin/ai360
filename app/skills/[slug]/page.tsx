import Link from 'next/link';
import { notFound } from 'next/navigation';
import TrialBox from '../../components/trial-box';
import { isSupabaseConfigured } from '../../lib/supabase';
import { fetchSkillDetail } from '../../lib/site';

export const dynamic = 'force-dynamic';

function scoreStars(score: number | null): string {
  if (score === null) return '—';
  const full = Math.round(score);
  return '⭐'.repeat(full) + '☆'.repeat(Math.max(0, 5 - full));
}

export default async function SkillDetailPage({ params }: { params: { slug: string } }) {
  if (!isSupabaseConfigured) notFound();
  const { skill, evaluation, guide } = await fetchSkillDetail(params.slug);
  if (!skill) notFound();

  return (
    <div className="space-y-6">
      {/* 面包屑 + 标题 */}
      <nav className="text-xs text-gray-400">
        <Link href="/" className="hover:text-gray-600">首页</Link>
        <span> &gt; </span>
        <span>{skill.platform_name}</span>
        <span> &gt; </span>
        <span>{skill.name}</span>
      </nav>

      <section className="rounded-card border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{skill.name}</h1>
            {skill.tagline && <p className="mt-1 text-gray-600">{skill.tagline}</p>}
          </div>
          <div className="text-right text-sm">
            <p className="text-lg font-semibold text-amber-600">
              {evaluation?.overall_score !== null && evaluation?.overall_score !== undefined
                ? `⭐ ${evaluation.overall_score}/5`
                : '待评测'}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              {skill.platform_name} · 评测于{' '}
              {evaluation?.evaluated_at ? new Date(evaluation.evaluated_at).toLocaleDateString('zh-CN') : '—'}
            </p>
          </div>
        </div>
        {skill.description && <p className="mt-4 text-sm leading-relaxed text-gray-700">{skill.description}</p>}
      </section>

      {/* 5 问评测 */}
      {evaluation && (
        <section className="rounded-card border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">5 问评测</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex gap-3">
              <dt className="w-24 shrink-0 font-medium text-gray-500">Q1 场景</dt>
              <dd className="text-gray-800">{evaluation.scenario_summary || '—'}</dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-24 shrink-0 font-medium text-gray-500">Q2 上手</dt>
              <dd className="text-gray-800">
                {scoreStars(evaluation.difficulty_score)} {evaluation.difficulty_notes ? `（${evaluation.difficulty_notes}）` : ''}
              </dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-24 shrink-0 font-medium text-gray-500">Q3 稳定</dt>
              <dd className="text-gray-800">
                {scoreStars(evaluation.stability_score)} {evaluation.stability_notes ? `（${evaluation.stability_notes}）` : ''}
              </dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-24 shrink-0 font-medium text-gray-500">Q4 免费额度</dt>
              <dd className="text-gray-800">{evaluation.free_quota || '—'}</dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-24 shrink-0 font-medium text-gray-500">Q5 Token成本</dt>
              <dd className="text-gray-800">{evaluation.token_cost || '—'}</dd>
            </div>
          </dl>
        </section>
      )}

      {/* 直接体验 / 去安装 */}
      <section className="space-y-4">
        {skill.trial_enabled ? (
          <TrialBox skillSlug={skill.slug} placeholder="例如：无线蓝牙耳机 售价199 主打降噪" />
        ) : (
          <a
            href={skill.install_url}
            target="_blank"
            rel="noopener noreferrer"
            className="button-primary inline-block"
          >
            去{skill.platform_name}安装 →
          </a>
        )}
      </section>

      {/* 使用指南 */}
      {guide && (
        <section className="rounded-card border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold">使用指南</h2>
          <div className="prose-sm whitespace-pre-wrap text-sm leading-relaxed text-gray-700">{guide.content}</div>
        </section>
      )}
    </div>
  );
}
