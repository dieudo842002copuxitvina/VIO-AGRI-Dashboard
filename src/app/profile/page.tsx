'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import {
  ArrowRight,
  BarChart3,
  Eye,
  ImageOff,
  PackageOpen,
  Plus,
  Sparkles,
} from 'lucide-react'
import { getSupabaseBrowserClient } from '@/lib/supabase'

type ListingType = 'sell' | 'buy'

type ListingRecord = {
  id: string
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

function normalizeCommodity(value: string | null | undefined): string {
  const normalized = value?.trim().toLowerCase() ?? ''

  if (normalized === 'coffee') return 'Cà phê'
  if (normalized === 'pepper') return 'Hồ tiêu'
  if (normalized === 'rice') return 'Lúa gạo'
  if (normalized === 'cashew') return 'Hạt điều'

  return value?.trim() || 'Nông sản giao dịch'
}

function normalizeType(value: string | null | undefined): ListingType {
  return value === 'buy' ? 'buy' : 'sell'
}

function normalizeStatus(value: string | null | undefined): string {
  const normalized = value?.trim().toLowerCase() ?? 'active'

  if (normalized === 'active') return 'Đang hiển thị'
  if (normalized === 'closed') return 'Đã đóng'
  if (normalized === 'pending') return 'Chờ duyệt'

  return value?.trim() || 'Đang cập nhật'
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

  return parsed.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function ListingCardSkeleton() {
  return (
    <div className="rounded-[1.75rem] border border-gray-200 bg-white p-6 shadow-sm">
      <div className="animate-pulse space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="h-7 w-20 rounded-full bg-gray-200" />
          <div className="h-7 w-24 rounded-full bg-gray-200" />
        </div>
        <div className="h-7 w-4/5 rounded-xl bg-gray-200" />
        <div className="h-5 w-2/5 rounded-lg bg-gray-200" />
        <div className="space-y-2">
          <div className="h-4 w-full rounded bg-gray-200" />
          <div className="h-4 w-5/6 rounded bg-gray-200" />
        </div>
        <div className="h-14 w-full rounded-2xl bg-gray-200" />
        <div className="flex items-center justify-between gap-3 pt-2">
          <div className="h-4 w-28 rounded bg-gray-200" />
          <div className="h-4 w-24 rounded bg-gray-200" />
        </div>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [listings, setListings] = useState<ListingRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadProfileDashboard() {
      try {
        const supabase = getSupabaseBrowserClient()
        const {
          data: { user: currentUser },
          error: authError,
        } = await supabase.auth.getUser()

        if (!isMounted) {
          return
        }

        if (authError || !currentUser) {
          router.replace('/login')
          return
        }

        setUser(currentUser)

        const { data, error: listingsError } = await supabase
          .from('listings')
          .select('*')
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: false })

        if (!isMounted) {
          return
        }

        if (listingsError) {
          console.error(`[Profile] Failed to fetch listings: ${listingsError.message}`)
          setError('Không thể tải danh sách tin đăng lúc này. Vui lòng thử lại sau.')
          setListings([])
          return
        }

        setListings(Array.isArray(data) ? (data as ListingRecord[]) : [])
      } catch (fetchError) {
        if (!isMounted) {
          return
        }

        console.error('[Profile] Unexpected dashboard error:', fetchError)
        setError('Đã có lỗi xảy ra khi tải dashboard cá nhân.')
        setListings([])
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadProfileDashboard()

    return () => {
      isMounted = false
    }
  }, [router])

  const activeListingsCount = useMemo(
    () => listings.filter((item) => (item.status ?? '').toLowerCase() === 'active').length,
    [listings]
  )

  const listingCards = listings.map((listing) => {
    const commodity = normalizeCommodity(listing.commodity)
    const type = normalizeType(listing.type)
    const quantity = normalizeNumber(listing.quantity)
    const price = normalizeNumber(listing.price)
    const typeBadgeClassName =
      type === 'sell'
        ? 'bg-green-100 text-green-800 border border-green-200'
        : 'bg-blue-100 text-blue-800 border border-blue-200'

    return {
      ...listing,
      commodity,
      quantity,
      price,
      type,
      typeLabel: type === 'sell' ? 'Bán' : 'Mua',
      typeBadgeClassName,
      statusLabel: normalizeStatus(listing.status),
      createdAtLabel: formatDate(listing.created_at),
      title: listing.title?.trim() || 'Tin giao thương chưa đặt tiêu đề',
      description:
        listing.description?.trim() || 'Tin đăng chưa có mô tả chi tiết. Hãy cập nhật để tăng tỷ lệ phản hồi.',
      image_url: listing.image_url,
    }
  })

  return (
    <main className="min-h-screen bg-gray-50 text-gray-950">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <section className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm shadow-gray-950/5 sm:p-8 lg:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                <Sparkles className="h-4 w-4" />
                Dashboard cá nhân
              </span>
              <h1 className="mt-5 text-3xl font-semibold tracking-tight text-gray-950 sm:text-4xl">
                Xin chào, {user?.email || 'đối tác VIO AGRI'}
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-gray-600">
                Quản lý toàn bộ tin đăng B2B của bạn trong một không gian riêng tư, rõ ràng và tối ưu cho giao dịch doanh nghiệp.
              </p>
            </div>

            <Link
              href="/b2b/post"
              className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700"
            >
              <Plus className="h-5 w-5" />
              Đăng tin mới
            </Link>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-[1.5rem] border border-gray-200 bg-gray-50 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Tổng tin đăng</p>
                  <p className="mt-3 text-3xl font-semibold text-gray-950">{isLoading ? '...' : listings.length}</p>
                  <p className="mt-1 text-sm text-gray-600">Tổng số tin bạn đã tạo trên sàn</p>
                </div>
                <div className="rounded-2xl bg-white p-3 text-emerald-700 shadow-sm">
                  <BarChart3 className="h-5 w-5" />
                </div>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-gray-200 bg-gray-50 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Tin đang hiển thị</p>
                  <p className="mt-3 text-3xl font-semibold text-gray-950">{isLoading ? '...' : activeListingsCount}</p>
                  <p className="mt-1 text-sm text-gray-600">Những cơ hội đang mở cho đối tác</p>
                </div>
                <div className="rounded-2xl bg-white p-3 text-blue-700 shadow-sm">
                  <PackageOpen className="h-5 w-5" />
                </div>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-gray-200 bg-gray-50 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Lượt xem</p>
                  <p className="mt-3 text-3xl font-semibold text-gray-950">0</p>
                  <p className="mt-1 text-sm text-gray-600">Sắp ra mắt cùng bộ phân tích quan tâm</p>
                </div>
                <div className="rounded-2xl bg-white p-3 text-amber-700 shadow-sm">
                  <Eye className="h-5 w-5" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-500">Danh mục riêng của bạn</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-gray-950">Tin đăng đang quản lý</h2>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              <ListingCardSkeleton />
              <ListingCardSkeleton />
              <ListingCardSkeleton />
            </div>
          ) : error ? (
            <div className="rounded-[1.75rem] border border-red-200 bg-red-50 px-6 py-5 text-sm font-medium text-red-700">
              {error}
            </div>
          ) : listingCards.length === 0 ? (
            <div className="rounded-[1.75rem] border border-gray-200 bg-white px-6 py-10 text-center shadow-sm">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                <PackageOpen className="h-7 w-7" />
              </div>
              <h3 className="mt-5 text-2xl font-semibold tracking-tight text-gray-950">
                Bạn chưa có tin đăng nào.
              </h3>
              <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-gray-600">
                Tạo listing đầu tiên để bắt đầu kết nối nhà mua, nhà bán và đưa hàng hóa của bạn lên sàn giao thương B2B.
              </p>
              <Link
                href="/b2b/post"
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                Tạo tin đăng đầu tiên
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {listingCards.map((item) => (
                <article
                  key={item.id}
                  className="rounded-[1.75rem] border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md overflow-hidden flex flex-col h-full"
                >
                  {/* Image Container */}
                  <div className="relative h-40 w-full overflow-hidden bg-gray-100">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                        <ImageOff className="h-8 w-8 text-gray-400" />
                        <p className="mt-2 text-xs font-medium text-gray-500">Chưa có hình ảnh</p>
                      </div>
                    )}
                    {/* Badges overlay */}
                    <div className="absolute left-3 right-3 top-3 flex items-start justify-between gap-2">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${item.typeBadgeClassName}`}>
                        {item.typeLabel}
                      </span>
                      <span className="inline-flex rounded-full border border-white/30 bg-white/95 backdrop-blur-sm px-2 py-1 text-xs font-medium text-gray-600">
                        {item.commodity}
                      </span>
                    </div>
                  </div>

                  {/* Content Container */}
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="text-lg font-semibold tracking-tight text-gray-950 line-clamp-2">{item.title}</h3>
                    <p className="mt-2.5 text-sm leading-6 text-gray-600 line-clamp-2">{item.description}</p>

                    <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                      <p className="text-sm leading-6 text-gray-700">
                        <span className="font-bold text-emerald-600">{formatPrice(item.price, item.commodity)}</span>
                        {' '}- {formatQuantity(item.quantity)}
                      </p>
                    </div>

                    <div className="mt-auto flex items-center justify-between gap-3 border-t border-gray-100 pt-4 text-sm text-gray-500">
                      <span>{item.createdAtLabel}</span>
                      <span className="font-medium text-gray-700">Trạng thái: {item.statusLabel}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
