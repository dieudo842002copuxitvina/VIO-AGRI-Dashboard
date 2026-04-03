export const revalidate = 60

import Link from 'next/link'
import { getSupabaseAdminClient } from '@/lib/supabase/server'
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Coffee,
  Leaf,
  Package,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wheat,
  type LucideIcon,
} from 'lucide-react'

type InsightSentiment = 'positive' | 'negative' | 'warning'

type CommoditySnapshot = {
  id: string
  name: string
  icon: LucideIcon
  price: string
  change: number
  marketLabel: string
  points: number[]
}

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

type ListingProfileRow = {
  business_name: string | null
  verified: boolean | null
}

type ListingRow = {
  id: string
  type: string | null
  commodity: string | null
  quantity: number | string | null
  price: number | string | null
  status: string | null
  is_boosted: boolean | null
  created_at: string | null
  user_profiles: ListingProfileRow | ListingProfileRow[] | null
}

type TopListing = {
  id: string
  type: 'sell' | 'buy'
  commodity: string
  quantity: number
  price: number
  isBoosted: boolean
  user_profiles: ListingProfileRow | null
  createdAt: string | null
}

const commoditySnapshots: CommoditySnapshot[] = [
  {
    id: 'coffee',
    name: 'Cà phê',
    icon: Coffee,
    price: '3,300 USD/tấn',
    change: 2.4,
    marketLabel: 'Robusta Export Index',
    points: [22, 26, 25, 28, 32, 34, 33, 37],
  },
  {
    id: 'pepper',
    name: 'Hồ tiêu',
    icon: Leaf,
    price: '95,000 VNĐ/kg',
    change: 1.8,
    marketLabel: 'Domestic Spot Benchmark',
    points: [18, 20, 22, 23, 24, 27, 29, 30],
  },
  {
    id: 'rice',
    name: 'Lúa gạo',
    icon: Wheat,
    price: '615 USD/tấn',
    change: -1.2,
    marketLabel: 'Asian Rice Composite',
    points: [34, 33, 32, 31, 30, 28, 27, 26],
  },
  {
    id: 'cashew',
    name: 'Hạt điều',
    icon: Package,
    price: '7,450 USD/tấn',
    change: 3.1,
    marketLabel: 'Kernel Export Index',
    points: [14, 16, 15, 18, 21, 23, 24, 27],
  },
]

