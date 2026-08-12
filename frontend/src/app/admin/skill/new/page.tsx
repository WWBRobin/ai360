import SkillForm from '@/components/admin/SkillForm'
import { supabase } from '@/lib/supabase'

export const metadata = {
  title: '添加 Skill',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function NewSkillPage() {
  const { data: platforms } = await supabase
    .from('platforms')
    .select('id, name, slug, description, base_url, api_supported, skill_count, logo_url, sort_order')
    .order('sort_order')

  const { data: scenarios } = await supabase
    .from('scenarios')
    .select('id, name, slug, icon, parent_id, sort_order')
    .order('sort_order')

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <a href="/admin" className="text-sm text-gray-500 hover:text-gray-800">
          ← 返回列表
        </a>
        <h1 className="text-2xl font-bold mt-2">添加 Skill</h1>
      </div>
      <SkillForm platforms={platforms || []} scenarios={scenarios || []} />
    </div>
  )
}
