'use client'

import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [allowed, setAllowed] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
      return
    }

    const check = async () => {
      const { data } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user?.id)
        .single()

      if (data?.role === 'admin') {
        setAllowed(true)
      } else {
        router.push('/')
      }
    }

    if (user) check()
  }, [user, loading])

  if (!allowed) return <div>Checking permissions...</div>

  return <>{children}</>
}