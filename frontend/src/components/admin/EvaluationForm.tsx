'use client'

/**
 * 评测数据表单（5 问框架）。
 *
 * Q1 解决什么场景（scenario_summary）
 * Q2 上手难度（difficulty_score 1-5 + notes）
 * Q3 稳定性（stability_score 1-5 + notes）
 * Q4 免费额度（free_quota + free_quota_score 1-5）
 * Q5 Token 成本（token_cost + token_efficiency_score 1-5）
 * 综合分 overall_score 可留空 → 按 0.2/0.4/0.2/0.2 自动计算
 *
 * 用 React 19 useActionState 调 upsertEvaluation。
 */

import { useActionState } from 'react'
import { upsertEvaluation, type EvaluationFormInput } from '@/app/admin/actions'

interface Props {
  skillId: number
  skillName: string
  initial?: Partial<EvaluationFormInput>
}

export default function EvaluationForm({ skillId, skillName, initial }: Props) {
  const action = async (_prev: unknown, formData: FormData) =>
    upsertEvaluation(collectForm(formData, skillId))

  const [state, formAction, pending] = useActionState<
    unknown,
    FormData
  >(action, null)
  const error = (state as null | { error?: string })?.error

  const val = (k: keyof EvaluationFormInput): string => {
    const v = initial?.[k]
    return v === undefined || v === null ? '' : String(v)
  }

  return (
    <form action={formAction} className="space-y-5 max-w-2xl">
      <div className="text-sm text-gray-500">
        为 <span className="font-medium text-gray-700">{skillName}</span> 录入 / 更新评测
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
          ❌ {error}
        </div>
      )}

      {/* Q1 场景 */}
      <Field label="Q1 · 解决什么场景（scenario_summary）">
        <textarea
          name="scenario_summary"
          defaultValue={val('scenario_summary')}
          rows={2}
          className={inputCls}
        />
      </Field>

      {/* Q2 上手难度 */}
      <div className="grid grid-cols-3 gap-4">
        <Field label="Q2 · 上手难度（1-5）">
          <ScoreSelect name="difficulty_score" defaultValue={val('difficulty_score')} />
        </Field>
        <div className="col-span-2">
          <Field label="上手难度 · 备注">
            <input
              name="difficulty_notes"
              defaultValue={val('difficulty_notes')}
              className={inputCls}
            />
          </Field>
        </div>
      </div>

      {/* Q3 稳定性 */}
      <div className="grid grid-cols-3 gap-4">
        <Field label="Q3 · 稳定性（1-5）">
          <ScoreSelect name="stability_score" defaultValue={val('stability_score')} />
        </Field>
        <div className="col-span-2">
          <Field label="稳定性 · 备注">
            <input
              name="stability_notes"
              defaultValue={val('stability_notes')}
              className={inputCls}
            />
          </Field>
        </div>
      </div>

      {/* Q4 免费额度 */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <Field label="Q4 · 免费额度（文本）">
            <input
              name="free_quota"
              defaultValue={val('free_quota')}
              placeholder="如 1000 credits/月、$5/月"
              className={inputCls}
            />
          </Field>
        </div>
        <Field label="免费额度评分（1-5）">
          <ScoreSelect name="free_quota_score" defaultValue={val('free_quota_score')} />
        </Field>
      </div>

      {/* Q5 Token 成本 */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <Field label="Q5 · Token 成本（文本）">
            <input
              name="token_cost"
              defaultValue={val('token_cost')}
              placeholder="如 约 ¥4/M tokens、低/中/高"
              className={inputCls}
            />
          </Field>
        </div>
        <Field label="Token 效率评分（1-5）">
          <ScoreSelect
            name="token_efficiency_score"
            defaultValue={val('token_efficiency_score')}
          />
        </Field>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Field label="综合分（留空自动算）">
          <input
            name="overall_score"
            defaultValue={val('overall_score')}
            type="number"
            step="0.1"
            min="0"
            max="5"
            className={inputCls}
          />
        </Field>
        <Field label="评测方式">
          <select
            name="evaluation_method"
            defaultValue={val('evaluation_method') || 'ai_first'}
            className={inputCls}
          >
            <option value="ai_first">AI 优先（ai_first）</option>
            <option value="manual">人工（manual）</option>
          </select>
        </Field>
        <Field label="评测时版本">
          <input
            name="version_at_eval"
            defaultValue={val('version_at_eval')}
            className={inputCls}
          />
        </Field>
      </div>

      <Field label="评测人">
        <input
          name="evaluated_by"
          defaultValue={val('evaluated_by') || '管理员'}
          className={inputCls}
        />
      </Field>

      <Field label="测试用例（JSON 字符串）">
        <textarea
          name="test_cases"
          defaultValue={val('test_cases')}
          rows={3}
          placeholder='[{"case":"用例","result":"结果"}]'
          className={`${inputCls} font-mono text-xs`}
        />
      </Field>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
        >
          {pending ? '保存中…' : '保存评测'}
        </button>
        <a href="/admin" className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">
          取消
        </a>
      </div>
    </form>
  )
}

// ===== 工具 =====

function collectForm(formData: FormData, skillId: number): EvaluationFormInput {
  const numOrEmpty = (k: string): number | '' => {
    const v = formData.get(k)
    return v === '' || v === null ? '' : Number(v)
  }
  return {
    skill_id: skillId,
    scenario_summary: String(formData.get('scenario_summary') || ''),
    difficulty_score: numOrEmpty('difficulty_score'),
    difficulty_notes: String(formData.get('difficulty_notes') || ''),
    stability_score: numOrEmpty('stability_score'),
    stability_notes: String(formData.get('stability_notes') || ''),
    free_quota: String(formData.get('free_quota') || ''),
    free_quota_score: numOrEmpty('free_quota_score'),
    token_cost: String(formData.get('token_cost') || ''),
    token_efficiency_score: numOrEmpty('token_efficiency_score'),
    overall_score: numOrEmpty('overall_score'),
    evaluated_by: String(formData.get('evaluated_by') || ''),
    evaluation_method: (formData.get('evaluation_method') as 'ai_first' | 'manual') || 'ai_first',
    test_cases: String(formData.get('test_cases') || ''),
    version_at_eval: String(formData.get('version_at_eval') || ''),
  }
}

const inputCls =
  'w-full px-3 py-2 text-sm bg-[var(--card)] border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400'

function ScoreSelect({
  name,
  defaultValue,
}: {
  name: string
  defaultValue: string
}) {
  return (
    <select name={name} defaultValue={defaultValue} className={inputCls}>
      <option value="">未评</option>
      {[1, 2, 3, 4, 5].map((n) => (
        <option key={n} value={n}>
          {n}
        </option>
      ))}
    </select>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>
      {children}
    </div>
  )
}
