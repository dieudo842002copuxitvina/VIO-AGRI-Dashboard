'use client'

import { UserProfile } from '@/components/admin/types'

interface Props {
  users: UserProfile[]
  selectedUserId: string | null
  onChange: (userId: string) => void
  disabled: boolean
}

export function UserSelector({ users, selectedUserId, onChange, disabled }: Props) {
  return (
    <select
      value={selectedUserId || ''}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled || users.length === 0}
      className="p-2 border rounded-md bg-white shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
    >
      {users.length === 0 && <option>Loading users...</option>}
      {users.map((user) => (
        <option key={user.user_id} value={user.user_id}>
          {user.user_id} ({user.role})
        </option>
      ))}
    </select>
  )
}