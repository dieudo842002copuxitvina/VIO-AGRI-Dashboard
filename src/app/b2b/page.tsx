'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Crown,
  Package,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'

type ListingType = 'sell' | 'buy'

type MarketplaceListing = {
  id: string
  type: ListingType
  commodity: string
  quantity: number
  price: number
  status: string
  isBoosted: boolean
  businessName: string
  trustScore: number | null
  verified: boolean
  createdAt: string | null
}

const commodityLabelMap = {
  coffee: 'Cà phê',
  pepper: 'Hồ tiêu',
  rice: 'Lúa gạo',
  cashew: 'Hạt điều',
} as const

const typeConfig: Record<
  ListingType,
  {
    label: string
    badgeClassName: string
    buttonClassName: string
    accentClassName: string
  }
> = {
  sell: {
    label: 'Bán',
    badgeClassName: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    buttonClassName:
      'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-200',
    accentClassName: 'from-emerald-500 via-emerald-400 to-emerald-300',
  },
  buy: {
    label: 'Mua',
    badgeClassName: 'border-blue-200 bg-blue-50 text-blue-700',
    buttonClassName: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-200',
    accentClassName: 'from-blue-500 via-sky-400 to-cyan-300',
  },
}

function toSafeText(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback
}

function toSafeNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const normalized = Number(value.trim())

    if (Number.isFinite(normalized)) {
      return normalized
    }
  }

  return fallback
}

function toOptionalNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const normalized = Number(value.trim())

    if (Number.isFinite(normalized)) {
      return normalized
    }
  }

  return null
}

function normalizeCommodity(value: string): string {
  const normalized = value.trim().toLowerCase()

  if (normalized in commodityLabelMap) {
    return commodityLabelMap[normalized as keyof typeof commodityLabelMap]
  }

  return value.trim() || 'Nông sản giao dịch'
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

function formatPrice(value: number, commodity: string): string {
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
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(value || 0)
}

function formatTrustScore(value: number | null): string {
  if (value === null) {
    return 'Uy tín: Đang cập nhật'
  }

  const safeValue = Math.max(0, Math.min(100, Math.round(value)))
  return `Uy tín: ${safeValue}/100`
}

function formatDateLabel(value: string | null): string {
  if (!value) {
    return 'Mới đăng gần đây'
  }

  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return 'Mới đăng gần đây'
  }

  return `Cập nhật ${parsed.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })}`
}

function getActionLabel(type: ListingType): string {
  return type === 'sell' ? 'Liên hệ đối tác' : 'Thương lượng'
}

function parseListingsPayload(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload
  }

  if (!payload || typeof payload !== 'object') {
    return []
  }

  const record = payload as { listings?: unknown }
  return Array.isArray(record.listings) ? record.listings : []
}

function normalizeListing(raw: unknown, index: number): MarketplaceListing | null {
  if (!raw || typeof raw !== 'object') {
    return null
  }

  const record = raw as Record<string, unknown>
  const type = record.type === 'buy' ? 'buy' : record.type === 'sell' ? 'sell' : null

  if (!type) {
    return null
  }

  return {
    id: toSafeText(record.id, `listing-${index}`),
    type,
    commodity: normalizeCommodity(toSafeText(record.commodity, 'Nông sản giao dịch')),
    quantity: toSafeNumber(record.quantity, 0),
    price: toSafeNumber(record.price, 0),
    status: toSafeText(record.status, 'active'),
    isBoosted: Boolean(record.is_boosted),
    businessName: toSafeText(record.business_name, 'Đối tác đang cập nhật hồ sơ'),
    trustScore: toOptionalNumber(record.trust_score),
    verified: Boolean(record.verified),
    createdAt: toSafeText(record.created_at, '') || null,
  }
}

