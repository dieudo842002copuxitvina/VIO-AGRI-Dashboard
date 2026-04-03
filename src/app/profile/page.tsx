'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  CircleGauge,
  Crown,
  FileText,
  Handshake,
  Plus,
  Rocket,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react'

type DashboardTab = 'listings' | 'deals'
type ListingType = 'sell' | 'buy'
type ListingStatus = 'active' | 'closed'
type DealStatus = 'negotiating' | 'completed'

type ListingRecord = {
  id: string
  commodity: string
  type: ListingType
  quantity: number
  price: string
  status: ListingStatus
}

type DealRecord = {
  id: string
  partner: string
  lot: string
  agreedPrice: string
  status: DealStatus
}

const businessName = 'Vựa Nông Sản Trường Phát'
const trustScore = 65

const mockListings: ListingRecord[] = [
  {
    id: 'listing-coffee-01',
    commodity: 'Cà phê Robusta',
    type: 'sell',
    quantity: 28,
    price: '82.500 VNĐ/kg',
    status: 'active',
  },
  {
    id: 'listing-rice-02',
    commodity: 'Lúa gạo ST25',
    type: 'buy',
    quantity: 45,
    price: '615 USD/tấn',
    status: 'active',
  },
  {
    id: 'listing-pepper-03',
    commodity: 'Hồ tiêu đen loại 1',
    type: 'sell',
    quantity: 12,
    price: '95.000 VNĐ/kg',
    status: 'closed',
  },
]

const mockDeals: DealRecord[] = [
  {
    id: 'listing-coffee-01',
    partner: 'Công ty Xuất khẩu Minh Hòa',
    lot: 'Cà phê Robusta · 28 Tấn',
    agreedPrice: '80.000 VNĐ/kg',
    status: 'negotiating',
  },
  {
    id: 'listing-rice-02',
    partner: 'An Phúc Foods',
    lot: 'Lúa gạo ST25 · 45 Tấn',
    agreedPrice: '610 USD/tấn',
    status: 'completed',
  },
]

const tabOptions: Array<{ id: DashboardTab; label: string; icon: typeof FileText }> = [
  { id: 'listings', label: 'Quản lý Tin Đăng', icon: FileText },
  { id: 'deals', label: 'Quản lý Giao Dịch', icon: Handshake },
]

