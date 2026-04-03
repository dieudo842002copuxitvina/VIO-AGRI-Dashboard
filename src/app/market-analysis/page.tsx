import { createClient } from '@supabase/supabase-js'
import {
  ArrowUpRight,
  Brain,
  CalendarClock,
  DatabaseZap,
  Leaf,
  Sparkles,
  TriangleAlert,
} from 'lucide-react'

type InsightSentiment = 'positive' | 'negative' | 'warning'

type MarketInsightRow = {
  id: string
  commodity: string | null
  sentiment: string | null
  title: string | null
  cause: string | null
  impact: string | null
  source_url: string | null
  created_at: string | null
}

type MarketInsight = {
  id: string
  commodity: string
  sentiment: InsightSentiment
  title: string
  cause: string
  impact: string
  sourceUrl: string | null
  createdAt: string | null
}

const filters = ['All', 'Cà phê', 'Hồ tiêu', 'Lúa gạo', 'Hạt điều'] as const

const sentimentMeta: Record<
  InsightSentiment,
  { label: string; badgeClassName: string; borderClassName: string }
> = {
  positive: {
    label: 'Tích cực',
    badgeClassName: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    borderClassName: 'border-emerald-200/80',
  },
  negative: {
    label: 'Tiêu cực',
    badgeClassName: 'border-rose-200 bg-rose-50 text-rose-700',
    borderClassName: 'border-rose-200/80',
  },
  warning: {
    label: 'Cảnh báo',
    badgeClassName: 'border-amber-200 bg-amber-50 text-amber-700',
    borderClassName: 'border-amber-200/80',
  },
}

function normalizeCommodity(value: string | null | undefined): string {
  const normalized = value?.trim().toLowerCase() ?? ''

  if (normalized === 'coffee') return 'Cà phê'
  if (normalized === 'pepper') return 'Hồ tiêu'
  if (normalized === 'rice') return 'Lúa gạo'
  if (normalized === 'cashew') return 'Hạt điều'

  return value?.trim() || 'Nông sản'
}

function normalizeSentiment(value: string | null | undefined): InsightSentiment {
  if (value === 'positive') return 'positive'
  if (value === 'negative') return 'negative'
  return 'warning'
}

function formatInsightDate(value: string | null): string {
  if (!value) {
    return 'Đang cập nhật thời gian'
  }

  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return 'Đang cập nhật thời gian'
  }

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed)
}

async function getMarketInsights(): Promise<MarketInsight[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[Market Analysis] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
    return []
  }

  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { data, error } = await supabase.from('market_insights').select('*').order('created_at', {
      ascending: false,
    })

    if (error) {
      console.error(`[Market Analysis] Failed to fetch market insights: ${error.message}`)
      return []
    }

    const rows = (Array.isArray(data) ? data : []) as MarketInsightRow[]

    return rows.map((row) => ({
      id: row.id,
      commodity: normalizeCommodity(row.commodity),
      sentiment: normalizeSentiment(row.sentiment),
      title: row.title?.trim() || 'AI đang xử lý tín hiệu thị trường mới',
      cause: row.cause?.trim() || 'Nguyên nhân đang được hệ thống AI cập nhật.',
      impact: row.impact?.trim() || 'Tác động thị trường sẽ sớm được bổ sung.',
      sourceUrl: row.source_url?.trim() || null,
      createdAt: row.created_at,
    }))
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error(`[Market Analysis] Unexpected fetch failure: ${message}`)
    return []
  }
}