function ListingCardSkeleton() {
  return (
    <div className="animate-pulse rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="h-7 w-20 rounded-full bg-stone-200" />
        <div className="h-7 w-16 rounded-full bg-stone-200" />
      </div>
      <div className="mt-6 h-4 w-32 rounded bg-stone-200" />
      <div className="mt-4 h-8 w-40 rounded bg-stone-200" />
      <div className="mt-4 h-10 w-28 rounded bg-stone-200" />
      <div className="mt-6 rounded-2xl border border-stone-100 bg-stone-50 p-4">
        <div className="h-4 w-24 rounded bg-stone-200" />
        <div className="mt-3 h-8 w-40 rounded bg-stone-200" />
      </div>
      <div className="mt-6 rounded-2xl border border-stone-100 bg-stone-50 p-4">
        <div className="h-4 w-32 rounded bg-stone-200" />
        <div className="mt-3 h-4 w-full rounded bg-stone-200" />
        <div className="mt-2 h-4 w-28 rounded bg-stone-200" />
      </div>
      <div className="mt-6 h-12 w-full rounded-2xl bg-stone-200" />
    </div>
  )
}

export default function B2BMarketplacePage() {
  const [listings, setListings] = useState<MarketplaceListing[]>([])
  const [activeListingId, setActiveListingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let isMounted = true
    const controller = new AbortController()

    async function loadListings() {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/listings', {
          cache: 'no-store',
          signal: controller.signal,
        })

        const contentType = response.headers.get('content-type') ?? ''
        const payload = contentType.includes('application/json') ? await response.json() : null

        if (!response.ok) {
          const message =
            payload &&
            typeof payload === 'object' &&
            typeof (payload as { error?: unknown }).error === 'string'
              ? (payload as { error: string }).error
              : 'Không thể tải dữ liệu sàn giao thương lúc này.'

          throw new Error(message)
        }

        const safeListings = parseListingsPayload(payload)
          .map((item, index) => normalizeListing(item, index))
          .filter((item): item is MarketplaceListing => item !== null)

        if (!isMounted) {
          return
        }

        setListings(safeListings)
        setActiveListingId((current) => {
          if (current && safeListings.some((item) => item.id === current)) {
            return current
          }

          return safeListings[0]?.id ?? null
        })
      } catch (fetchError) {
        if (!isMounted || controller.signal.aborted) {
          return
        }

        setListings([])
        setActiveListingId(null)
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : 'Không thể tải dữ liệu sàn giao thương lúc này.',
        )
      } finally {
        if (isMounted && !controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    void loadListings()

    return () => {
      isMounted = false
      controller.abort()
    }
  }, [reloadKey])

  const activeListing = listings.find((item) => item.id === activeListingId) ?? listings[0] ?? null
  const totalListings = listings.length
  const boostedCount = listings.filter((item) => item.isBoosted).length
  const verifiedCount = listings.filter((item) => item.verified).length
  const sellCount = listings.filter((item) => item.type === 'sell').length
  const buyCount = listings.filter((item) => item.type === 'buy').length

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8faf7_0%,#f7f7f5_42%,#ffffff_100%)] text-stone-950">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <section className="overflow-hidden rounded-[2.5rem] border border-stone-200 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_36%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.16),_transparent_28%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-6 shadow-sm shadow-stone-950/5 lg:p-10">
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1.1fr)_340px] xl:items-end">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">
                <Sparkles className="h-4 w-4" />
                Trading Network
              </span>
              <h1 className="mt-5 text-4xl font-semibold tracking-tight text-stone-950 sm:text-5xl">
                Sàn giao thương B2B
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-stone-600">
                Khám phá nguồn cung và nhu cầu nông sản với giao diện ưu tiên niềm tin, giá rõ ràng,
                và tín hiệu uy tín giúp doanh nghiệp chốt cơ hội nhanh hơn.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/b2b/post"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  <Plus className="h-4 w-4" />
                  + Đăng tin mới
                </Link>
                <Link
                  href="/b2b/my-listings"
                  className="inline-flex items-center justify-center rounded-full border border-stone-300 bg-white px-6 py-3 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:bg-stone-50"
                >
                  Quản lý tin đăng
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-3xl border border-stone-200 bg-white/90 p-5 shadow-sm shadow-stone-950/5 backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
                  Tổng cơ hội đang mở
                </p>
                <p className="mt-3 text-3xl font-semibold text-stone-950">{loading ? '...' : totalListings}</p>
                <p className="mt-1 text-sm text-stone-600">nguồn cung và nhu cầu đang hiển thị</p>
              </div>
              <div className="rounded-3xl border border-stone-200 bg-white/90 p-5 shadow-sm shadow-stone-950/5 backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
                  Đối tác xác minh
                </p>
                <p className="mt-3 text-3xl font-semibold text-stone-950">{loading ? '...' : verifiedCount}</p>
                <p className="mt-1 text-sm text-stone-600">hồ sơ có tín hiệu tin cậy rõ ràng</p>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-stone-200 bg-white/85 p-5 shadow-sm shadow-stone-950/5 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">Chào bán</p>
              <p className="mt-3 text-2xl font-semibold text-stone-950">{loading ? '...' : sellCount}</p>
              <p className="mt-1 text-sm text-stone-600">listing bên bán sẵn sàng chào hàng</p>
            </div>
            <div className="rounded-3xl border border-stone-200 bg-white/85 p-5 shadow-sm shadow-stone-950/5 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">Nhu cầu mua</p>
              <p className="mt-3 text-2xl font-semibold text-stone-950">{loading ? '...' : buyCount}</p>
              <p className="mt-1 text-sm text-stone-600">doanh nghiệp đang tìm nguồn hàng phù hợp</p>
            </div>
            <div className="rounded-3xl border border-stone-200 bg-white/85 p-5 shadow-sm shadow-stone-950/5 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">Vị trí Top</p>
              <p className="mt-3 text-2xl font-semibold text-stone-950">{loading ? '...' : boostedCount}</p>
              <p className="mt-1 text-sm text-stone-600">cơ hội nổi bật với ưu tiên hiển thị cao hơn</p>
            </div>
          </div>
        </section>

        {activeListing && !loading && !error && listings.length > 0 && (
          <section className="mt-6 rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm shadow-stone-950/5">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-stone-500">
                  Đang ưu tiên cơ hội
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-stone-950 sm:text-3xl">
                  {typeConfig[activeListing.type].label} {activeListing.commodity} {formatQuantity(activeListing.quantity)} Tấn
                </h2>
                <p className="mt-3 text-sm leading-6 text-stone-600">
                  {activeListing.businessName} · {formatTrustScore(activeListing.trustScore)}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <span className="inline-flex items-center rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-sm font-semibold text-stone-700">
                  {formatPrice(activeListing.price, activeListing.commodity)}
                </span>
                {activeListing.verified && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                    <BadgeCheck className="h-4 w-4" />
                    Đã xác minh
                  </span>
                )}
                {activeListing.isBoosted && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700">
                    <Crown className="h-4 w-4" />
                    Top hiển thị
                  </span>
                )}
              </div>
            </div>
          </section>
        )}

        <section className="mt-8 rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm shadow-stone-950/5 sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-stone-500">Marketplace Feed</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-stone-950">
                Cơ hội giao thương đang mở
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-600">
                Duyệt nhanh theo loại giao dịch, độ uy tín và vị trí nổi bật để chọn đúng đối tác cho
                lô hàng hoặc nhu cầu thu mua tiếp theo.
              </p>
            </div>

            {!loading && error && (
              <button
                type="button"
                onClick={() => setReloadKey((current) => current + 1)}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-stone-300 bg-white px-5 py-3 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:bg-stone-50"
              >
                <RefreshCw className="h-4 w-4" />
                Tải lại feed
              </button>
            )}
          </div>

          {loading ? (
            <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }, (_, index) => (
                <ListingCardSkeleton key={index} />
              ))}
            </div>
          ) : error ? (
            <div className="mt-8 rounded-[1.75rem] border border-red-200 bg-red-50 p-6 sm:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-lg font-semibold text-red-900">Không thể tải sàn giao thương</p>
                  <p className="mt-2 max-w-2xl text-sm leading-7 text-red-700">{error}</p>
                </div>
                <div className="rounded-2xl bg-white p-3 text-red-500 shadow-sm">
                  <ShieldCheck className="h-6 w-6" />
                </div>
              </div>
            </div>
          ) : listings.length === 0 ? (
            <div className="mt-8 rounded-[1.9rem] border border-dashed border-stone-300 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.1),_transparent_38%),linear-gradient(180deg,#fafaf9_0%,#ffffff_100%)] px-6 py-14 text-center sm:px-10">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 shadow-sm shadow-emerald-900/10">
                <Package className="h-10 w-10" />
              </div>
              <h3 className="mt-6 text-2xl font-semibold tracking-tight text-stone-950">
                Chưa có tin giao thương nào trên feed
              </h3>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-stone-600">
                Hãy trở thành doanh nghiệp đầu tiên đăng tin để thu hút người mua hoặc nguồn hàng mới
                trên sàn B2B của VIO AGRI.
              </p>
              <Link
                href="/b2b/post"
                className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                <Plus className="h-4 w-4" />
                Đăng tin đầu tiên
              </Link>
            </div>
          ) : (
            <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {listings.map((listing) => {
                const config = typeConfig[listing.type]
                const isActive = listing.id === activeListing?.id

                return (
                  <article
                    key={listing.id}
                    className={`group relative overflow-hidden rounded-[1.75rem] border bg-white p-6 shadow-sm transition duration-200 ${
                      listing.isBoosted
                        ? 'border-amber-300 shadow-amber-100/80 hover:border-amber-400'
                        : isActive
                          ? 'border-stone-300 shadow-stone-950/10'
                          : 'border-stone-200 shadow-stone-950/5 hover:-translate-y-1 hover:border-stone-300 hover:shadow-lg'
                    }`}
                  >
                    <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${config.accentClassName}`} />

                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] ${config.badgeClassName}`}
                        >
                          {config.label}
                        </span>
                        {listing.isBoosted && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                            <Crown className="h-3.5 w-3.5" />
                            Top
                          </span>
                        )}
                      </div>

                      {isActive && (
                        <span className="inline-flex items-center rounded-full bg-stone-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white">
                          Đang xem
                        </span>
                      )}
                    </div>

                    <p className="mt-6 text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
                      {formatDateLabel(listing.createdAt)}
                    </p>

                    <div className="mt-4">
                      <h3 className="text-2xl font-semibold tracking-tight text-stone-950">
                        {listing.commodity}
                      </h3>
                      <p className="mt-3 text-4xl font-semibold tracking-tight text-stone-950">
                        {formatQuantity(listing.quantity)}
                        <span className="ml-2 text-lg font-medium text-stone-500">Tấn</span>
                      </p>
                    </div>

                    <div className="mt-6 rounded-[1.5rem] border border-stone-200 bg-stone-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
                        Mức giá giao dịch
                      </p>
                      <p className="mt-3 text-3xl font-semibold tracking-tight text-stone-950">
                        {formatPrice(listing.price, listing.commodity)}
                      </p>
                    </div>

                    <div className="mt-6 rounded-[1.5rem] border border-stone-200 bg-white p-4 shadow-sm shadow-stone-950/5">
                      <div className="flex items-start gap-3">
                        <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3 text-stone-600">
                          <Building2 className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-base font-semibold text-stone-950">
                            {listing.businessName}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-semibold text-stone-700">
                              {formatTrustScore(listing.trustScore)}
                            </span>
                            {listing.verified && (
                              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                <BadgeCheck className="h-3.5 w-3.5" />
                                Verified
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => setActiveListingId(listing.id)}
                      className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-[1.2rem] px-4 py-4 text-sm font-semibold transition focus:outline-none focus:ring-4 ${config.buttonClassName}`}
                    >
                      {getActionLabel(listing.type)}
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                    </button>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
