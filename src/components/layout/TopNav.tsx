'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell, Search, User, ChevronDown, Command } from 'lucide-react'

const navLinks = [
  { name: 'Tổng quan', href: '/' },
  { name: 'Sàn giao thương B2B', href: '/b2b' },
  { name: 'Thị trường', href: '/market' },
  { name: 'Phân tích', href: '/insights' },
  { name: 'Quản trị', href: '/admin' },
]

export default function TopNav() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white/80 backdrop-blur-xl shadow-sm supports-[backdrop-filter:blur(20px)]:bg-white/95">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 text-2xl font-black bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent hover:from-emerald-700 transition-all">
          VIO AGRI
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-2 lg:gap-8">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + '/')
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`relative px-3 py-2 text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'text-emerald-600'
                    : 'text-zinc-600 hover:text-zinc-900 hover:underline underline-offset-4'
                }`}
              >
                {link.name}
                {isActive && (
                  <span className="absolute inset-0 bg-emerald-100 rounded-md -z-10 blur opacity-75 animate-pulse" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Search/Command Palette */}
          <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2">
            <Command className="h-5 w-5" />
            <span className="sr-only">Tìm kiếm (⌘K)</span>
          </button>

          {/* Notifications */}
          <button className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-400" />
            </span>
          </button>

          {/* User Avatar Dropdown */}
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
              JD
            </div>
            <ChevronDown className="h-4 w-4 text-zinc-500" />
          </div>
        </div>
      </div>
    </header>
  )
}

