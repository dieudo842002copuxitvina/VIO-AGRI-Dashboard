'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState, use } from 'react'
import { ArrowLeft, Loader2, Shield, Lock, CreditCard, Zap } from 'lucide-react'
import { getSupabaseBrowserClient } from '@/lib/supabase'
import ChatBox from '@/components/ChatBox'

type Deal = {
  id: string
  listing_id: string
  buyer_id: string
  seller_id: string
  status: 'pending' | 'accepted' | 'rejected' | 'closed'
  deposit_amount?: number | null
  payment_status?: 'unpaid' | 'locked' | 'released' | 'refunded'
  created_at: string | null
}

type Listing = {
  id: string
  user_id: string
  title: string | null
  commodity: string | null
  type: string | null
  quantity: number | string | null
  price: number | string | null
  description: string | null
  image_url?: string | null
}

type SystemSettings = {
  id: number
  is_payment_enabled: boolean
}

function getPriceUnit(commodity: string): 'VNĐ/kg' | 'USD/tấn' {
  const normalized = (commodity || '').trim().toLowerCase()

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

function formatQuantity(value: number | string | null): string {
  const num = typeof value === 'string' ? Number(value) : value || 0
  return `${new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: 1,
  }).format(num)} Tấn`
}

function normalizeCommodity(value: string | null | undefined): string {
  const normalized = (value || '').trim().toLowerCase()

  if (normalized === 'coffee') return 'Cà phê'
  if (normalized === 'pepper') return 'Hồ tiêu'
  if (normalized === 'rice') return 'Lúa gạo'
  if (normalized === 'cashew') return 'Hạt điều'

  return value?.trim() || 'Nông sản'
}

function getStatusLabel(status: string): { label: string; bgColor: string; textColor: string } {
  switch (status) {
    case 'pending':
      return { label: 'Chờ phản hồi', bgColor: 'bg-amber-100', textColor: 'text-amber-800' }
    case 'accepted':
      return { label: 'Đã chấp nhận', bgColor: 'bg-green-100', textColor: 'text-green-800' }
    case 'rejected':
      return { label: 'Đã từ chối', bgColor: 'bg-red-100', textColor: 'text-red-800' }
    case 'closed':
      return { label: 'Đã kết thúc', bgColor: 'bg-gray-100', textColor: 'text-gray-800' }
    default:
      return { label: 'Không xác định', bgColor: 'bg-gray-100', textColor: 'text-gray-800' }
  }
}

export default function DealRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const resolvedParams = use(params)
  const dealId = resolvedParams.id
  const [deal, setDeal] = useState<Deal | null>(null)
  const [listing, setListing] = useState<Listing | null>(null)
  const [currentUser, setCurrentUser] = useState<{ id: string; email?: string } | null>(null)
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function loadDealRoom() {
      try {
        const supabase = getSupabaseBrowserClient()

        // Check user authentication
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
          router.replace('/login')
          return
        }

        setCurrentUser({ id: user.id, email: user.email })

        // Fetch system settings (feature flag)
        const { data: settingsData, error: settingsError } = await supabase
          .from('system_settings')
          .select('*')
          .eq('id', 1)
          .single()

        if (!isMounted) {
          return
        }

        if (settingsData) {
          setSystemSettings(settingsData)
        }

        // Fetch deal
        const { data: dealData, error: dealError } = await supabase
          .from('deals')
          .select('*')
          .eq('id', dealId)
          .single()

        if (!isMounted) {
          return
        }

        if (dealError || !dealData) {
          setError('Không tìm thấy phòng thương lượng. Vui lòng thử lại.')
          setIsLoading(false)
          return
        }

        // Verify user is either buyer or seller
        if (user.id !== dealData.buyer_id && user.id !== dealData.seller_id) {
          setError('Bạn không có quyền truy cập phòng thương lượng này.')
          setIsLoading(false)
          return
        }

        setDeal(dealData)

        // Fetch listing
        const { data: listingData, error: listingError } = await supabase
          .from('listings')
          .select('*')
          .eq('id', dealData.listing_id)
          .single()

        if (!isMounted) {
          return
        }

        if (listingError || !listingData) {
          setError('Không tìm thấy thông tin lô hàng.')
          setIsLoading(false)
          return
        }

        setListing(listingData)
      } catch (fetchError) {
        if (!isMounted) {
          return
        }

        console.error('[Deal Room] Error:', fetchError)
        setError('Đã có lỗi xảy ra khi tải phòng thương lượng.')
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadDealRoom()

    return () => {
      isMounted = false
    }
  }, [dealId, router])

  const handleInitiatePayment = async () => {
    if (!deal || !systemSettings) {
      return
    }

    setIsProcessingPayment(true)

    try {
      if (systemSettings.is_payment_enabled) {
        // Mock automated payment gateway
        alert('Đang chuyển hướng sang cổng thanh toán PayOS/VNPay...')
        // In production, redirect to payment gateway
        // window.location.href = `https://payment-gateway.example.com/deal/${deal.id}`
      } else {
        alert('Bạn sẽ được hướng dẫn thanh toán cọc thủ công.')
      }
    } finally {
      setIsProcessingPayment(false)
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-[2rem] border border-gray-200 bg-white p-8 shadow-sm sm:p-10">
            <div className="flex items-center gap-4 rounded-3xl border border-emerald-100 bg-emerald-50 px-5 py-5 text-emerald-800">
              <Loader2 className="h-5 w-5 animate-spin" />
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em]">Phòng Thương Lượng</p>
                <p className="mt-1 text-sm text-emerald-700">Đang tải thông tin phòng thương lượng...</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="mx-auto max-w-4xl">
          <div className="space-y-4">
            <Link
              href="/b2b"
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 shadow-sm transition hover:border-gray-300 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Quay lại sàn giao thương
            </Link>

            <div className="rounded-[1.75rem] border border-red-200 bg-red-50 px-6 py-5 text-sm font-medium text-red-700">
              {error}
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (!deal || !listing) {
    return null
  }

  const statusInfo = getStatusLabel(deal.status)
  const commodity = normalizeCommodity(listing.commodity)
  const quantity = typeof listing.quantity === 'string' ? Number(listing.quantity) : listing.quantity || 0
  const price = typeof listing.price === 'string' ? Number(listing.price) : listing.price || 0

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 text-gray-950 sm:px-6 lg:px-8 lg:py-14">
      <div className="mx-auto max-w-4xl space-y-6">
        <Link
          href="/b2b"
          className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 shadow-sm transition hover:border-gray-300 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại sàn giao thương
        </Link>

        {/* Header Section */}
        <section className="overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.16),_transparent_34%),linear-gradient(180deg,#ffffff_0%,#f9fafb_100%)] px-6 py-8 sm:px-8 sm:py-10">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <h1 className="text-3xl font-semibold tracking-tight text-gray-950 sm:text-4xl">
                  Phòng Thương Lượng Kín
                </h1>
                <span
                  className={`inline-flex rounded-full border border-current/30 px-4 py-2 text-sm font-semibold ${statusInfo.bgColor} ${statusInfo.textColor}`}
                >
                  {statusInfo.label}
                </span>
              </div>
              <p className="max-w-2xl text-base leading-7 text-gray-600">
                Kết nối bảo mật giữa Người Mua và Người Bán. Thương lượng mức giá và điều kiện giao hàng trực tiếp.
              </p>
            </div>
          </div>

          {/* Product Info Card */}
          <div className="px-6 py-8 sm:px-8 sm:py-10">
            <div className="rounded-[1.75rem] border border-gray-200 bg-gray-50 p-6">
              <div className="flex flex-col gap-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Thông tin lô hàng</p>
                  <h2 className="mt-3 text-2xl font-semibold tracking-tight text-gray-950">
                    {listing.title || 'Lô hàng không có tiêu đề'}
                  </h2>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-gray-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">Mặt hàng</p>
                    <p className="mt-2 text-lg font-semibold text-gray-950">{commodity}</p>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">Số lượng</p>
                    <p className="mt-2 text-lg font-semibold text-gray-950">{formatQuantity(quantity)}</p>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-white p-4 sm:col-span-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">Giá chào khởi điểm</p>
                    <p className="mt-2 text-lg font-semibold text-emerald-600">
                      {formatPrice(price, commodity || '')}
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">Mô tả chi tiết</p>
                  <p className="mt-3 leading-7 text-gray-700">
                    {listing.description || 'Lô hàng không có mô tả chi tiết.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Payment Section - Show if deal is accepted and payment is needed */}
        {deal.status === 'accepted' && deal.payment_status === 'unpaid' && currentUser?.id === deal.buyer_id && (
          <section className="overflow-hidden rounded-[2rem] border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-50/50 shadow-sm">
            <div className="px-6 py-8 sm:px-8 sm:py-10">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-full bg-emerald-100">
                      <CreditCard className="h-6 w-6 text-emerald-700" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-semibold tracking-tight text-gray-950">Thanh toán Ký quỹ (Escrow)</h2>
                    <p className="mt-2 text-base leading-7 text-gray-600">
                      Cả hai bên đã thỏa thuận. Để tiến hành giao dịch, bạn cần thanh toán cọc bảo mật để bảo vệ quyền lợi.
                    </p>
                  </div>
                </div>

                {systemSettings?.is_payment_enabled ? (
                  // Automated Payment Option
                  <div className="rounded-[1.5rem] border border-emerald-200 bg-white p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-emerald-600" />
                        <span className="text-sm font-semibold text-emerald-700">Thanh toán Tự động</span>
                      </div>
                      <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                        Nhanh & An toàn
                      </span>
                    </div>
                    <p className="mb-4 text-sm text-gray-600">
                      Chuyển tiền trực tiếp qua PayOS hoặc VNPay. Hệ thống sẽ xác nhận ngay khi tiền về.
                    </p>
                    <button
                      onClick={handleInitiatePayment}
                      disabled={isProcessingPayment}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 text-base font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400"
                    >
                      {isProcessingPayment ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Đang xử lý...
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-5 w-5" />
                          Thanh toán cọc qua PayOS/VNPay
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  // Manual Bank Transfer Option
                  <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-6">
                    <div className="mb-4">
                      <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                        Thanh toán Thủ công
                      </span>
                    </div>
                    <div className="space-y-3 text-sm text-gray-700">
                      <p className="font-semibold text-gray-900">Hướng dẫn chuyển khoản:</p>
                      <div className="rounded-lg bg-white p-3 border border-amber-100">
                        <p className="text-xs text-gray-500 mb-2">✓ Chuyển khoản tới:</p>
                        <p className="font-mono font-semibold text-gray-950">Ngân hàng VietComBank (VCB)</p>
                        <p className="font-mono font-semibold text-gray-950">Số tài khoản: 0123456789</p>
                        <p className="text-xs text-gray-500 mt-2 mb-1">✓ Nội dung chuyển khoản:</p>
                        <p className="font-mono bg-gray-100 p-2 rounded text-gray-900 text-xs break-all">
                          Ky_quy<wbr />_{deal.id.substring(0, 8)}
                        </p>
                      </div>
                      <p className="text-xs text-gray-600 italic">
                        Hệ thống sẽ tự động xác nhận ký quỹ trong vòng 1-2 giờ sau khi nhận tiền.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        // Copy to clipboard
                        navigator.clipboard.writeText(`Ky_quy_${deal.id.substring(0, 8)}`)
                        alert('Nội dung chuyển khoản đã được sao chép!')
                      }}
                      className="mt-4 w-full rounded-2xl border-2 border-amber-300 bg-white px-6 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-50"
                    >
                      Sao chép nội dung chuyển khoản
                    </button>
                  </div>
                )}

                {/* Security Info */}
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                  <div className="flex gap-3">
                    <Shield className="h-5 w-5 flex-shrink-0 text-blue-700 mt-0.5" />
                    <div className="text-sm text-blue-900">
                      <p className="font-semibold">Ký quỹ Bảo mật</p>
                      <p className="mt-1">
                        Tiền của bạn được giữ an toàn. Chỉ thanh toán cho Người Bán khi bạn xác nhận đã nhận hàng đúng chất lượng.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Negotiation Area */}
        <section className="overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-sm">
          <div className="px-6 py-8 sm:px-8 sm:py-10">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-gray-950">Khu vực Thương lượng</h2>
                <p className="mt-2 text-base leading-7 text-gray-600">
                  Trao đổi trực tiếp với đối tác để thương lượng mức giá, điều kiện thanh toán và giao hàng.
                </p>
              </div>

              {/* Chat Box */}
              {currentUser && deal && (
                <ChatBox dealId={deal.id} currentUserId={currentUser.id} />
              )}

              {/* Info Box */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 pt-0.5">
                    <Shield className="h-5 w-5 text-emerald-700" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-emerald-900">Thương lượng an toàn</p>
                    <p className="mt-1 text-sm text-emerald-800">
                      Tất cả cuộc trò chuyện được bảo mật với mã hóa end-to-end. Thông tin của bạn luôn được bảo vệ.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Security Notice */}
        <div className="rounded-[1.5rem] border border-blue-200 bg-blue-50 p-5">
          <div className="flex gap-3">
            <Lock className="h-5 w-5 flex-shrink-0 text-blue-700 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold">Quy tắc thương lượng</p>
              <p className="mt-1">
                Hãy lịch sự, chuyên nghiệp và trung thực. Tất cả các vi phạm quy tắc sẽ dẫn đến đóng tài khoản và báo cáo cho cơ quan chức năng.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
