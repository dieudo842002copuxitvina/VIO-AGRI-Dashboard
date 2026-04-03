'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  CheckCircle2,
  Loader2,
  LockKeyhole,
  MessageSquareText,
  RefreshCw,
  SendHorizonal,
} from 'lucide-react'

type ListingType = 'sell' | 'buy'

type DealListing = {
  id: string
  type: ListingType
  commodity: string
  quantity: number
  price: number
  businessName: string
  trustScore: number | null
  verified: boolean
}

type ChatMessage = {
  id: string
  sender: 'partner' | 'you'
  content: string
  timeLabel: string
}

const commodityLabels = {
  coffee: 'Cà phê',
  pepper: 'Hồ tiêu',
  rice: 'Lúa gạo',
  cashew: 'Hạt điều',
} as const

const typeMeta: Record<ListingType, { label: string; badgeClassName: string }> = {
  sell: {
    label: 'Bán',
    badgeClassName: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
  buy: {
    label: 'Mua',
    badgeClassName: 'border-blue-200 bg-blue-50 text-blue-700',
  },
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

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

  if (normalized in commodityLabels) {
    return commodityLabels[normalized as keyof typeof commodityLabels]
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
  return `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(value || 0)} Tấn`
}

function formatTrustScore(value: number | null): string {
  if (value === null) {
    return 'Đang cập nhật'
  }

  const safeValue = Math.max(0, Math.min(100, Math.round(value)))
  return `${safeValue}/100`
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

function normalizeListing(raw: unknown, index: number): DealListing | null {
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
    businessName: toSafeText(record.business_name, 'Đối tác đang cập nhật hồ sơ'),
    trustScore: toOptionalNumber(record.trust_score),
    verified: Boolean(record.verified),
  }
}

function buildInitialMessages(listing: DealListing): ChatMessage[] {
  return [
    {
      id: `partner-${listing.id}`,
      sender: 'partner',
      content: `Chào bạn, tôi muốn lấy toàn bộ lô ${listing.commodity.toLowerCase()} này nhưng giá giảm 5% được không?`,
      timeLabel: '09:14',
    },
    {
      id: `you-${listing.id}`,
      sender: 'you',
      content: 'Tôi có thể linh hoạt nếu chốt nhanh trong hôm nay và giữ đúng số lượng như tin đăng.',
      timeLabel: '09:18',
    },
  ]
}

export default function DealRoomPage() {
  const params = useParams<{ id: string | string[] }>()
  const listingId = Array.isArray(params?.id) ? params.id[0] : params?.id ?? ''
  const dealReference = listingId ? listingId.slice(0, 8).toUpperCase() : 'DEALROOM'

  const [listing, setListing] = useState<DealListing | null>(null)
  const [counterPrice, setCounterPrice] = useState('')
  const [counterQuantity, setCounterQuantity] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draftMessage, setDraftMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  const [isConfirmingDeal, setIsConfirmingDeal] = useState(false)
  const [dealConfirmed, setDealConfirmed] = useState(false)

  useEffect(() => {
    let isMounted = true
    const controller = new AbortController()

    async function loadListing() {
      if (!listingId) {
        setError('Không tìm thấy mã deal hợp lệ.')
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)
      setDealConfirmed(false)

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
              : 'Không thể tải dữ liệu deal room lúc này.'

          throw new Error(message)
        }

        const matchedListing = parseListingsPayload(payload)
          .map((item, index) => normalizeListing(item, index))
          .filter((item): item is DealListing => item !== null)
          .find((item) => item.id === listingId)

        if (!matchedListing) {
          throw new Error('Không tìm thấy listing tương ứng cho phòng thương lượng này.')
        }

        if (!isMounted) {
          return
        }

        setListing(matchedListing)
        setCounterPrice(String(matchedListing.price))
        setCounterQuantity(String(matchedListing.quantity))
        setMessages(buildInitialMessages(matchedListing))
        setDraftMessage('')
      } catch (fetchError) {
        if (!isMounted || controller.signal.aborted) {
          return
        }

        setListing(null)
        setMessages([])
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : 'Không thể tải dữ liệu deal room lúc này.',
        )
      } finally {
        if (isMounted && !controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    void loadListing()

    return () => {
      isMounted = false
      controller.abort()
    }
  }, [listingId, reloadKey])

  const priceValue = Number(counterPrice)
  const quantityValue = Number(counterQuantity)
  const priceDelta =
    listing && Number.isFinite(priceValue) && listing.price > 0
      ? ((priceValue - listing.price) / listing.price) * 100
      : 0
  const quantityDelta =
    listing && Number.isFinite(quantityValue) ? quantityValue - listing.quantity : 0

  async function handleSendMessage() {
    const nextMessage = draftMessage.trim()

    if (!nextMessage || isSendingMessage) {
      return
    }

    setIsSendingMessage(true)
    await wait(250)

    setMessages((current) => [
      ...current,
      {
        id: `msg-${Date.now()}`,
        sender: 'you',
        content: nextMessage,
        timeLabel: new Date().toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      },
    ])
    setDraftMessage('')
    setIsSendingMessage(false)
  }

  async function handleConfirmDeal() {
    if (
      !listing ||
      !Number.isFinite(priceValue) ||
      priceValue <= 0 ||
      !Number.isFinite(quantityValue) ||
      quantityValue <= 0
    ) {
      setError('Vui lòng nhập giá thương lượng và số lượng chốt hợp lệ trước khi xác nhận.')
      return
    }

    setError(null)
    setIsConfirmingDeal(true)
    await wait(1400)
    setIsConfirmingDeal(false)
    setDealConfirmed(true)
  }

  return (
    <main className="min-h-screen bg-gray-50 text-stone-950">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <section className="overflow-hidden rounded-[2.5rem] border border-stone-200 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.14),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.12),_transparent_28%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-6 shadow-sm shadow-stone-950/5 lg:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Link
                href="/b2b"
                className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-600 transition hover:border-stone-300 hover:text-stone-900"
              >
                <ArrowLeft className="h-4 w-4" />
                Quay lại sàn giao thương
              </Link>
              <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">
                <LockKeyhole className="h-4 w-4" />
                Secure Deal Room
              </div>
              <h1 className="mt-5 text-4xl font-semibold tracking-tight text-stone-950 sm:text-5xl">
                Phòng Thương Lượng
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-8 text-stone-600">
                Không gian chốt giá và số lượng theo chuẩn giao dịch B2B, tối ưu cho độ tin cậy,
                tốc độ phản hồi và xác nhận thỏa thuận rõ ràng giữa hai bên.
              </p>
            </div>

            <div className="rounded-[1.75rem] border border-stone-200 bg-white/90 p-5 shadow-sm shadow-stone-950/5 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">Deal reference</p>
              <p className="mt-3 text-2xl font-semibold tracking-[0.14em] text-stone-950">#{dealReference}</p>
              <p className="mt-2 text-sm text-stone-600">Phiên thương lượng được theo dõi trong môi trường riêng tư.</p>
            </div>
          </div>
        </section>

        {loading ? (
          <section className="mt-8 grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
            <div className="space-y-6">
              {[0, 1].map((item) => (
                <div
                  key={item}
                  className="animate-pulse rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm shadow-stone-950/5"
                >
                  <div className="h-5 w-40 rounded bg-stone-200" />
                  <div className="mt-4 h-10 rounded-[1.25rem] bg-stone-200" />
                  <div className="mt-4 h-24 rounded-[1.5rem] bg-stone-200" />
                </div>
              ))}
            </div>
            <div className="animate-pulse rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm shadow-stone-950/5">
              <div className="h-5 w-48 rounded bg-stone-200" />
              <div className="mt-4 h-14 rounded-[1.25rem] bg-stone-200" />
              <div className="mt-4 h-14 rounded-[1.25rem] bg-stone-200" />
              <div className="mt-6 h-80 rounded-[1.5rem] bg-stone-200" />
              <div className="mt-6 h-16 rounded-[1.25rem] bg-stone-200" />
            </div>
          </section>
        ) : error && !listing ? (
          <section className="mt-8 rounded-[2rem] border border-red-200 bg-white p-6 shadow-sm shadow-stone-950/5 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-lg font-semibold text-red-900">Không thể mở phòng thương lượng</p>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-red-700">{error}</p>
              </div>
              <button
                type="button"
                onClick={() => setReloadKey((current) => current + 1)}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-stone-300 bg-white px-5 py-3 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:bg-stone-50"
              >
                <RefreshCw className="h-4 w-4" />
                Tải lại
              </button>
            </div>
          </section>
        ) : listing ? (
          <section className="mt-8 grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
            <div className="space-y-6">
              <article className="overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-sm shadow-stone-950/5">
                <div className="border-b border-stone-100 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.14),_transparent_36%),linear-gradient(180deg,#ffffff_0%,#fafaf9_100%)] px-6 py-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
                      Đang thương lượng
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${typeMeta[listing.type].badgeClassName}`}
                    >
                      {typeMeta[listing.type].label}
                    </span>
                  </div>
                  <h2 className="mt-4 text-2xl font-semibold tracking-tight text-stone-950">Tóm tắt đơn hàng</h2>
                  <p className="mt-2 text-sm leading-6 text-stone-600">
                    Thông tin gốc của listing được giữ làm mốc để hai bên đối chiếu xuyên suốt phiên thương lượng.
                  </p>
                </div>

                <div className="space-y-5 px-6 py-6">
                  <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">Nông sản</p>
                    <p className="mt-3 text-3xl font-semibold tracking-tight text-stone-950">{listing.commodity}</p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                    <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">Số lượng ban đầu</p>
                      <p className="mt-3 text-2xl font-semibold text-stone-950">{formatQuantity(listing.quantity)}</p>
                    </div>
                    <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">Mức giá ban đầu</p>
                      <p className="mt-3 text-2xl font-semibold text-stone-950">{formatPrice(listing.price, listing.commodity)}</p>
                    </div>
                  </div>
                </div>
              </article>

              <article className="overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-sm shadow-stone-950/5">
                <div className="border-b border-stone-100 px-6 py-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">Trust Profile</p>
                  <h2 className="mt-3 text-2xl font-semibold tracking-tight text-stone-950">Hồ sơ đối tác</h2>
                </div>

                <div className="space-y-5 px-6 py-6">
                  <div className="flex items-start gap-4 rounded-[1.5rem] border border-stone-200 bg-stone-50 p-5">
                    <div className="rounded-2xl bg-white p-3 text-stone-700 shadow-sm">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">Doanh nghiệp</p>
                      <p className="mt-2 text-lg font-semibold text-stone-950">{listing.businessName}</p>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                    <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">Trust Score</p>
                      <p className="mt-3 text-3xl font-semibold text-stone-950">{formatTrustScore(listing.trustScore)}</p>
                      <p className="mt-2 text-sm text-stone-600">điểm đánh giá độ tin cậy trên hệ thống</p>
                    </div>
                    <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">Xác minh</p>
                      {listing.verified ? (
                        <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                          <BadgeCheck className="h-4 w-4" />
                          Verified Badge
                        </div>
                      ) : (
                        <p className="mt-3 text-sm font-semibold text-stone-700">Chưa xác minh</p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-[1.5rem] border border-emerald-100 bg-emerald-50/70 p-5 text-sm leading-6 text-emerald-900">
                    Giao dịch diễn ra trong không gian riêng giúp hai bên chốt giá, sản lượng và điều khoản với tín hiệu tin cậy rõ ràng hơn.
                  </div>
                </div>
              </article>
            </div>

            {dealConfirmed ? (
              <article className="flex min-h-[720px] items-center justify-center overflow-hidden rounded-[2rem] border border-emerald-200 bg-white p-6 shadow-sm shadow-stone-950/5 sm:p-10">
                <div className="w-full max-w-2xl text-center">
                  <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 shadow-[0_20px_60px_-24px_rgba(16,185,129,0.45)]">
                    <CheckCircle2 className="h-12 w-12" />
                  </div>
                  <p className="mt-8 text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">Deal Recorded</p>
                  <h2 className="mt-4 text-4xl font-semibold tracking-tight text-stone-950">Giao dịch đã được ghi nhận</h2>
                  <p className="mx-auto mt-4 max-w-xl text-base leading-8 text-stone-600">
                    Chờ đối tác xác nhận! Báo giá cuối cùng và số lượng chốt đã được lưu vào phiên thương lượng này.
                  </p>

                  <div className="mt-8 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-5 text-left">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">Giá chốt đề xuất</p>
                      <p className="mt-3 text-2xl font-semibold text-stone-950">{formatPrice(priceValue, listing.commodity)}</p>
                    </div>
                    <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-5 text-left">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">Số lượng chốt</p>
                      <p className="mt-3 text-2xl font-semibold text-stone-950">{formatQuantity(quantityValue)}</p>
                    </div>
                  </div>

                  <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                    <Link
                      href="/b2b"
                      className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                    >
                      Về lại marketplace
                    </Link>
                    <button
                      type="button"
                      onClick={() => setDealConfirmed(false)}
                      className="inline-flex items-center justify-center rounded-full border border-stone-300 bg-white px-6 py-3 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:bg-stone-50"
                    >
                      Quay lại phòng thương lượng
                    </button>
                  </div>
                </div>
              </article>
            ) : (
              <article className="overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-sm shadow-stone-950/5">
                <div className="border-b border-stone-100 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.10),_transparent_34%),linear-gradient(180deg,#ffffff_0%,#fafafa_100%)] px-6 py-6 sm:px-8">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">Bảng Báo Giá</p>
                      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-stone-950">Đề xuất mới cho giao dịch này</h2>
                      <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-600">
                        Điều chỉnh giá và khối lượng, trao đổi nhanh trong khung chat, sau đó khóa deal bằng xác nhận cuối cùng.
                      </p>
                    </div>

                    <div className="rounded-[1.5rem] border border-stone-200 bg-white px-5 py-4 shadow-sm shadow-stone-950/5">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">Quote preview</p>
                      <p className="mt-3 text-lg font-semibold text-stone-950">{formatPrice(priceValue || 0, listing.commodity)}</p>
                      <p className="mt-1 text-sm text-stone-600">{formatQuantity(quantityValue || 0)}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-8 px-6 py-6 sm:px-8 sm:py-8">
                  {error && (
                    <div className="rounded-[1.25rem] border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                      {error}
                    </div>
                  )}

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block">
                      <span className="text-sm font-semibold text-stone-900">Giá thương lượng</span>
                      <div className="relative mt-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          inputMode="decimal"
                          value={counterPrice}
                          onChange={(event) => setCounterPrice(event.target.value)}
                          className="h-14 w-full rounded-[1.25rem] border border-stone-200 bg-stone-50 px-4 pr-28 text-base text-stone-950 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                        />
                        <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm font-medium text-stone-500">
                          {getPriceUnit(listing.commodity)}
                        </span>
                      </div>
                    </label>

                    <label className="block">
                      <span className="text-sm font-semibold text-stone-900">Số lượng chốt</span>
                      <div className="relative mt-2">
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          inputMode="decimal"
                          value={counterQuantity}
                          onChange={(event) => setCounterQuantity(event.target.value)}
                          className="h-14 w-full rounded-[1.25rem] border border-stone-200 bg-stone-50 px-4 pr-16 text-base text-stone-950 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                        />
                        <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm font-medium text-stone-500">Tấn</span>
                      </div>
                    </label>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">Biến động giá</p>
                      <p className={`mt-3 text-2xl font-semibold ${priceDelta <= 0 ? 'text-emerald-700' : 'text-blue-700'}`}>
                        {priceDelta > 0 ? '+' : ''}{priceDelta.toFixed(1)}%
                      </p>
                    </div>
                    <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">Biến động khối lượng</p>
                      <p className={`mt-3 text-2xl font-semibold ${quantityDelta < 0 ? 'text-amber-700' : 'text-stone-950'}`}>
                        {quantityDelta > 0 ? '+' : ''}{new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(quantityDelta)} Tấn
                      </p>
                    </div>
                    <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">Trạng thái deal</p>
                      <p className="mt-3 text-2xl font-semibold text-stone-950">Chờ hai bên chốt</p>
                    </div>
                  </div>

                  <div className="rounded-[1.75rem] border border-stone-200 bg-stone-50 p-4 sm:p-5">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-white p-3 text-stone-700 shadow-sm">
                        <MessageSquareText className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-stone-950">Kênh trao đổi</p>
                        <p className="text-sm text-stone-600">Trao đổi nhanh về giá, chất lượng và điều khoản chốt deal.</p>
                      </div>
                    </div>

                    <div className="mt-5 h-[320px] space-y-4 overflow-y-auto rounded-[1.5rem] border border-stone-200 bg-white p-4 sm:p-5">
                      {messages.map((message) => {
                        const isMine = message.sender === 'you'

                        return (
                          <div key={message.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                            <div
                              className={`max-w-[85%] rounded-[1.35rem] px-4 py-3 shadow-sm ${
                                isMine
                                  ? 'bg-stone-950 text-white shadow-stone-950/10'
                                  : 'border border-stone-200 bg-stone-50 text-stone-900'
                              }`}
                            >
                              <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-70">
                                {isMine ? 'Bạn' : 'Đối tác'} · {message.timeLabel}
                              </p>
                              <p className="mt-2 text-sm leading-6">{message.content}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px]">
                      <input
                        type="text"
                        value={draftMessage}
                        onChange={(event) => setDraftMessage(event.target.value)}
                        placeholder="Nhập tin nhắn để trao đổi điều khoản..."
                        className="h-14 rounded-[1.25rem] border border-stone-200 bg-white px-4 text-base text-stone-950 outline-none transition placeholder:text-stone-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                      />
                      <button
                        type="button"
                        onClick={handleSendMessage}
                        disabled={isSendingMessage || draftMessage.trim().length === 0}
                        className="inline-flex h-14 items-center justify-center gap-2 rounded-[1.25rem] border border-stone-300 bg-white px-5 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:bg-stone-50 focus:outline-none focus:ring-4 focus:ring-stone-200 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isSendingMessage ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizonal className="h-4 w-4" />}
                        Gửi tin nhắn
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleConfirmDeal}
                    disabled={isConfirmingDeal}
                    className="inline-flex h-16 w-full items-center justify-center gap-3 rounded-[1.35rem] bg-emerald-600 px-6 text-base font-black tracking-[0.18em] text-white shadow-[0_24px_60px_-24px_rgba(5,150,105,0.55)] transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:bg-emerald-400 disabled:shadow-none"
                  >
                    {isConfirmingDeal ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Đang ghi nhận...
                      </>
                    ) : (
                      'XÁC NHẬN CHỐT DEAL'
                    )}
                  </button>
                </div>
              </article>
            )}
          </section>
        ) : null}
      </div>
    </main>
  )
}
