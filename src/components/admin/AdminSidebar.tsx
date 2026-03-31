'use client';

import type { ComponentType } from 'react';
import type { AdminNavItem } from '@/components/admin/types';
import { adminNavItems } from '@/components/admin/types';
import {
  FlaskConical,
  Cpu,
  LayoutDashboard,
  ListOrdered,
  ReceiptText,
  Users,
} from 'lucide-react';

type AdminSidebarProps = {
  activeSection: AdminNavItem;
  onSelect: (section: AdminNavItem) => void;
};

const iconMap: Record<AdminNavItem, ComponentType<{ className?: string }>> = {
  Overview: LayoutDashboard,
  Listings: ListOrdered,
  Users,
  Transactions: ReceiptText,
  Experiments: FlaskConical,
  'AI Debug': Cpu,
};

const descriptions: Record<AdminNavItem, string> = {
  Overview: 'Overview and platform stats',
  Listings: 'Review active market listings',
  Users: 'Manage accounts and trust',
  Transactions: 'Track payment activity',
  Experiments: 'A/B test performance',
  'AI Debug': 'Inspect decision engine',
};

export default function AdminSidebar({
  activeSection,
  onSelect,
}: AdminSidebarProps) {
  return (
    <aside className="w-full rounded-2xl border border-white/10 bg-slate-950 text-slate-100 shadow-sm lg:min-h-[calc(100vh-8rem)] lg:w-72">
      <div className="border-b border-white/10 px-5 py-5 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          Admin panel
        </p>
        <h2 className="mt-2 text-xl font-semibold text-white">Control Center</h2>
        <p className="mt-2 text-sm text-slate-400">
          Monitor marketplace activity and manage platform operations.
        </p>
      </div>

      <nav className="p-3 sm:p-4">
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
          {adminNavItems.map((item) => {
            const isActive = item === activeSection;
            const Icon = iconMap[item];

            return (
              <li key={item}>
                <button
                  type="button"
                  onClick={() => onSelect(item)}
                  aria-pressed={isActive}
                  className={[
                    'flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors',
                    'focus:outline-none focus:ring-2 focus:ring-emerald-400/60 focus:ring-offset-2 focus:ring-offset-slate-950',
                    isActive
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-white shadow-sm'
                      : 'border-white/5 bg-white/5 text-slate-300 hover:border-white/10 hover:bg-white/10 hover:text-white',
                  ].join(' ')}
                >
                  <span
                    className={[
                      'flex h-9 w-9 items-center justify-center rounded-lg border',
                      isActive
                        ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300'
                        : 'border-white/10 bg-slate-900 text-slate-400',
                    ].join(' ')}
                  >
                    <Icon className="h-4 w-4" />
                  </span>

                  <span className="flex min-w-0 flex-1 flex-col">
                    <span>{item}</span>
                    <span className="text-xs font-normal text-slate-500">
                      {descriptions[item]}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}