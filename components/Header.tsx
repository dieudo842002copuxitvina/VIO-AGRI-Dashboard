'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/utils/supabase/client'
import { Leaf, LogOut, Mail } from 'lucide-react'

export default function Header() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()

        if (error) throw error

        setUser(data?.session?.user || null)
      } catch (err) {
        console.error('Error fetching user:', err)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    getUser()

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((session) => {
      setUser(session?.user || null)
    })

    return () => subscription?.unsubscribe()
  }, [])

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      router.push('/login')
    } catch (err) {
      console.error('Error signing out:', err)
    }
  }

  return (
    <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Leaf className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">VIO AGRI</h1>
              <p className="text-green-100 text-xs">Global Data Dashboard</p>
            </div>
          </div>

          {/* Auth Section */}
          {!isLoading && (
            <div>
              {user ? (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
                    <Mail className="w-4 h-4" />
                    <span className="text-sm font-medium">{user.email}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    Đăng xuất
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => router.push('/login')}
                  className="bg-white text-green-600 hover:bg-green-50 px-6 py-2 rounded-lg font-semibold transition-colors"
                >
                  Đăng nhập
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