export default async function MarketAnalysisPage() {
  const insights = await getMarketInsights()

  return (
    <div className="space-y-8 text-stone-950 lg:space-y-10">
      <section className="rounded-[32px] border border-stone-200 bg-white p-6 shadow-[0_22px_70px_-44px_rgba(15,23,42,0.42)] sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
              <Sparkles className="h-3.5 w-3.5" />
              AI Intelligence Center
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
                Trung tâm Tình báo Nông sản AI
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-600 sm:text-base">
                Dữ liệu được tổng hợp và phân tích tự động theo thời gian thực.
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-600">
            <span className="font-semibold text-stone-900">{insights.length}</span> tín hiệu AI đang hiển thị
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex flex-wrap gap-3">
          {filters.map((filter, index) => {
            const active = index === 0

            return (
              <button
                key={filter}
                type="button"
                aria-pressed={active}
                className={`rounded-2xl border px-4 py-2.5 text-sm font-semibold transition ${
                  active
                    ? 'border-emerald-600 bg-emerald-600 text-white shadow-[0_18px_40px_-22px_rgba(5,150,105,0.9)]'
                    : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:text-stone-900'
                }`}
              >
                {filter}
              </button>
            )
          })}
        </div>

        <div className="relative overflow-hidden rounded-[32px] border border-stone-200 bg-white shadow-[0_22px_70px_-46px_rgba(15,23,42,0.4)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.14),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.12),_transparent_30%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.05)_1px,transparent_1px)] bg-[size:44px_44px]" />
          <div className="relative px-6 py-8 sm:px-8 sm:py-10">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                  Price Trend Chart
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">
                  Biểu đồ Biến động Giá
                </h2>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white/90 px-3 py-1.5 text-xs font-medium text-stone-600 backdrop-blur">
                <DatabaseZap className="h-4 w-4 text-emerald-600" />
                Dữ liệu tổng hợp từ AI Feed
              </div>
            </div>

            <div className="mt-8 rounded-[28px] border border-white/70 bg-[linear-gradient(180deg,rgba(248,250,252,0.86),rgba(255,255,255,0.96))] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] sm:p-8">
              <div className="flex min-h-[280px] flex-col justify-between">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-stone-900">Biểu đồ đang được AI tổng hợp dữ liệu...</p>
                    <p className="max-w-2xl text-sm leading-7 text-stone-600">
                      Tầng visualization sẽ được gắn với dữ liệu giá thị trường ngay khi chart library được đưa vào hệ thống.
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                    <Leaf className="h-4 w-4" />
                    Market Pulse Placeholder
                  </div>
                </div>

                <div className="mt-10 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border border-stone-200 bg-white/90 px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Tín hiệu gần nhất</p>
                    <p className="mt-2 text-lg font-semibold text-stone-950">
                      {insights[0]?.commodity || 'Đang chờ dữ liệu'}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-stone-200 bg-white/90 px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Nguồn phân tích</p>
                    <p className="mt-2 text-lg font-semibold text-stone-950">AI Market Signals</p>
                  </div>
                  <div className="rounded-2xl border border-stone-200 bg-white/90 px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Trạng thái</p>
                    <p className="mt-2 text-lg font-semibold text-stone-950">Sẵn sàng tích hợp chart</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">AI Intelligence Feed</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">
              Luồng Tín hiệu Phân tích từ AI
            </h2>
          </div>
          <p className="text-sm text-stone-500">Toàn bộ nhận định được làm mới theo thứ tự mới nhất trước.</p>
        </div>

        {insights.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {insights.map((insight) => {
              const sentiment = sentimentMeta[insight.sentiment]

              return (
                <article
                  key={insight.id}
                  className={`rounded-[30px] border bg-white p-6 shadow-[0_18px_60px_-42px_rgba(15,23,42,0.42)] ${sentiment.borderClassName}`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-semibold text-stone-700">
                      {insight.commodity}
                    </span>
                    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${sentiment.badgeClassName}`}>
                      {sentiment.label}
                    </span>
                  </div>

                  <h3 className="mt-5 text-xl font-semibold tracking-tight text-stone-950">
                    {insight.title}
                  </h3>

                  <div className="mt-5 space-y-4">
                    <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-4">
                      <p className="text-sm font-semibold text-stone-900">🧠 Nguyên nhân</p>
                      <p className="mt-2 text-sm leading-7 text-stone-700">{insight.cause}</p>
                    </div>
                    <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-4">
                      <p className="text-sm font-semibold text-stone-900">⚡ Tác động</p>
                      <p className="mt-2 text-sm leading-7 text-stone-700">{insight.impact}</p>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 pt-4">
                    <div className="inline-flex items-center gap-2 text-sm text-stone-500">
                      <CalendarClock className="h-4 w-4 text-stone-400" />
                      {formatInsightDate(insight.createdAt)}
                    </div>
                    {insight.sourceUrl ? (
                      <a
                        href={insight.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 transition hover:text-emerald-600"
                      >
                        Nguồn tin
                        <ArrowUpRight className="h-4 w-4" />
                      </a>
                    ) : (
                      <span className="text-sm font-medium text-stone-400">Nguồn tin đang cập nhật</span>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="rounded-[32px] border border-dashed border-stone-300 bg-white p-10 text-center shadow-[0_18px_60px_-44px_rgba(15,23,42,0.35)]">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-stone-100 text-stone-500">
              <Brain className="h-7 w-7" />
            </div>
            <h3 className="mt-5 text-xl font-semibold text-stone-950">Chưa có insight nào từ AI</h3>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-stone-600">
              Hệ thống đang chờ crawler và pipeline phân tích đồng bộ dữ liệu thị trường. Khi có tín hiệu mới,
              các nhận định sẽ xuất hiện tại đây theo thời gian thực.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700">
              <TriangleAlert className="h-4 w-4" />
              Feed hiện tạm thời trống nhưng page vẫn sẵn sàng nhận dữ liệu.
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
