'use client';

import { ArrowUpRight, BarChart3, Layers3, Users2 } from 'lucide-react';
import { adminStats } from '@/components/admin/types';

const statIcons = [Users2, Layers3, BarChart3];

export default function AdminDashboard() {
  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-600">Admin overview</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
              Platform performance at a glance
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Review user growth, listing activity, and transaction momentum from the mock admin dataset.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Updated from local mock records
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {adminStats.map((stat, index) => {
          const Icon = statIcons[index] ?? BarChart3;

          return (
            <article
              key={`${stat.label}-${index}`}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-transform duration-200 hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-600">
                  <Icon className="h-5 w-5" />
                </div>

                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  Active
                </span>
              </div>

              <div className="mt-5 space-y-2">
                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                <p className="text-3xl font-semibold tracking-tight text-slate-900">
                  {stat.value.toLocaleString()}
                </p>
                <p className="text-sm text-slate-600">{stat.change}</p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}