const sentimentMeta: Record<InsightSentiment, { label: string; className: string }> = {
  positive: {
    label: 'Tích cực',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
  negative: {
    label: 'Tiêu cực',
    className: 'border-rose-200 bg-rose-50 text-rose-700',
  },
  warning: {
    label: 'Cảnh báo',
    className: 'border-rose-200 bg-rose-50 text-rose-700',
  },
}

const listingTypeMeta: Record<'sell' | 'buy', { label: string; className: string }> = {
  sell: {
    label: 'Bán',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
  buy: {
    label: 'Mua',
    className: 'border-blue-200 bg-blue-50 text-blue-700',
  },
}

function normalizeCommodity(value: string | null | undefined): string {
  const normalized = value?.trim().toLowerCase() ?? ''

  if (normalized === 'coffee') return 'Cà phê'
  if (normalized === 'pepper') return 'Hồ tiêu'
  if (normalized === 'rice') return 'Lúa gạo'
  if (normalized === 'cashew') return 'Hạt điều'

  return value?.trim() || 'Nông sản giao dịch'
}

function normalizeSentiment(value: string | null | undefined): InsightSentiment {
  if (value === 'positive') return 'positive'
  if (value === 'negative') return 'negative'
  return 'warning'
}

function normalizeNumber(value: number | string | null | undefined): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number(value.trim())
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return 0
}

function getPriceUnit(commodity: string): 'VNĐ/kg' | 'USD/tấn' {
  const normalized = commodity.trim().toLowerCase()

  if (
    normalized === 'rice' ||
    normalized === 'cashew' ||
    normalized === 'lúa gạo' ||
    normalized === 'hạt điều'
  ) {
    return 'USD/tấn'
  }

  return 'VNĐ/kg'
}

function formatListingPrice(value: number, commodity: string): string {
  const unit = getPriceUnit(commodity)

  if (unit === 'USD/tấn') {
    return `${new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(Math.round(value || 0))}/tấn`
  }

  return `${new Intl.NumberFormat('vi-VN').format(Math.round(value || 0))} VNĐ/kg`
}

function formatQuantity(value: number): string {
  return `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(value || 0)} Tấn`
}

function buildInsightActionLabel(commodity: string): string {
  const normalized = commodity.trim().toLowerCase()

  if (normalized.includes('gạo') || normalized.includes('rice')) return 'Đăng bán gạo ngay'
  if (normalized.includes('cà phê') || normalized.includes('coffee')) return 'Đăng bán cà phê ngay'
  if (normalized.includes('hồ tiêu') || normalized.includes('pepper')) return 'Đăng bán hồ tiêu ngay'
  if (normalized.includes('điều') || normalized.includes('cashew')) return 'Đăng bán hạt điều ngay'

  return 'Đăng bán ngay'
}

function extractProfile(profile: ListingRow['user_profiles']): ListingProfileRow | null {
  if (Array.isArray(profile)) {
    return profile[0] ?? null
  }

  return profile ?? null
}

function Sparkline({ points, positive, sparkId }: { points: number[]; positive: boolean; sparkId: string }) {
  const width = 240
  const height = 72
  const max = Math.max(...points)
  const min = Math.min(...points)
  const range = max - min || 1
  const step = width / Math.max(points.length - 1, 1)

  const linePoints = points
    .map((point, index) => {
      const x = index * step
      const y = height - ((point - min) / range) * (height - 12) - 6
      return `${x},${y}`
    })
    .join(' ')

  const strokeColor = positive ? '#10b981' : '#ef4444'
  const gradientId = `spark-gradient-${sparkId}`

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-20 w-full" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.26" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={`M 0 ${height} L ${linePoints} L ${width} ${height} Z`} fill={`url(#${gradientId})`} />
      <polyline
        fill="none"
        points={linePoints}
        stroke={strokeColor}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

async function getHomepageData(): Promise<{ insights: MarketInsight[]; listings: TopListing[] }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.warn('[Homepage] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    return { insights: [], listings: [] }
  }

  try {
    const supabase = getSupabaseAdminClient()

    const [insightsResult, listingsResult] = await Promise.all([
      supabase.from('market_insights').select('*').order('created_at', { ascending: false }).limit(3),
      supabase.from('listings').select('*, user_profiles(business_name, verified)')
        .eq('status', 'active')
        .order('is_boosted', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(3),
    ])

    if (insightsResult.error) {
      console.error(`[Homepage] Failed to fetch market insights: ${insightsResult.error.message}`)
    }

    if (listingsResult.error) {
      console.error(`[Homepage] Failed to fetch active listings: ${listingsResult.error.message}`)
    }

    const insightRows = (Array.isArray(insightsResult.data) ? insightsResult.data : []) as MarketInsightRow[]
    const listingRows = (Array.isArray(listingsResult.data) ? listingsResult.data : []) as ListingRow[]

    const insights: MarketInsight[] = insightRows.map((row) => ({
      id: row.id,
      commodity: normalizeCommodity(row.commodity),
      sentiment: normalizeSentiment(row.sentiment),
      title: row.title?.trim() || 'AI đang phân tích tín hiệu thị trường mới',
      cause: row.cause?.trim() || 'Dữ liệu nguyên nhân đang được tổng hợp.',
      impact: row.impact?.trim() || 'Tác động thị trường sẽ được cập nhật sớm.',
      sourceUrl: row.source_url,
      createdAt: row.created_at,
    }))

    const listings: TopListing[] = listingRows.map((row) => {
      const profile = extractProfile(row.user_profiles)
      const type = row.type === 'buy' ? 'buy' : 'sell'

      return {
        id: row.id,
        type,
        commodity: normalizeCommodity(row.commodity),
        quantity: normalizeNumber(row.quantity),
        price: normalizeNumber(row.price),
        isBoosted: Boolean(row.is_boosted),
        user_profiles: profile
          ? {
              business_name: profile.business_name?.trim() || null,
              verified: Boolean(profile.verified),
            }
          : null,
        createdAt: row.created_at,
      }
    })

    return { insights, listings }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error(`[Homepage] Unexpected fetch failure: ${message}`)
    return { insights: [], listings: [] }
  }
}

export default async function HomePage() {
  const { insights, listings } = await getHomepageData()
  const latestInsight = insights[0]
  const tickerText = latestInsight
    ? `CẢNH BÁO AI: ${latestInsight.title} | ${latestInsight.impact}`
    : 'CẢNH BÁO AI: Đang tổng hợp tín hiệu mới từ thị trường nông sản toàn cầu.'
  const tickerItems = [
    tickerText,
    'Logistics Monitor: Cước tàu biển và tồn kho đang được theo dõi theo thời gian thực.',
  ]

  return (
    <div className="space-y-10 pb-6 text-stone-950 lg:space-y-12">
      <section className="relative left-1/2 right-1/2 -mx-[50vw] -mt-12 w-screen overflow-hidden border-y border-white/10 bg-gray-950 text-white lg:-mt-16">
        <div className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-gray-950 to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-gray-950 to-transparent" />
          <div className="flex min-w-max w-max items-center py-3 animate-marquee">
            {Array.from({ length: 2 }).map((_, loopIndex) => (
              <div
                key={`ticker-loop-${loopIndex}`}
                className="flex shrink-0 items-center gap-6 px-6 text-sm font-medium tracking-[0.18em] text-white/90 uppercase sm:px-10"
              >
                <span className="inline-flex items-center gap-2 text-amber-300">
                  <AlertTriangle className="h-4 w-4" />
                  Live AI Signal
                </span>
                {tickerItems.map((item, itemIndex) => (
                  <div key={`ticker-item-${loopIndex}-${itemIndex}`} className="flex items-center gap-6">
                    <span>{item}</span>
                    <span className="text-white/30">|</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <div className="overflow-hidden rounded-[32px] border border-stone-200 bg-white shadow-[0_22px_70px_-38px_rgba(15,23,42,0.45)]">
          <div className="border-b border-stone-200 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.12),_transparent_48%),linear-gradient(135deg,_rgba(248,250,252,0.98),_rgba(255,255,255,1))] px-6 py-8 sm:px-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
              <Sparkles className="h-3.5 w-3.5" />
              VIO AGRI Intelligence
            </div>
            <div className="mt-5 max-w-3xl space-y-4">
              <h1 className="text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl lg:text-[2.8rem] lg:leading-tight">
                Toàn cảnh thị trường nông sản được AI chọn lọc cho giao dịch B2B tốc độ cao.
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-stone-600 sm:text-base">
                Kết nối tín hiệu thị trường, dữ liệu niêm yết và đối tác đã xác minh trong một bảng điều khiển
                gọn gàng, đáng tin cậy và sẵn sàng chuyển hóa thành cơ hội giao thương.
              </p>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/b2b"
                className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_-18px_rgba(5,150,105,0.9)] transition hover:bg-emerald-500"
              >
                Vào sàn giao thương
              </Link>
              <Link
                href="/b2b/post"
                className="inline-flex items-center justify-center rounded-2xl border border-stone-200 bg-white px-5 py-3 text-sm font-semibold text-stone-700 transition hover:border-stone-300 hover:bg-stone-50"
              >
                Đăng tin mới
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
          {commoditySnapshots.map((snapshot) => {
            const positive = snapshot.change >= 0
            const changeClass = positive ? 'text-emerald-600' : 'text-rose-600'
            const ChangeIcon = positive ? TrendingUp : TrendingDown
            const Icon = snapshot.icon

            return (
              <article
                key={snapshot.id}
                className="group overflow-hidden rounded-[28px] border border-stone-200 bg-white p-5 shadow-[0_16px_50px_-36px_rgba(15,23,42,0.45)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_60px_-34px_rgba(15,23,42,0.5)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-stone-100 text-stone-700">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h2 className="mt-4 text-lg font-semibold text-stone-950">{snapshot.name}</h2>
                    <p className="mt-1 text-xs font-medium uppercase tracking-[0.22em] text-stone-500">
                      {snapshot.marketLabel}
                    </p>
                  </div>
                  <div className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${changeClass} ${positive ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                    <ChangeIcon className="h-3.5 w-3.5" />
                    {positive ? '+' : ''}
                    {snapshot.change}%
                  </div>
                </div>
                <div className="mt-5 rounded-3xl border border-stone-100 bg-stone-50/80 p-4">
                  <p className="text-2xl font-semibold tracking-tight text-stone-950">{snapshot.price}</p>
                  <div className="mt-4">
                    <Sparkline points={snapshot.points} positive={positive} sparkId={snapshot.id} />
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <div className="rounded-[32px] border border-stone-200 bg-white p-6 shadow-[0_18px_60px_-40px_rgba(15,23,42,0.45)] sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">AI Deep Dives</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">
                Phân Tích Chuyên Sâu từ AI
              </h2>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-medium text-stone-600">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Cập nhật mỗi 60 giây
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {insights.length > 0 ? (
              insights.map((insight) => {
                const sentiment = sentimentMeta[insight.sentiment]

                return (
                  <article
                    key={insight.id}
                    className="rounded-[28px] border border-stone-200 bg-[linear-gradient(180deg,_rgba(255,255,255,1),_rgba(248,250,252,0.92))] p-5 shadow-[0_14px_40px_-34px_rgba(15,23,42,0.45)]"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-3">
                        <div className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${sentiment.className}`}>
                          {sentiment.label}
                        </div>
                        <div>
                          <p className="text-sm font-medium uppercase tracking-[0.22em] text-stone-500">
                            {insight.commodity}
                          </p>
                          <h3 className="mt-2 text-xl font-semibold tracking-tight text-stone-950">
                            {insight.title}
                          </h3>
                        </div>
                      </div>
                    </div>
                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Nguyên nhân</p>
                        <p className="mt-2 text-sm leading-7 text-stone-700">{insight.cause}</p>
                      </div>
                      <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Tác động</p>
                        <p className="mt-2 text-sm leading-7 text-stone-700">{insight.impact}</p>
                      </div>
                    </div>
                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                      <span className="text-xs font-medium text-stone-500">
                        {insight.sourceUrl ? 'Nguồn AI đã ghi nhận và chuẩn hóa từ nguồn tin thị trường.' : 'Nguồn tin đang được đồng bộ nội bộ.'}
                      </span>
                      <Link
                        href="/b2b/post"
                        className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100"
                      >
                        {buildInsightActionLabel(insight.commodity)}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </article>
                )
              })
            ) : (
              <div className="rounded-[28px] border border-dashed border-stone-300 bg-stone-50 p-8 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-stone-500 shadow-sm">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-stone-950">Đang chờ AI cập nhật dữ liệu...</h3>
                <p className="mt-2 text-sm leading-7 text-stone-600">
                  Hệ thống sẽ tự động tổng hợp tín hiệu mới từ thị trường nông sản và hiển thị tại đây.
                </p>
              </div>
            )}
          </div>
        </div>

        <aside className="rounded-[32px] border border-stone-200 bg-white p-6 shadow-[0_18px_60px_-40px_rgba(15,23,42,0.45)] sm:p-7">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">Top Deals</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">Cơ Hội Giao Thương</h2>
            </div>
            <Link href="/b2b" className="text-sm font-semibold text-emerald-700 transition hover:text-emerald-600">
              Xem tất cả
            </Link>
          </div>

          <div className="mt-6 space-y-4">
            {listings.length > 0 ? (
              listings.map((item) => {
                const typeMeta = listingTypeMeta[item.type]
                const sellerName = item.user_profiles?.business_name || 'Nhà cung cấp ẩn danh'
                const isVerified = Boolean(item.user_profiles?.verified)

                return (
                  <article
                    key={item.id}
                    className={`rounded-[26px] border p-5 transition hover:-translate-y-0.5 ${
                      item.isBoosted
                        ? 'border-amber-300 bg-[linear-gradient(180deg,_rgba(255,251,235,0.96),_rgba(255,255,255,1))] shadow-[0_18px_55px_-38px_rgba(217,119,6,0.45)]'
                        : 'border-stone-200 bg-[linear-gradient(180deg,_rgba(255,255,255,1),_rgba(248,250,252,0.92))] shadow-[0_16px_45px_-36px_rgba(15,23,42,0.4)]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${typeMeta.className}`}>
                            {typeMeta.label}
                          </span>
                          {item.isBoosted ? (
                            <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                              Top
                            </span>
                          ) : null}
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold tracking-tight text-stone-950">{item.commodity}</h3>
                          <p className="mt-1 text-sm text-stone-600">{formatQuantity(item.quantity)}</p>
                        </div>
                      </div>
                      <p className="text-right text-lg font-semibold text-stone-950">{formatListingPrice(item.price, item.commodity)}</p>
                    </div>
                    <div className="mt-5 rounded-2xl border border-stone-200 bg-white/80 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Đối tác niêm yết</p>
                          <p className="mt-2 text-sm font-semibold text-stone-900">{sellerName}</p>
                        </div>
                        {isVerified ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                            <BadgeCheck className="h-3.5 w-3.5" />
                            Đã xác minh
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <Link
                      href="/b2b"
                      className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-stone-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-stone-800"
                    >
                      Xem chi tiết cơ hội
                    </Link>
                  </article>
                )
              })
            ) : (
              <div className="rounded-[28px] border border-dashed border-stone-300 bg-stone-50 p-8 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-stone-500 shadow-sm">
                  <Package className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-stone-950">Chưa có giao dịch nào trên sàn</h3>
                <p className="mt-2 text-sm leading-7 text-stone-600">
                  Những niêm yết mới nhất từ hệ sinh thái giao thương B2B sẽ xuất hiện tại đây.
                </p>
              </div>
            )}
          </div>
        </aside>
      </section>

    </div>
  )
}










