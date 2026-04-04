'use client'

import { useMemo, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Activity,
  Bot,
  Building2,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Download,
  FileSearch,
  LayoutDashboard,
  Search,
  ShieldCheck,
  Siren,
  TrendingUp,
  UserRound,
  Wallet,
  XCircle,
  Loader2,
  Settings,
  Zap,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'
import { getSupabaseBrowserClient } from '@/lib/supabase'

type AdminSection = 'overview' | 'kyc' | 'listings' | 'deals' | 'bot' | 'revenue' | 'settings'

type SystemSettings = {
  id: number
  is_payment_enabled: boolean
}

type MetricCard = {
  id: string
  label: string
  value: string
  detail: string
  tone: 'emerald' | 'blue' | 'rose' | 'slate'
  icon: typeof Wallet
}

type KycRequest = {
  id: string
  businessName: string
  contactName: string
  submittedAt: string
  region: string
}

type HotDeal = {
  id: string
  partner: string
  commodity: string
  value: string
  status: string
}

const sidebarItems: Array<{
  id: AdminSection
  label: string
  icon: typeof LayoutDashboard
  badge?: string
}> = [
  { id: 'overview', label: 'Tổng quan', icon: LayoutDashboard },
  { id: 'kyc', label: 'Duyệt KYC Doanh nghiệp', icon: ShieldCheck, badge: '3' },
  { id: 'listings', label: 'Quản lý Tin Đăng', icon: FileSearch },
  { id: 'deals', label: 'Giám sát Deal', icon: CircleDollarSign },
  { id: 'bot', label: 'Trạng thái Bot AI', icon: Bot },
  { id: 'revenue', label: 'Doanh thu', icon: TrendingUp },
  { id: 'settings', label: 'Cấu hình Hệ thống', icon: Settings },
]

const metricToneClasses = {
  emerald: 'from-emerald-500/14 via-emerald-400/8 to-transparent border-emerald-200',
  blue: 'from-blue-500/14 via-sky-400/8 to-transparent border-blue-200',
  rose: 'from-rose-500/14 via-rose-400/8 to-transparent border-rose-200',
  slate: 'from-slate-500/14 via-slate-400/8 to-transparent border-slate-200',
} as const

const metricIconClasses = {
  emerald: 'bg-emerald-100 text-emerald-700',
  blue: 'bg-blue-100 text-blue-700',
  rose: 'bg-rose-100 text-rose-700',
  slate: 'bg-slate-100 text-slate-700',
} as const

export default function AdminPage() {
  const router = useRouter()
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [activeSection, setActiveSection] = useState<AdminSection>('overview')
  const [metrics] = useState<MetricCard[]>([
    {
      id: 'gmv',
      label: 'Tổng giao dịch (GMV)',
      value: '15.4 Tỷ VNĐ',
      detail: '+8.2% so với tháng trước',
      tone: 'emerald',
      icon: Wallet,
    },
    {
      id: 'new-users',
      label: 'Người dùng mới',
      value: '142',
      detail: 'Tăng 12% trong 7 ngày',
      tone: 'blue',
      icon: UserRound,
    },
    {
      id: 'pending-listings',
      label: 'Tin đăng chờ duyệt/báo cáo',
      value: '5',
      detail: '2 báo cáo cần xử lý ngay',
      tone: 'rose',
      icon: Siren,
    },
    {
      id: 'bot-status',
      label: 'Bot AI Status',
      value: 'Đang hoạt động',
      detail: 'Crawler và market signals online 24/7',
      tone: 'slate',
      icon: Activity,
    },
  ])

  const [kycRequests] = useState<KycRequest[]>([
    {
      id: 'kyc-01',
      businessName: 'Công ty TNHH Xuất khẩu Minh An',
      contactName: 'Nguyễn Hoàng Minh',
      submittedAt: '09:15 • 03/04/2026',
      region: 'Đắk Lắk',
    },
    {
      id: 'kyc-02',
      businessName: 'Vựa Nông Sản Trường Phát',
      contactName: 'Trần Gia Phát',
      submittedAt: '11:40 • 03/04/2026',
      region: 'Long An',
    },
    {
      id: 'kyc-03',
      businessName: 'Mekong Rice Trading JSC',
      contactName: 'Lê Quốc Bảo',
      submittedAt: '14:05 • 03/04/2026',
      region: 'Cần Thơ',
    },
  ])

  const [hotDeals] = useState<HotDeal[]>([
    {
      id: 'deal-01',
      partner: 'VIO Export x GreenBean Hub',
      commodity: 'Cà phê Robusta • 120 tấn',
      value: '3.28 Tỷ VNĐ',
      status: 'Đang thương lượng vòng cuối',
    },
    {
      id: 'deal-02',
      partner: 'Trường Phát x Mekong Rice Trading',
      commodity: 'Lúa gạo • 250 tấn',
      value: '154,000 USD',
      status: 'Chờ xác nhận đặt cọc',
    },
    {
      id: 'deal-03',
      partner: 'PepperWorks x Global Spice Link',
      commodity: 'Hồ tiêu • 40 tấn',
      value: '4.65 Tỷ VNĐ',
      status: 'Bot AI phát hiện tín hiệu giá tăng',
    },
  ])

  // Settings state
  const [settings, setSettings] = useState<SystemSettings | null>(null)
  const [isPaymentEnabled, setIsPaymentEnabled] = useState(false)
  const [isTogglingPayment, setIsTogglingPayment] = useState(false)
  const [toast, setToast] = useState<{
    message: string
    type: 'success' | 'error'
    visible: boolean
  }>({ message: '', type: 'success', visible: false })

  // Auth check & fetch settings (MVP: bypassing auth checks for local testing)
  useEffect(() => {
    let isMounted = true
    const supabase = getSupabaseBrowserClient()

    async function initializeAdmin() {
      try {
        // Check authentication
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!isMounted) return

        if (!session) {
          console.warn('[Admin] No session found, but bypassing for MVP admin test.')
        }

        // Fetch system settings
        const { data: settingsData, error: settingsError } = await supabase
          .from('system_settings')
          .select('*')
          .eq('id', 1)
          .single()

        if (!isMounted) return

        if (settingsError) {
          console.warn('[Admin] RLS or query error fetching settings (expected in MVP):', settingsError.message)
          // Set defaults on error
          setSettings({ id: 1, is_payment_enabled: false })
          setIsPaymentEnabled(false)
        } else if (settingsData) {
          setSettings(settingsData as SystemSettings)
          setIsPaymentEnabled(settingsData.is_payment_enabled || false)
        }

        setIsCheckingAuth(false)
      } catch (error) {
        if (isMounted) {
          console.error('[Admin] Error:', error)
          // Set defaults on exception
          setSettings({ id: 1, is_payment_enabled: false })
          setIsPaymentEnabled(false)
          setIsCheckingAuth(false)
        }
      }
    }

    initializeAdmin()

    return () => {
      isMounted = false
    }
  }, [router])

  const activeSectionMeta = useMemo(() => {
    const item = sidebarItems.find((entry) => entry.id === activeSection)

    if (!item) {
      return {
        title: 'Tổng quan điều hành',
        description: 'Theo dõi sức khỏe toàn sàn giao thương theo thời gian thực.',
      }
    }

    const metaBySection: Record<AdminSection, { title: string; description: string }> = {
      overview: {
        title: 'Tổng quan điều hành',
        description: 'Theo dõi sức khỏe toàn sàn giao thương, người dùng và tín hiệu vận hành theo thời gian thực.',
      },
      kyc: {
        title: 'Duyệt KYC doanh nghiệp',
        description: 'Ưu tiên hồ sơ mới để tăng trust score và đẩy nhanh tốc độ on-boarding đối tác.',
      },
      listings: {
        title: 'Quản lý tin đăng',
        description: 'Kiểm soát chất lượng niêm yết, báo cáo nội dung và khu vực cần can thiệp.',
      },
      deals: {
        title: 'Giám sát deal nóng',
        description: 'Theo dõi các giao dịch có giá trị cao và những thương lượng đang tiến gần tới chốt deal.',
      },
      bot: {
        title: 'Trạng thái Bot AI',
        description: 'Giám sát crawler, pipeline phân tích và cảnh báo bất thường của toàn bộ hệ thống intelligence.',
      },
      revenue: {
        title: 'Doanh thu nền tảng',
        description: 'Tập trung vào GMV, dòng thu từ premium listings, KYC và giải pháp dữ liệu.',
      },
      settings: {
        title: 'Cấu hình Hệ thống',
        description: 'Quản lý các tính năng chính và cài đặt của nền tảng VIO AGRI.',
      },
    }

    return metaBySection[item.id]
  }, [activeSection])

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type, visible: true })
    setTimeout(() => {
      setToast({ message: '', type: 'success', visible: false })
    }, 3000)
  }

  const handleTogglePayment = async () => {
    const supabase = getSupabaseBrowserClient()

    try {
      const newValue = !isPaymentEnabled;

      // 1. Cập nhật giao diện ngay lập tức cho mượt (Optimistic Update)
      setIsPaymentEnabled(newValue);

      // 2. Gửi lệnh xuống Supabase (BẮT BUỘC phải có .eq('id', 1))
      const { error } = await supabase
        .from('system_settings')
        .update({ is_payment_enabled: newValue })
        .eq('id', 1);

      // 3. Nếu Supabase báo lỗi, trả lại trạng thái cũ và in lỗi chi tiết
      if (error) {
        setIsPaymentEnabled(!newValue); // Hoàn tác UI
        console.error('[Admin] Lỗi chi tiết từ Supabase:', JSON.stringify(error, null, 2));
        showToast('Không thể cập nhật cấu hình: ' + (error.message || 'Vui lòng kiểm tra Console'), 'error')
      } else {
        console.log('[Admin] Cập nhật công tắc thành công:', newValue);
        showToast(newValue ? '✓ Thanh toán tự động đã được bật' : '✓ Thanh toán tự động đã được tắt', 'success')
      }
    } catch (err) {
      console.error('[Admin] Lỗi bất ngờ:', err);
      showToast('Đã xảy ra lỗi khi cập nhật', 'error')
    }
  };

  // Show loading state
  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
          <div className="flex items-center gap-4">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
            <div>
              <p className="font-semibold text-slate-950">Xác thực...</p>
              <p className="text-sm text-slate-600">Vui lòng chờ</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative left-1/2 right-1/2 -mx-[50vw] w-screen bg-slate-100">
      <div className="grid min-h-[calc(100vh-5rem)] lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="bg-slate-950 text-white shadow-[inset_-1px_0_0_rgba(255,255,255,0.06)]">
          <div className="flex h-full flex-col px-5 py-6 lg:px-6 lg:py-7">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-300/85">
                  Command Center
                </p>
                <h1 className="mt-2 text-xl font-semibold tracking-tight text-white">
                  VIO AGRI ADMIN
                </h1>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/12 text-emerald-300">
                <ShieldCheck className="h-5 w-5" />
              </div>
            </div>

            <nav className="mt-6 space-y-2">
              {sidebarItems.map((item) => {
                const active = item.id === activeSection
                const Icon = item.icon

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveSection(item.id)}
                    className={`flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium transition ${
                      active
                        ? 'bg-white text-slate-950 shadow-[0_18px_36px_-28px_rgba(15,23,42,0.9)]'
                        : 'text-slate-300 hover:bg-white/6 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span
                        className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                          active ? 'bg-emerald-100 text-emerald-700' : 'bg-white/6 text-slate-300'
                        }`}
                      >
                        <Icon className="h-4.5 w-4.5" />
                      </span>
                      <span>{item.label}</span>
                    </span>
                    {item.badge ? (
                      <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-rose-500 px-2 py-0.5 text-xs font-semibold text-white">
                        {item.badge}
                      </span>
                    ) : (
                      <ChevronRight className={`h-4 w-4 ${active ? 'text-slate-400' : 'text-slate-600'}`} />
                    )}
                  </button>
                )
              })}
            </nav>

            <div className="mt-auto rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200/75">
                Secure Operations
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Toàn bộ khu vực này dành cho quản trị hệ thống, ưu tiên tốc độ phản ứng và khả năng kiểm soát rủi ro theo thời gian thực.
              </p>
            </div>
          </div>
        </aside>

        <main className="min-w-0 bg-slate-100">
          <div className="flex h-full flex-col">
            <header className="border-b border-slate-200 bg-white/94 px-5 py-4 backdrop-blur sm:px-6 lg:px-8">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                    Admin Workspace
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                    {activeSectionMeta.title}
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
                    {activeSectionMeta.description}
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <label className="relative block min-w-[280px]">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Tìm kiếm user, listing, deal..."
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                    />
                  </label>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className="inline-flex h-12 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      <Download className="h-4.5 w-4.5" />
                      Export Report
                    </button>

                    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-sm font-semibold text-emerald-700">
                        AD
                      </div>
                      <div className="hidden min-w-0 sm:block">
                        <p className="truncate text-sm font-semibold text-slate-950">Admin Ops</p>
                        <p className="truncate text-xs text-slate-500">Quản trị hệ thống</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </header>

            <div className="flex-1 px-5 py-6 sm:px-6 lg:px-8 lg:py-8 overflow-y-auto">
              {/* OVERVIEW TAB */}
              {activeSection === 'overview' && (
                <>
                  <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {metrics.map((metric) => {
                      const Icon = metric.icon

                      return (
                        <article
                          key={metric.id}
                          className={`overflow-hidden rounded-[30px] border bg-[radial-gradient(circle_at_top_left,var(--tw-gradient-stops))] from-white to-white p-5 shadow-[0_22px_60px_-42px_rgba(15,23,42,0.38)] ${metricToneClasses[metric.tone]}`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-sm font-medium text-slate-500">{metric.label}</p>
                              <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
                                {metric.value}
                              </p>
                            </div>
                            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${metricIconClasses[metric.tone]}`}>
                              <Icon className="h-5 w-5" />
                            </div>
                          </div>

                          <div className="mt-6 flex items-center gap-2 text-sm font-medium text-slate-600">
                            {metric.id === 'gmv' || metric.id === 'new-users' ? (
                              <>
                                <TrendingUp className="h-4 w-4 text-emerald-600" />
                                <span className="text-emerald-700">{metric.detail}</span>
                              </>
                            ) : metric.id === 'pending-listings' ? (
                              <>
                                <Siren className="h-4 w-4 text-rose-600" />
                                <span className="text-rose-700">{metric.detail}</span>
                              </>
                            ) : (
                              <>
                                <span className="relative flex h-2.5 w-2.5">
                                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                                </span>
                                <span className="text-emerald-700">{metric.detail}</span>
                              </>
                            )}
                          </div>
                        </article>
                      )
                    })}
                  </section>

                  <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
                    <div className="rounded-[32px] border border-slate-200 bg-white shadow-[0_22px_60px_-42px_rgba(15,23,42,0.35)]">
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-6 py-5">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                            Action Center
                          </p>
                          <h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
                            Yêu cầu KYC chờ duyệt
                          </h3>
                        </div>
                        <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                          {kycRequests.length} hồ sơ mới
                        </div>
                      </div>

                      <div className="overflow-x-auto px-2 pb-2 pt-1">
                        <table className="min-w-full border-separate border-spacing-y-3 px-4 text-left">
                          <thead>
                            <tr className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                              <th className="px-4 py-2">Doanh nghiệp</th>
                              <th className="px-4 py-2">Người liên hệ</th>
                              <th className="px-4 py-2">Khu vực</th>
                              <th className="px-4 py-2">Thời gian</th>
                              <th className="px-4 py-2 text-right">Hành động</th>
                            </tr>
                          </thead>
                          <tbody>
                            {kycRequests.map((request) => (
                              <tr key={request.id} className="rounded-2xl bg-slate-50 text-sm text-slate-700 shadow-sm">
                                <td className="rounded-l-2xl px-4 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                                      <Building2 className="h-5 w-5" />
                                    </div>
                                    <div>
                                      <p className="font-semibold text-slate-950">{request.businessName}</p>
                                      <p className="mt-1 text-xs text-slate-500">KYC doanh nghiệp đang chờ kiểm tra</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-4 font-medium">{request.contactName}</td>
                                <td className="px-4 py-4">{request.region}</td>
                                <td className="px-4 py-4 text-slate-500">{request.submittedAt}</td>
                                <td className="rounded-r-2xl px-4 py-4">
                                  <div className="flex justify-end gap-2">
                                    <button
                                      type="button"
                                      className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
                                    >
                                      <CheckCircle2 className="h-3.5 w-3.5" />
                                      Approve
                                    </button>
                                    <button
                                      type="button"
                                      className="inline-flex items-center gap-1 rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                                    >
                                      <XCircle className="h-3.5 w-3.5" />
                                      Reject
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="rounded-[32px] border border-slate-200 bg-white shadow-[0_22px_60px_-42px_rgba(15,23,42,0.35)]">
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-6 py-5">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                            Live Deal Watch
                          </p>
                          <h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
                            Giao dịch (Deals) đang nóng
                          </h3>
                        </div>
                        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                          <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                          </span>
                          Trực tiếp
                        </div>
                      </div>

                      <div className="space-y-4 p-6">
                        {hotDeals.map((deal, index) => (
                          <article
                            key={deal.id}
                            className="rounded-[26px] border border-slate-200 bg-slate-50/90 p-5 shadow-sm"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <div className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                                  Deal #{index + 1}
                                </div>
                                <h4 className="mt-3 text-lg font-semibold tracking-tight text-slate-950">
                                  {deal.partner}
                                </h4>
                              </div>
                              <div className="rounded-2xl bg-emerald-100 px-3 py-2 text-sm font-semibold text-emerald-700">
                                {deal.value}
                              </div>
                            </div>
                            <p className="mt-4 text-sm font-medium text-slate-700">{deal.commodity}</p>
                            <div className="mt-4 flex items-center justify-between gap-3 text-sm">
                              <span className="text-slate-500">{deal.status}</span>
                              <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                                Theo dõi
                                <ChevronRight className="h-4 w-4" />
                              </span>
                            </div>
                          </article>
                        ))}
                      </div>
                    </div>
                  </section>
                </>
              )}

              {/* SETTINGS TAB */}
              {activeSection === 'settings' && (
                <div className="mx-auto max-w-4xl space-y-6">
                  {/* Toast Notification */}
                  {toast.visible && (
                    <div
                      className={`rounded-[1.5rem] border px-6 py-4 shadow-sm ${
                        toast.type === 'success'
                          ? 'border-emerald-200 bg-emerald-50'
                          : 'border-red-200 bg-red-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {toast.type === 'success' ? (
                          <CheckCircle className="h-5 w-5 flex-shrink-0 text-emerald-600" />
                        ) : (
                          <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
                        )}
                        <p
                          className={`text-sm font-medium ${
                            toast.type === 'success'
                              ? 'text-emerald-800'
                              : 'text-red-800'
                          }`}
                        >
                          {toast.message}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Settings Card */}
                  <div className="overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-sm">
                    <div className="px-6 py-8 sm:px-8 sm:py-10">
                      <div className="space-y-8">
                        {/* Payment Gateway Toggle */}
                        <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-6">
                          <div className="flex items-center justify-between gap-6">
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                                  <Zap className="h-6 w-6" />
                                </div>
                                <div>
                                  <h3 className="text-lg font-semibold text-gray-950">
                                    Cổng Thanh Toán Ký Quỹ Tự Động
                                  </h3>
                                  <p className="mt-2 text-sm text-gray-600">
                                    Bật để cho phép người dùng thanh toán cọc qua PayOS/VNPay. Tắt để sử dụng thanh toán thủ công qua email.
                                  </p>
                                </div>
                              </div>
                              <div className="mt-4">
                                <span
                                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                    isPaymentEnabled
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}
                                >
                                  {isPaymentEnabled ? '✓ Đã bật' : '○ Đã tắt'}
                                </span>
                              </div>
                            </div>

                            {/* iOS-style Toggle Switch */}
                            <button
                              onClick={handleTogglePayment}
                              disabled={isTogglingPayment}
                              className={`relative inline-flex h-14 w-28 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-4 ${
                                isPaymentEnabled
                                  ? 'bg-emerald-600 shadow-lg shadow-emerald-600/25 focus:ring-emerald-200'
                                  : 'bg-gray-300 shadow-sm focus:ring-gray-200'
                              } disabled:cursor-not-allowed disabled:opacity-60`}
                              title={isTogglingPayment ? 'Đang cập nhật...' : 'Bấm để bật/tắt'}
                            >
                              <span
                                className={`inline-flex h-12 w-12 transform items-center justify-center rounded-full bg-white shadow-md transition-transform duration-300 ${
                                  isPaymentEnabled ? 'translate-x-8' : 'translate-x-1'
                                }`}
                              >
                                {isTogglingPayment ? (
                                  <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
                                ) : (
                                  <span
                                    className={`text-lg font-bold ${
                                      isPaymentEnabled ? 'text-emerald-600' : 'text-gray-400'
                                    }`}
                                  >
                                    {isPaymentEnabled ? '✓' : '✕'}
                                  </span>
                                )}
                              </span>
                            </button>
                          </div>
                        </div>

                        {/* Settings Info Boxes */}
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
                            <h4 className="font-semibold text-blue-900">💡 Tự động</h4>
                            <p className="mt-2 text-sm text-blue-800">
                              Khi BẬT: Người dùng sẽ thấy các cổng thanh toán PayOS/VNPay trên Deal Room.
                            </p>
                          </div>
                          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                            <h4 className="font-semibold text-amber-900">📧 Thủ công</h4>
                            <p className="mt-2 text-sm text-amber-800">
                              Khi TẮT: Người dùng thực hiện chuyển khoản trực tiếp vào tài khoản được cấu hình.
                            </p>
                          </div>
                        </div>

                        {/* Important Notice */}
                        <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-6">
                          <div className="flex gap-4">
                            <div className="flex-shrink-0 pt-0.5">
                              <svg className="h-5 w-5 text-indigo-700" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zm-11-1a1 1 0 11-2 0 1 1 0 012 0zM8 8a1 1 0 000 2h6a1 1 0 100-2H8zm1 5a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div>
                              <p className="font-semibold text-indigo-900">Lưu ý quan trọng</p>
                              <p className="mt-2 text-sm text-indigo-800">
                                Các thay đổi cấu hình sẽ có hiệu lực <strong>ngay lập tức</strong>. Người dùng sẽ nhìn thấy thay đổi khi tải lại Deal Room của họ.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="border-t border-gray-100 bg-gray-50 px-6 py-4 sm:px-8">
                      <p className="text-xs text-gray-600">
                        Lần cập nhật cuối: {new Date().toLocaleString('vi-VN')}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* PLACEHOLDER TABS */}
              {activeSection !== 'overview' && activeSection !== 'settings' && (
                <div className="flex h-full items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50/50">
                  <div className="text-center">
                    <p className="text-lg font-semibold text-slate-600">
                      {sidebarItems.find((item) => item.id === activeSection)?.label}
                    </p>
                    <p className="mt-2 text-sm text-slate-500">Coming soon...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

