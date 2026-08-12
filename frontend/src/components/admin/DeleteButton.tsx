'use client'

/**
 * 删除按钮（客户端，调 deleteSkill Server Action）。
 * 带二次确认。
 */

import { useTransition } from 'react'
import { deleteSkill } from '@/app/admin/actions'

export default function DeleteButton({
  id,
  name,
}: {
  id: number
  name: string
}) {
  const [pending, startTransition] = useTransition()

  const onClick = () => {
    if (!window.confirm(`确定删除「${name}」？此操作不可恢复。`)) return
    const fd = new FormData()
    fd.set('id', String(id))
    startTransition(() => {
      deleteSkill(fd)
    })
  }

  return (
    <button
      onClick={onClick}
      disabled={pending}
      className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
    >
      {pending ? '删除中…' : '删除'}
    </button>
  )
}
