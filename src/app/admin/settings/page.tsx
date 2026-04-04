'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, ArrowLeft, CheckCircle, AlertCircle, Zap, ToggleRight } from 'lucide-react'
import { getSupabaseBrowserClient } from '@/lib/supabase'

type SystemSettings = {
  id: number
  is_payment_enabled: boolean
}

export default function AdminSettingsPage() {
  const router = useRouter()
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [settings, setSettings] = useState<SystemSettings | null>(null)
  const [isPaymentEnabled, setIsPaymentEnabled] = useState(false)
  const [isTogglingPayment, setIsTogglingPayment] = useState(false)
  const [toast, setToast] = useState<{
    message: string
    type: 'success' | 'error'
    visible: boolean
  }>({ message: '', type: 'success', visible: false })

  // Auth check & fetch settings
  useEffect(() => {
    let isMounted = true
    const supabase = getSupabaseBrowserClient()

    async function loadSettings() {
      try {
        // Check authentication
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser()

        if (!isMounted) return

        if (authError || !user) {
          router.replace('/login')
          return
        }

        // Fetch system settings
        const { data: settingsData, error: settingsError } = await supabase
          .from('system_settings')
          .select('*')
          .eq('id', 1)
          .single()

        if (!isMounted) return

        if (settingsError) {
          console.error('[Settings] Error fetching settings:', settingsError)
          showToast('Lỗi tải cấu hình hệ thống', 'error')
        } else if (settingsData) {
          setSettings(settingsData as SystemSettings)
          setIsPaymentEnabled(settingsData.is_payment_enabled || false)
        }
      } catch (error) {
        if (isMounted) {
          console.error('[Settings] Error:', error)
          showToast('Đã xảy ra lỗi', 'error')
        }
      } finally {
        if (isMounted) {
          setIsCheckingAuth(false)
          setIsLoading(false)
        }
      }
    }

    loadSettings()

    return () => {
      isMounted = false
    }
  }, [router])

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type, visible: true })
    setTimeout(() => {
      setToast({ message: '', type: 'success', visible: false })
    }, 3000)
  }

  const handleTogglePayment = async () => {
    if (!settings) return

    setIsTogglingPayment(true)

    try {
      const supabase = getSupabaseBrowserClient()
      const newValue = !isPaymentEnabled

      const { error: updateError } = await supabase
        .from('system_settings')
        .update({ is_payment_enabled: newValue })
        .eq('id', 1)

      if (updateError) {
        console.error('[Settings] Error updating payment setting:', updateError)
        showToast('Lỗi cập nhật cấu hình', 'error')
        return
      }

      setIsPaymentEnabled(newValue)
      setSettings({ ...settings, is_payment_enabled: newValue })
      showToast(
        newValue
          ? '✓ Thanh toán tự động đã được bật'
          : '✓ Thanh toán tự động đã được tắt',
        'success'
      )
    } catch (error) {
      console.error('[Settings] Error:', error)
      showToast('Đã xảy ra lỗi khi cập nhật', 'error')
    } finally {
      setIsTogglingPayment(false)
    }
  }

  // Loading state
  if (isCheckingAuth) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-[2rem] border border-gray-200 bg-white p-8 shadow-sm sm:p-10">
            <div className="flex items-center gap-4 rounded-3xl border border-emerald-100 bg-emerald-50 px-5 py-5 text-emerald-800">
              <Loader2 className="h-5 w-5 animate-spin" />
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em]">Cấu hình Hệ thống</p>
                <p className="mt-1 text-sm text-emerald-700">Đang xác thực...</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 text-gray-950 sm:px-6 lg:px-8 lg:py-14">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Back Button */}
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 shadow-sm transition hover:border-gray-300 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại Admin
        </Link>

        {/* Header Section */}
        <section className="overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.16),_transparent_34%),linear-gradient(180deg,#ffffff_0%,#f9fafb_100%)] px-6 py-8 sm:px-8 sm:py-10">
            <h1 className="text-3xl font-semibold tracking-tight text-gray-950 sm:text-4xl">
              Cấu hình Hệ thống
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-gray-600">
              Quản lý các tính năng chính và cài đặt nền tảng VIO AGRI.
            </p>
          </div>
        </section>

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
              <p className={`text-sm font-medium ${
                toast.type === 'success'
                  ? 'text-emerald-800'
                  : 'text-red-800'
              }`}>
                {toast.message}
              </p>
            </div>
          </div>
        )}

        {/* Settings Card */}
        <section className="overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-sm">
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
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        isPaymentEnabled
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
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
                        <span className={`text-lg font-bold ${
                          isPaymentEnabled ? 'text-emerald-600' : 'text-gray-400'
                        }`}>
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
        </section>
      </div>
    </main>
  )
}
