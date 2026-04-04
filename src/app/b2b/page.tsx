'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, ImageOff, Loader2, PackageOpen, Plus, Sparkles } from 'lucide-react'
import { getSupabaseBrowserClient } from '@/lib/supabase'

type ListingType = 'sell' | 'buy'

type ListingRecord = {
  id: string
  user_id: string
  title: string | null
  commodity: string | null
  type: string | null
  quantity: number | string | null
  price: number | string | null
  description: string | null
  status: string | null
  created_at: string | null
  image_url?: string | null
}

type CategoryLabel = 'Tất cả' | 'Cà phê' | 'Hồ tiêu' | 'Lúa gạo' | 'Hạt điều' | 'Khác'

type ListingCardViewModel = {
  id: string
  user_id: string
  title: string
  commodity: string
  type: ListingType
  quantity: number
  price: number
  description: string
  createdAtLabel: string
  image_url?: string | null
}

const categoryTabs: CategoryLabel[] = ['Tất cả', 'Cà phê', 'Hồ tiêu', 'Lúa gạo', 'Hạt điều', 'Khác']

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

function normalizeCommodity(value: string | null | undefined): CategoryLabel {
  const normalized = value?.trim().toLowerCase() ?? ''

  if (normalized === 'coffee' || normalized === 'cà phê' || normalized === 'ca phe') return 'Cà phê'
  if (normalized === 'pepper' || normalized === 'hồ tiêu' || normalized === 'ho tieu') return 'Hồ tiêu'
  if (normalized === 'rice' || normalized === 'lúa gạo' || normalized === 'lua gao') return 'Lúa gạo'
  if (normalized === 'cashew' || normalized === 'hạt điều' || normalized === 'hat dieu') return 'Hạt điều'

  return 'Khác'
}

function normalizeType(value: string | null | undefined): ListingType {
  return value === 'buy' ? 'buy' : 'sell'
}

function getPriceUnit(commodity: string): 'VNĐ/kg' | 'USD/tấn' {
  const normalized = commodity.trim().toLowerCase()

  if (normalized === 'lúa gạo' || normalized === 'hạt điều' || normalized === 'rice' || normalized === 'cashew') {
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
  return `${new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: 1,
  }).format(value || 0)} Tấn`
}

function formatDate(value: string | null): string {
  if (!value) {
    return 'Vừa đăng gần đây'
  }

  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return 'Vừa đăng gần đây'
  }

  return `Đăng ngày ${parsed.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })}`
}

function ListingSkeleton() {
  return (
    <div className="rounded-[1.5rem] border border-gray-200 bg-white p-6 shadow-sm">
      <div className="animate-pulse space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="h-7 w-20 rounded-full bg-gray-200" />
          <div className="h-7 w-16 rounded-full bg-gray-200" />
        </div>
        <div className="h-8 w-4/5 rounded-xl bg-gray-200" />
        <div className="h-5 w-28 rounded-lg bg-gray-200" />
        <div className="h-12 w-full rounded-2xl bg-gray-200" />
        <div className="space-y-2">
          <div className="h-4 w-full rounded bg-gray-200" />
          <div className="h-4 w-4/5 rounded bg-gray-200" />
        </div>
        <div className="h-12 w-full rounded-2xl bg-gray-200" />
        <div className="h-4 w-28 rounded bg-gray-200" />
      </div>
    </div>
  )
}