const listingTypeMeta: Record<ListingType, { label: string; className: string }> = {
  sell: {
    label: 'Bán',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
  buy: {
    label: 'Mua',
    className: 'border-blue-200 bg-blue-50 text-blue-700',
  },
}

const listingStatusMeta: Record<ListingStatus, { label: string; className: string }> = {
  active: {
    label: 'Active',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
  closed: {
    label: 'Closed',
    className: 'border-stone-200 bg-stone-100 text-stone-600',
  },
}

const dealStatusMeta: Record<DealStatus, { label: string; className: string }> = {
  negotiating: {
    label: 'Đang thương lượng',
    className: 'border-amber-200 bg-amber-50 text-amber-700',
  },
  completed: {
    label: 'Đã hoàn thành',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
}

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<DashboardTab>('listings')

  const activeListingsCount = useMemo(
    () => mockListings.filter((item) => item.status === 'active').length,
    [],
  )
  const ongoingDealsCount = useMemo(
    () => mockDeals.filter((item) => item.status === 'negotiating').length,
    [],
  )

  return (
    <main className="min-h-screen bg-gray-50 text-stone-950">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <section className="overflow-hidden rounded-[2.5rem] border border-stone-200 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.15),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.10),_transparent_26%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-6 shadow-sm shadow-stone-950/5 lg:p-10">
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1.1fr)_380px] xl:items-end">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.26em] text-emerald-700">
                <ShieldCheck className="h-4 w-4" />
                Private Dashboard
              </span>
              <h1 className="mt-5 text-4xl font-semibold tracking-tight text-stone-950 sm:text-5xl">
                {businessName}
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-8 text-stone-600">
                Không gian quản lý riêng cho doanh nghiệp theo dõi độ uy tín, kiểm soát tin đăng,
                và chốt giao dịch trong một giao diện thống nhất theo phong cách agri-fintech.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-[1.75rem] border border-stone-200 bg-white/90 p-5 shadow-sm shadow-stone-950/5 backdrop-blur">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">Tin đang mở</p>
                  <p className="mt-3 text-3xl font-semibold text-stone-950">{activeListingsCount}</p>
                  <p className="mt-1 text-sm text-stone-600">listing còn hiệu lực trên sàn</p>
                </div>
                <div className="rounded-[1.75rem] border border-stone-200 bg-white/90 p-5 shadow-sm shadow-stone-950/5 backdrop-blur">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">Deal đang chạy</p>
                  <p className="mt-3 text-3xl font-semibold text-stone-950">{ongoingDealsCount}</p>
                  <p className="mt-1 text-sm text-stone-600">phiên thương lượng cần theo dõi</p>
                </div>
                <div className="rounded-[1.75rem] border border-stone-200 bg-white/90 p-5 shadow-sm shadow-stone-950/5 backdrop-blur">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">Hồ sơ doanh nghiệp</p>
                  <p className="mt-3 text-3xl font-semibold text-stone-950">Sẵn sàng nâng hạng</p>
                  <p className="mt-1 text-sm text-stone-600">bổ sung xác minh để tăng niềm tin</p>
                </div>
              </div>
            </div>

            <aside className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm shadow-stone-950/5 sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">Trust Score</p>
                  <h2 className="mt-3 text-4xl font-semibold tracking-tight text-stone-950">
                    {trustScore}/100
                  </h2>
                </div>
                <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
                  <CircleGauge className="h-6 w-6" />
                </div>
              </div>

              <div className="mt-6 h-3 overflow-hidden rounded-full bg-stone-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-300"
                  style={{ width: `${trustScore}%` }}
                />
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.4rem] border border-stone-200 bg-stone-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Tình trạng</p>
                  <p className="mt-2 text-sm font-semibold text-stone-950">Mức uy tín khá</p>
                </div>
                <div className="rounded-[1.4rem] border border-stone-200 bg-stone-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Gợi ý nâng điểm</p>
                  <p className="mt-2 text-sm font-semibold text-stone-950">Bổ sung xác minh pháp lý</p>
                </div>
              </div>

              <button
                type="button"
                className="mt-6 inline-flex w-full items-center justify-center rounded-[1.25rem] border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100"
              >
                Xác minh doanh nghiệp để tăng điểm
              </button>
            </aside>
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm shadow-stone-950/5 sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">Workspace</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-stone-950">
                Điều hành listings và giao dịch cá nhân
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-600">
                Chuyển nhanh giữa quản lý tin đăng và các deal đang diễn ra để tối ưu doanh thu,
                độ phủ hiển thị và tiến độ chốt đơn.
              </p>
            </div>

            <Link
              href="/b2b/post"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4" />
              Tạo tin mới
            </Link>
          </div>

          <div className="mt-8 inline-flex w-full flex-col gap-2 rounded-[1.5rem] border border-stone-200 bg-stone-50 p-2 sm:w-auto sm:flex-row">
            {tabOptions.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center justify-center gap-2 rounded-[1rem] px-5 py-3 text-sm font-semibold transition ${
                    isActive
                      ? 'bg-white text-stone-950 shadow-sm shadow-stone-950/5'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>

          {activeTab === 'listings' ? (
            <div className="mt-8 overflow-hidden rounded-[1.75rem] border border-stone-200 bg-white">
              <div className="hidden border-b border-stone-200 bg-stone-50 px-6 py-4 md:grid md:grid-cols-[1.5fr_1fr_1fr_1fr_1fr_140px] md:gap-4">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Nông sản</span>
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Phân loại</span>
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Số lượng</span>
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Giá</span>
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Trạng thái</span>
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Hành động</span>
              </div>

              <div className="divide-y divide-stone-200">
                {mockListings.map((listing) => {
                  const typeMeta = listingTypeMeta[listing.type]
                  const statusMeta = listingStatusMeta[listing.status]

                  return (
                    <div key={listing.id} className="px-5 py-5 sm:px-6">
                      <div className="grid gap-4 md:grid-cols-[1.5fr_1fr_1fr_1fr_1fr_140px] md:items-center md:gap-4">
                        <div>
                          <p className="text-base font-semibold text-stone-950">{listing.commodity}</p>
                          <p className="mt-1 text-sm text-stone-500">Mã tin: {listing.id}</p>
                        </div>

                        <div>
                          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 md:hidden">
                            Phân loại
                          </p>
                          <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${typeMeta.className}`}>
                            {typeMeta.label}
                          </span>
                        </div>

                        <div>
                          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 md:hidden">
                            Số lượng
                          </p>
                          <p className="text-sm font-semibold text-stone-900">{listing.quantity} Tấn</p>
                        </div>

                        <div>
                          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 md:hidden">
                            Giá
                          </p>
                          <p className="text-sm font-semibold text-stone-900">{listing.price}</p>
                        </div>

                        <div>
                          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 md:hidden">
                            Trạng thái
                          </p>
                          <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusMeta.className}`}>
                            {statusMeta.label}
                          </span>
                        </div>

                        <div>
                          {listing.status === 'active' ? (
                            <button
                              type="button"
                              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-700 transition hover:border-amber-300 hover:bg-amber-100 md:w-auto"
                            >
                              <Rocket className="h-4 w-4" />
                              Boost
                            </button>
                          ) : (
                            <span className="inline-flex items-center rounded-full border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm font-semibold text-stone-500">
                              Đã đóng
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="mt-8 overflow-hidden rounded-[1.75rem] border border-stone-200 bg-white">
              <div className="hidden border-b border-stone-200 bg-stone-50 px-6 py-4 md:grid md:grid-cols-[1.35fr_1.2fr_1fr_1fr_220px] md:gap-4">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Đối tác</span>
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Lô hàng</span>
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Giá chốt</span>
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Trạng thái</span>
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Thao tác</span>
              </div>

              <div className="divide-y divide-stone-200">
                {mockDeals.map((deal) => {
                  const statusMeta = dealStatusMeta[deal.status]

                  return (
                    <div key={deal.id} className="px-5 py-5 sm:px-6">
                      <div className="grid gap-4 md:grid-cols-[1.35fr_1.2fr_1fr_1fr_220px] md:items-center md:gap-4">
                        <div>
                          <p className="text-base font-semibold text-stone-950">{deal.partner}</p>
                          <p className="mt-1 flex items-center gap-2 text-sm text-stone-500">
                            <BriefcaseBusiness className="h-4 w-4" />
                            Hồ sơ doanh nghiệp B2B
                          </p>
                        </div>

                        <div>
                          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 md:hidden">
                            Lô hàng
                          </p>
                          <p className="text-sm font-semibold text-stone-900">{deal.lot}</p>
                        </div>

                        <div>
                          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 md:hidden">
                            Giá chốt
                          </p>
                          <p className="text-sm font-semibold text-stone-900">{deal.agreedPrice}</p>
                        </div>

                        <div>
                          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 md:hidden">
                            Trạng thái
                          </p>
                          <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusMeta.className}`}>
                            {statusMeta.label}
                          </span>
                        </div>

                        <div>
                          <Link
                            href={`/b2b/deal/${deal.id}`}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-700 md:w-auto"
                          >
                            Vào phòng chốt Deal
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            <div className="rounded-[1.75rem] border border-stone-200 bg-stone-50 p-5">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-white p-3 text-emerald-700 shadow-sm">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-base font-semibold text-stone-950">Tăng tỷ lệ phản hồi</p>
                  <p className="mt-2 text-sm leading-6 text-stone-600">
                    Listing có hồ sơ xác minh và điểm uy tín tốt thường nhận được nhiều yêu cầu hơn.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-stone-200 bg-stone-50 p-5">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-white p-3 text-amber-700 shadow-sm">
                  <Crown className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-base font-semibold text-stone-950">Sẵn sàng cho monetization</p>
                  <p className="mt-2 text-sm leading-6 text-stone-600">
                    Nút Boost đã có sẵn để mở rộng vị trí hiển thị và doanh thu quảng bá trong bước tiếp theo.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-stone-200 bg-stone-50 p-5">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-white p-3 text-blue-700 shadow-sm">
                  <BadgeCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-base font-semibold text-stone-950">Điều hành tập trung</p>
                  <p className="mt-2 text-sm leading-6 text-stone-600">
                    Từ hồ sơ này, người dùng có thể theo dõi điểm uy tín, trạng thái listings và đường đi của deal.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
