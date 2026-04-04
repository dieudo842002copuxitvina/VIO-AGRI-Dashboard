'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2, LogOut } from 'lucide-react'
import { getSupabaseBrowserClient } from '@/lib/supabase'

interface MainLayoutProps {
  children: React.ReactNode
  pageHeaderContent?: React.ReactNode
  activeNavLink?: string
}

type User = {
  id: string
  email?: string
  user_metadata?: {
    name?: string
  }
}

export function MainLayout({ children, pageHeaderContent, activeNavLink = 'Tổng quan' }: MainLayoutProps) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true) 

  const navLinks = [
    { name: 'Tổng quan', href: '/' },
    { name: 'Sàn giao thương B2B', href: '/b2b' },
    { name: 'Vật tư & IoT', href: '/iot' },
    { name: 'Phân tích thị trường', href: '/market-analysis' },
  ]

  // Fetch initial auth state and subscribe to changes
  useEffect(() => {
    let isMounted = true
    const supabase = getSupabaseBrowserClient()

    const loadUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (isMounted) {
          setUser(user as User | null)
        }
      } catch (error) {
        console.error('[MainLayout] Error fetching user:', error)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadUser()

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (isMounted) {
        setUser((session?.user as User) || null)
      }
    })

    return () => {
      isMounted = false
      subscription?.unsubscribe()
    }
  }, [])

  const handleLogout = async () => {
    try {
      const supabase = getSupabaseBrowserClient()
      await supabase.auth.signOut()
      setUser(null)
      router.push('/login')
    } catch (error) {
      console.error('[MainLayout] Error logging out:', error)
    }
  }

  // Get user display name
  const getUserDisplayName = () => {
    if (user?.user_metadata?.name) {
      return user.user_metadata.name.charAt(0).toUpperCase()
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase()
    }
    return 'U'
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      {/* Global Top Navigation Bar */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          
          {/* Left: Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="text-2xl font-extrabold text-emerald-600 hover:text-emerald-700 transition-colors">
              VIO AGRI
            </Link>
          </div>

          {/* Center: Main Navigation Links */}
          <nav className="hidden md:block">
            <ul className="flex space-x-8">
              {navLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className={`relative text-sm font-medium transition-colors hover:text-emerald-600
                      ${activeNavLink === link.name ? 'text-emerald-600' : 'text-gray-700'}`}
                  >
                    {link.name}
                    {activeNavLink === link.name && (
                      <span className="absolute -bottom-5 left-0 w-full h-0.5 bg-emerald-600 rounded-full" />
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Right: User Actions */}
          <div className="flex items-center space-x-4 sm:space-x-6">
            {!isLoading && user ? (
              /* --- LOGGED IN STATE --- */
              <>
                <button className="relative p-1 text-gray-500 hover:text-emerald-600 focus:outline-none transition-colors">
                  <span className="sr-only">Xem thông báo</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.13 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                  </svg>
                  <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-white"></span>
                  </span>
                </button>

                <Link href="/profile" title={user.email || 'Hồ sơ'}>
                  <div className="h-9 w-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm border border-emerald-200 cursor-pointer hover:ring-2 hover:ring-emerald-500 transition-all">
                    {getUserDisplayName()}
                  </div>
                </Link>

                <Link
                  href="/b2b/post"
                  className="hidden sm:inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-md transition-all hover:bg-emerald-700 hover:shadow-lg active:scale-95"
                >
                  <svg className="-ml-0.5 mr-1.5 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                  </svg>
                  Đăng tin
                </Link>

                <button
                  onClick={handleLogout}
                  className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                  title="Đăng xuất"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </>
            ) : isLoading ? (
              /* --- LOADING STATE --- */
              <div className="p-1 text-gray-500">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : (
              /* --- NOT LOGGED IN STATE --- */
              <>
                <Link
                  href="/login"
                  className="text-sm font-semibold text-gray-700 hover:text-emerald-600 transition-colors"
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-md transition-all hover:bg-emerald-700 hover:shadow-lg active:scale-95"
                >
                  Đăng ký miễn phí
                </Link>
              </>
            )}

          </div>
        </div>
      </header>

      {/* Sub-Navigation / Page Header (Contextual) */}
      {pageHeaderContent && (
        <div className="bg-white border-b border-gray-200 py-4 shadow-sm">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {pageHeaderContent}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="animate-in fade-in duration-500">
          {children}
        </div>
      </main>
    </div>
  )
}