export default function B2BMarketplacePage() {
  const router = useRouter()
  const [listings, setListings] = useState<ListingRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<CategoryLabel>('Tất cả')
  const [error, setError] = useState('')
  const [dealInitiating, setDealInitiating] = useState<string | null>(null)
  const [dealError, setDealError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadListings() {
      try {
        const supabase = getSupabaseBrowserClient()
        const { data, error: listingsError } = await supabase
          .from('listings')
          .select('*')
          .eq('status', 'active')
          .order('created_at', { ascending: false })

        if (!isMounted) {
          return
        }

        if (listingsError) {
          console.error(`[B2B] Failed to fetch listings: ${listingsError.message}`)
          setError('Không thể tải dữ liệu chợ lúc này. Vui lòng thử lại sau.')
          setListings([])
          return
        }

        setListings(Array.isArray(data) ? (data as ListingRecord[]) : [])
      } catch (fetchError) {
        if (!isMounted) {
          return
        }

        console.error('[B2B] Unexpected marketplace error:', fetchError)
        setError('Đã có lỗi xảy ra khi tải sàn giao thương.')
        setListings([])
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadListings()

    return () => {
      isMounted = false
    }
  }, [])

  const listingCards = useMemo<ListingCardViewModel[]>(() => {
    return listings.map((listing) => {
      const commodity = normalizeCommodity(listing.commodity)

      return {
        id: listing.id,
        user_id: listing.user_id,
        title: listing.title?.trim() || 'Tin giao thương chưa đặt tiêu đề',
        commodity,
        type: normalizeType(listing.type),
        quantity: normalizeNumber(listing.quantity),
        price: normalizeNumber(listing.price),
        description:
          listing.description?.trim() ||
          'Tin đăng chưa có mô tả chi tiết. Nhấn vào để bắt đầu kết nối và thương lượng.',
        createdAtLabel: formatDate(listing.created_at),
        image_url: listing.image_url,
      }
    })
  }, [listings])

  const filteredListings = useMemo(() => {
    if (activeCategory === 'Tất cả') {
      return listingCards
    }

    return listingCards.filter((listing) => listing.commodity === activeCategory)
  }, [activeCategory, listingCards])

  const handleInitiateDeal = async (listing: ListingCardViewModel) => {
    try {
      setDealInitiating(listing.id)
      setDealError('')

      const supabase = getSupabaseBrowserClient()
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        router.push('/login')
        return
      }

      if (user.id === listing.user_id) {
        setDealError('Bạn không thể tự thương lượng với lô hàng của chính mình.')
        setDealInitiating(null)
        return
      }

      const { data: deal, error: dealError } = await supabase
        .from('deals')
        .insert({
          listing_id: listing.id,
          buyer_id: user.id,
          seller_id: listing.user_id,
          status: 'pending',
        })
        .select()
        .single()

      if (dealError) {
        setDealError(dealError.message || 'Không thể tạo phòng thương lượng. Vui lòng thử lại.')
        setDealInitiating(null)
        return
      }

      if (deal?.id) {
        router.push(`/b2b/deal/${deal.id}`)
      }
    } catch (error) {
      console.error('[B2B] Deal initiation error:', error)
      setDealError('Đã có lỗi xảy ra. Vui lòng thử lại sau.')
      setDealInitiating(null)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 text-gray-950">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <section className="overflow-hidden rounded-[2rem] bg-emerald-900 px-6 py-8 text-white shadow-[0_24px_80px_-40px_rgba(6,78,59,0.85)] sm:px-8 sm:py-10 lg:px-10">
          <div className="max-w-4xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-100">
              <Sparkles className="h-4 w-4" />
              Marketplace công khai
            </span>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Sàn Giao Thương Nông Sản B2B
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-emerald-50/85">
              Kết nối trực tiếp nguồn cung uy tín với doanh nghiệp thu mua.
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/b2b/post"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-50"
            >
              <Plus className="h-4 w-4" />
              Đăng tin mới
            </Link>
            <div className="inline-flex items-center rounded-2xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-medium text-emerald-50/90">
              {isLoading ? 'Đang tải dữ liệu thị trường...' : `${filteredListings.length} cơ hội đang hiển thị`}
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[1.75rem] border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex gap-3 overflow-x-auto pb-1">
            {categoryTabs.map((category) => {
              const isActive = activeCategory === category

              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  className={`whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/25'
                      : 'border border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 hover:bg-white hover:text-gray-900'
                  }`}
                >
                  {category}
                </button>
              )
            })}
          </div>
        </section>

        <section className="mt-8">
          {isLoading ? (
            <div className="rounded-[1.75rem] border border-gray-200 bg-white px-6 py-6 shadow-sm">
              <div className="mb-6 flex items-center gap-3 text-gray-700">
                <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                <p className="text-sm font-medium">Đang tải các lô hàng đang mở trên toàn hệ thống...</p>
              </div>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                <ListingSkeleton />
                <ListingSkeleton />
                <ListingSkeleton />
              </div>
            </div>
          ) : error ? (
            <div className="rounded-[1.75rem] border border-red-200 bg-red-50 px-6 py-5 text-sm font-medium text-red-700">
              {error}
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="rounded-[1.75rem] border border-gray-200 bg-white px-6 py-12 text-center shadow-sm">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                <PackageOpen className="h-7 w-7" />
              </div>
              <h2 className="mt-5 text-2xl font-semibold tracking-tight text-gray-950">
                Chưa có tin phù hợp với nhóm “{activeCategory}”.
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-gray-600">
                Hãy thử chuyển sang danh mục khác hoặc trở thành người đầu tiên đăng lô hàng mới cho khu vực này.
              </p>
              <Link
                href="/b2b/post"
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                Đăng tin cho danh mục này
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredListings.map((listing) => {
                const isSell = listing.type === 'sell'
                const typeLabel = isSell ? 'Bán' : 'Mua'
                const typeClassName = isSell
                  ? 'bg-green-100 text-green-800 border border-green-200'
                  : 'bg-blue-100 text-blue-800 border border-blue-200'

                return (
                  <article
                    key={listing.id}
                    className="flex h-full flex-col rounded-[1.5rem] border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg overflow-hidden"
                  >
                    {/* Image Container */}
                    <div className="relative h-48 w-full overflow-hidden bg-gray-100">
                      {listing.image_url ? (
                        <img
                          src={listing.image_url}
                          alt={listing.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                          <ImageOff className="h-10 w-10 text-gray-400" />
                          <p className="mt-2 text-xs font-medium text-gray-500">Chưa có hình ảnh</p>
                        </div>
                      )}
                      {/* Badges overlay */}
                      <div className="absolute left-3 right-3 top-3 flex items-start justify-between gap-3">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${typeClassName}`}>
                          {typeLabel}
                        </span>
                        <span className="inline-flex rounded-full border border-white/30 bg-white/95 backdrop-blur-sm px-3 py-1 text-xs font-medium text-gray-600">
                          {listing.commodity}
                        </span>
                      </div>
                    </div>

                    {/* Content Container */}
                    <div className="flex flex-1 flex-col p-6">
                      <h3 className="text-2xl font-semibold tracking-tight text-gray-950 line-clamp-2">
                        {listing.title}
                      </h3>

                      <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4">
                        <p className="text-base leading-7 text-gray-700">
                          <span className="font-bold text-emerald-600">{formatPrice(listing.price, listing.commodity)}</span>
                          {' '}- {formatQuantity(listing.quantity)}
                        </p>
                      </div>

                      <p className="mt-4 line-clamp-2 text-sm leading-7 text-gray-600">
                        {listing.description}
                      </p>

                      <div className="mt-auto pt-6">
                        <button
                          type="button"
                          onClick={() => handleInitiateDeal(listing)}
                          disabled={dealInitiating === listing.id}
                          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gray-950 px-5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:opacity-70"
                        >
                          {dealInitiating === listing.id ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Đang tạo phòng...
                            </>
                          ) : (
                            <>
                              Thương lượng ngay
                              <ArrowRight className="h-4 w-4" />
                            </>
                          )}
                        </button>

                        <p className="mt-4 text-sm text-gray-500">{listing.createdAtLabel}</p>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </div>

      {dealError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-lg">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">Lỗi</h3>
                <p className="mt-2 text-sm text-gray-600">{dealError}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setDealError('')}
              className="mt-6 w-full rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900 transition hover:bg-gray-200"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
