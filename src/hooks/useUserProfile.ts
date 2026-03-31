import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

import type { UserProfile, Role } from '@/types/auth'
import { useAuth } from './useAuth'

'use client'

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const fetchProfile = async () => {
    if (!user) {
      setProfile(null)
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error) {
      setError(error.message)
    } else {
      setProfile(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchProfile()
  }, [user])

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return null

    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error
    setProfile(data)
    return data
  }

  const updateRole = async (role: Role) => {
    return updateProfile({ role })
  }

  return {
    profile,
    loading,
    error,
    refetch: fetchProfile,
    updateProfile,
    updateRole,
  }
}
