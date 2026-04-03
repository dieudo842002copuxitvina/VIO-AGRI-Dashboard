'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

import type { UserProfile, Role } from '@/types/auth'
import { useAuth } from './useAuth'

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const ensureProfileExists = useCallback(async (): Promise<UserProfile | null> => {
    if (!user) {
      return null
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .upsert(
        [
          {
            user_id: user.id,
            role: 'farmer',
          },
        ],
        { onConflict: 'user_id' }
      )
      .select('*')
      .single()

    if (error) {
      throw error
    }

    return data as UserProfile
  }, [user])

  const fetchProfile = useCallback(async () => {
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
      .maybeSingle()

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    if (data) {
      setProfile(data as UserProfile)
      setLoading(false)
      return
    }

    try {
      const createdProfile = await ensureProfileExists()
      setProfile(createdProfile)
    } catch (creationError) {
      setError(creationError instanceof Error ? creationError.message : 'Failed to create profile')
    } finally {
      setLoading(false)
    }
  }, [ensureProfileExists, user])

  useEffect(() => {
    void fetchProfile()
  }, [fetchProfile])

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return null

    await ensureProfileExists()

    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error
    setProfile(data as UserProfile)
    return data as UserProfile
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
