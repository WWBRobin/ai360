'use client'

/**
 * Skill 表单（管理后台）。
 *
 * 字段：名称/描述/平台/分类/场景/安装链接/试用配置。
 * 用 React 19 的 useActionState 调 Server Action，避免手写 fetch。
 */

import { useActionState } from 'react'
import type { Platform, Scenario } from '@/types'
import {
  createSkill,
  updateSkill,
  type SkillFormInput,
} from '@/app/admin/actions'

interface Props {
  platforms: Platform[]
  scenarios: Scenario[]
  // 编辑模式传入
  initial?: Partial<SkillFormInput> & { id?: number }
  initialScenarioIds?: number[]
}

const EMPTY: SkillFormInput = {
  name: '',
  slug: '',
  tagline: '',
  description: '',
  category: 'scene',
  platform_id: '',
  install_url: '',
  icon_url: '',
  developer_name: '',
  version: '',
  status: 'published',
  trial_enabled: false,
  trial_config: '',
  scenario_ids: [],
}

export default function SkillForm({
  platforms,
  scenarios,
  initial,
  initialScenarioIds,
}: Props) {
  const isEdit = !!initial?.id

  // Server Action 签名：(prevState, formData) => result
  const action = isEdit
    ? async (_prev: unknown, formData: FormData) =>
        updateSkill(initial!.id!, collectForm(formData, scenarios))
    : async (_prev: unknown, formData: FormData) =>
        createSkill(collectForm(formData, scenarios))

  const [state, formAction, pending] = useActionState<
    unknown,
    FormData
  >(action, null)
  const error = (state as null | { error?: string })?.error

  const value = (name: keyof SkillFormInput): string => {
    const v = initial?.[name]
    if (v === undefined || v === null) return ''
    if (Array.isArray(v)) return ''
    if (typeof v === 'boolean') return ''
    return String(v)
  }

  return (
    <form action={formAction} className="space-y-5 max-w-2xl">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
          ❌ {error}
        </div>
      )}

      <Field label="名称 *">
        <input
          name="name"
          defaultValue={value('name')}
          required
          className={inputCls}
        />
      </Field>

      <Field label="Slug *（URL 标识，英文短横线）">
        <input
          name="slug"
          defaultValue={value('slug')}
          required
          placeholder="tavily-search"
          className={inputCls}
        />
      </Field>

      <Field label="一句话标语（tagline）">
        <input name="tagline" defaultValue={value('tagline')} className={inputCls} />
      </Field>

      <Field label="详细描述">
        <textarea
          name="description"
          defaultValue={value('description')}
          rows={4}
          className={inputCls}
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="分类">
          <select
            name="category"
            defaultValue={value('category')}
            className={inputCls}
          >
            <option value="infrastructure">基础设施增强</option>
            <option value="scene">场景应用</option>
            <option value="efficiency">效率工具</option>
          </select>
        </Field>

        <Field label="平台">
          <select
            name="platform_id"
            defaultValue={value('platform_id')}
            className={inputCls}
          >
            <option value="">（未选择）</option>
            {platforms.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}（{p.slug}）
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="安装链接 *（install_url）">
        <input
          name="install_url"
          defaultValue={value('install_url')}
          required
          className={inputCls}
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="开发者">
          <input
            name="developer_name"
            defaultValue={value('developer_name')}
            className={inputCls}
          />
        </Field>
        <Field label="版本">
          <input name="version" defaultValue={value('version')} className={inputCls} />
        </Field>
      </div>

      <Field label="图标 URL">
        <input name="icon_url" defaultValue={value('icon_url')} className={inputCls} />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="状态">
          <select name="status" defaultValue={value('status')} className={inputCls}>
            <option value="published">已发布</option>
            <option value="draft">草稿</option>
            <option value="archived">已下架</option>
          </select>
        </Field>
        <Field label="支持试用">
          <label className="flex items-center gap-2 h-9 text-sm">
            <input
              type="checkbox"
              name="trial_enabled"
              value="true"
              defaultChecked={!!initial?.trial_enabled}
              className="w-4 h-4"
            />
            开启中转试用
          </label>
        </Field>
      </div>

      <Field label="试用配置（trial_config，JSON）">
        <textarea
          name="trial_config"
          defaultValue={value('trial_config')}
          rows={3}
          placeholder='{"provider":"coze","bot_id":"xxx"}'
          className={`${inputCls} font-mono text-xs`}
        />
      </Field>

      {/* 场景多选 */}
      <Field label="所属场景（可多选）">
        <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
          {scenarios.map((s) => (
            <label key={s.id} className="flex items-center gap-1.5 text-sm">
              <input
                type="checkbox"
                name="scenario_ids"
                value={s.id}
                defaultChecked={initialScenarioIds?.includes(s.id)}
                className="w-3.5 h-3.5"
              />
              <span className="truncate">{s.icon} {s.name}</span>
            </label>
          ))}
        </div>
      </Field>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
        >
          {pending ? '保存中…' : isEdit ? '保存修改' : '创建 Skill'}
        </button>
        <a
          href="/admin"
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
        >
          取消
        </a>
      </div>
    </form>
  )
}

// ===== 从 FormData 收集成 SkillFormInput =====
function collectForm(
  formData: FormData,
  scenarios: Scenario[],
): SkillFormInput {
  return {
    name: String(formData.get('name') || ''),
    slug: String(formData.get('slug') || ''),
    tagline: String(formData.get('tagline') || ''),
    description: String(formData.get('description') || ''),
    category: (formData.get('category') as SkillFormInput['category']) || 'scene',
    platform_id:
      formData.get('platform_id') === ''
        ? ''
        : Number(formData.get('platform_id')),
    install_url: String(formData.get('install_url') || ''),
    icon_url: String(formData.get('icon_url') || ''),
    developer_name: String(formData.get('developer_name') || ''),
    version: String(formData.get('version') || ''),
    status: (formData.get('status') as SkillFormInput['status']) || 'published',
    trial_enabled: formData.get('trial_enabled') === 'true',
    trial_config: String(formData.get('trial_config') || ''),
    scenario_ids: formData.getAll('scenario_ids').map(Number),
  }
}

// ===== UI 小部件 =====
const inputCls =
  'w-full px-3 py-2 text-sm bg-[var(--card)] border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400'

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1.5">
        {label}
      </label>
      {children}
    </div>
  )
}
