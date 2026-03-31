'use client'

import React from 'react'
import { AdminNavItem, adminNavItems } from './types'

interface AdminLayoutProps {
  activeItem: AdminNavItem
  onNavItemClick: (item: AdminNavItem) => void
  children: React.ReactNode
}

export function AdminLayout({
  activeItem,
  onNavItemClick,
  children,
}: AdminLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      <aside className="w-64 flex-shrink-0 bg-gray-800 text-white">
        <div className="p-4 text-2xl font-bold border-b border-gray-700">
          VIO AGRI Ops
        </div>
        <nav>
          <ul>
            {adminNavItems.map((item) => (
              <li key={item}>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    onNavItemClick(item)
                  }}
                  className={`block p-4 hover:bg-gray-700 ${
                    activeItem === item ? 'bg-gray-900' : ''
                  }`}
                >
                  {item}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <main className="flex-1 overflow-y-auto p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">{activeItem}</h1>
        </header>
        <div className="space-y-8">{children}</div>
      </main>
    </div>
  )
}