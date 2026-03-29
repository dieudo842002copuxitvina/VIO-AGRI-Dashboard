'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Globe, ShoppingCart } from 'lucide-react'

const menuItems = [
  {
    label: 'Tổng quan',
    icon: LayoutDashboard,
    href: '/',
  },
  {
    label: 'Sàn giao thương B2B',
    icon: Globe,
    href: '/b2b',
  },
  {
    label: 'Vật tư & IoT',
    icon: ShoppingCart,
    href: '/shop',
  },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-slate-800 to-slate-900 text-white shadow-2xl z-50">
      {/* Logo */}
      <div className="px-6 py-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-600 rounded-lg flex items-center justify-center">
            <span className="font-bold text-lg text-white">V</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">VIO AGRI</h1>
            <p className="text-xs text-slate-400">Nông nghiệp 4.0</p>
          </div>
        </Link>
      </div>

      {/* Divider */}
      <div className="px-6 mb-8">
        <div className="h-px bg-slate-700"></div>
      </div>

      {/* Menu Items */}
      <nav className="px-3 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg'
                  : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium text-sm">{item.label}</span>
              {isActive && (
                <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer Info */}
      <div className="absolute bottom-0 left-0 right-0 px-6 py-6 border-t border-slate-700">
        <div className="bg-slate-700/40 rounded-lg p-4">
          <p className="text-xs text-slate-400 mb-2">Phiên bản</p>
          <p className="text-sm font-semibold text-slate-200">v1.0.0</p>
        </div>
      </div>
    </aside>
  )
}
