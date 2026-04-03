'use client'

import Link from 'next/link'
import { ChangeEvent, FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Leaf, Loader2, ShieldCheck, TrendingUp } from 'lucide-react'

type ListingType = 'sell' | 'buy'
type Commodity = 'coffee' | 'pepper' | 'rice' | 'cashew'

type FormState = {
  type: ListingType
  commodity: Commodity
  quantity: string
  price: string
}

const transactionOptions: Array<{
  value: ListingType
  label: string
  description: string
}> = [
  {
    value: 'sell',
    label: 'Bán',
    description: 'Đăng chào bán để kết nối nhanh với doanh nghiệp thu mua.',
  },
  {
    value: 'buy',
    label: 'Mua',
    description: 'Đăng nhu cầu mua để thu hút nguồn hàng phù hợp.',
  },
]

const commodityOptions: Array<{
  value: Commodity
  label: string
}> = [
  { value: 'coffee', label: 'Cà phê' },
  { value: 'pepper', label: 'Hồ tiêu' },
  { value: 'rice', label: 'Lúa gạo' },
  { value: 'cashew', label: 'Hạt điều' },
]

const priceUnitByCommodity: Record<Commodity, string> = {
  coffee: 'VNĐ/kg',
  pepper: 'VNĐ/kg',
  rice: 'USD/tấn',
  cashew: 'USD/tấn',
}

const initialFormState: FormState = {
  type: 'sell',
  commodity: 'coffee',
  quantity: '',
  price: '',
}

function getErrorMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  const record = payload as { error?: unknown }
  return typeof record.error === 'string' ? record.error : null
}

export default function CreateListingPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<FormState>(initialFormState)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedCommodity =
    commodityOptions.find((option) => option.value === formData.commodity)?.label ?? 'Cà phê'
  const selectedType =
    transactionOptions.find((option) => option.value === formData.type)?.label ?? 'Bán'
  const priceSuffix = priceUnitByCommodity[formData.commodity]

  const handleInputChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target

    setFormData((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const handleTypeChange = (type: ListingType) => {
    setFormData((current) => ({
      ...current,
      type,
    }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (isLoading) {
      return
    }

    const quantity = Number(formData.quantity)
    const price = Number(formData.price)

    if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(price) || price <= 0) {
      setError('Vui lòng nhập số lượng và mức giá lớn hơn 0.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/listings/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          quantity,
          price,
        }),
      })

      const contentType = response.headers.get('content-type') ?? ''
      const payload = contentType.includes('application/json') ? await response.json() : null

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Vui lòng đăng nhập để tạo tin giao thương B2B.')
        }

        throw new Error(
          getErrorMessage(payload) ?? 'Không thể đăng tin ngay lúc này. Vui lòng thử lại sau.',
        )
      }

      router.push('/b2b')
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Đã có lỗi xảy ra khi đăng tin. Vui lòng thử lại.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 text-gray-950">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-14">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_460px]">
          <section className="space-y-6">
            <Link
              href="/b2b"
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition hover:border-gray-300 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Quay lại sàn giao thương
            </Link>

            <div className="overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.16),_transparent_34%),linear-gradient(180deg,#ffffff_0%,#f9fafb_100%)] px-6 py-8 sm:px-8 sm:py-10">
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                  B2B Listing Flow
                </span>
                <h1 className="mt-4 text-3xl font-semibold tracking-tight text-gray-950 sm:text-4xl">
                  Tạo tin giao thương B2B
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-gray-600">
                  Một biểu mẫu tối giản để đưa hàng hóa của bạn lên sàn thật nhanh, giữ ma sát thấp
                  và tăng tỷ lệ đối tác phản hồi.
                </p>
              </div>

              <div className="grid gap-4 px-6 py-6 sm:grid-cols-3 sm:px-8">
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-sm font-semibold text-gray-900">4 trường duy nhất</p>
                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    Đi thẳng vào thông tin quyết định để người mua đọc và hành động nhanh hơn.
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-sm font-semibold text-gray-900">Đăng tin trong vài giây</p>
                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    Không có bước dư thừa, không yêu cầu mô tả dài hay cấu hình phức tạp.
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-sm font-semibold text-gray-900">Sẵn sàng chuyển đổi</p>
                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    CTA lớn, rõ ràng và tập trung để đẩy người dùng đến hành động cuối cùng.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[1.75rem] border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-gray-950">Thông tin ngắn nhưng đủ mạnh</p>
                    <p className="mt-2 text-sm leading-6 text-gray-600">
                      Loại giao dịch, mặt hàng, số lượng và giá là bốn tín hiệu đầu tiên mà doanh
                      nghiệp cần để ra quyết định liên hệ.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-amber-50 p-3 text-amber-700">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-gray-950">Hiển thị đơn vị giá rõ ràng</p>
                    <p className="mt-2 text-sm leading-6 text-gray-600">
                      Đơn vị giá đổi theo nông sản đã chọn để đối tác so sánh nhanh hơn ngay từ
                      lúc xem tin.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm sm:p-8 lg:sticky lg:top-8 lg:h-fit">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">
                  Điền nhanh
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-gray-950">
                  Đăng tin chỉ trong một màn hình
                </h2>
                <p className="mt-3 text-sm leading-6 text-gray-600">
                  Chọn giao dịch, mặt hàng, nhập số lượng và giá. Phần còn lại để hệ thống xử lý.
                </p>
              </div>

              <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
                <Leaf className="h-5 w-5" />
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              <fieldset className="space-y-3">
                <legend className="text-sm font-semibold text-gray-900">Loại giao dịch</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {transactionOptions.map((option) => {
                    const isActive = formData.type === option.value

                    return (
                      <label
                        key={option.value}
                        className={`cursor-pointer rounded-2xl border p-4 transition ${
                          isActive
                            ? 'border-emerald-500 bg-emerald-50 shadow-sm shadow-emerald-600/10'
                            : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white'
                        }`}
                      >
                        <input
                          type="radio"
                          name="type"
                          value={option.value}
                          checked={isActive}
                          onChange={() => handleTypeChange(option.value)}
                          className="sr-only"
                        />
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-base font-semibold text-gray-950">{option.label}</p>
                            <p className="mt-1 text-sm leading-6 text-gray-600">
                              {option.description}
                            </p>
                          </div>
                          <span
                            className={`mt-1 h-4 w-4 rounded-full border ${
                              isActive
                                ? 'border-emerald-600 bg-emerald-600 ring-4 ring-emerald-100'
                                : 'border-gray-300 bg-white'
                            }`}
                          />
                        </div>
                      </label>
                    )
                  })}
                </div>
              </fieldset>

              <div className="space-y-2">
                <label htmlFor="commodity" className="text-sm font-semibold text-gray-900">
                  Nông sản
                </label>
                <select
                  id="commodity"
                  name="commodity"
                  value={formData.commodity}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className="h-14 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 text-base text-gray-950 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {commodityOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="quantity" className="text-sm font-semibold text-gray-900">
                    Số lượng
                  </label>
                  <div className="relative">
                    <input
                      id="quantity"
                      name="quantity"
                      type="number"
                      min="0"
                      step="0.1"
                      inputMode="decimal"
                      placeholder="Ví dụ: 25"
                      value={formData.quantity}
                      onChange={handleInputChange}
                      disabled={isLoading}
                      className="h-14 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 pr-20 text-base text-gray-950 outline-none transition placeholder:text-gray-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                      required
                    />
                    <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm font-medium text-gray-500">
                      Tấn
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="price" className="text-sm font-semibold text-gray-900">
                    Mức giá
                  </label>
                  <div className="relative">
                    <input
                      id="price"
                      name="price"
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      placeholder="Ví dụ: 82500"
                      value={formData.price}
                      onChange={handleInputChange}
                      disabled={isLoading}
                      className="h-14 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 pr-24 text-base text-gray-950 outline-none transition placeholder:text-gray-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                      required
                    />
                    <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm font-medium text-gray-500">
                      {priceSuffix}
                    </span>
                  </div>
                  <p className="text-xs leading-5 text-gray-500">
                    Đơn vị giá đang hiển thị theo loại nông sản đã chọn để trình bày tin rõ ràng
                    hơn.
                  </p>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-gray-200 bg-gray-50 px-4 py-4">
                <p className="text-sm font-semibold text-gray-900">Xem nhanh trước khi đăng</p>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  Tin <span className="font-semibold text-gray-900">{selectedType}</span> cho{' '}
                  <span className="font-semibold text-gray-900">{selectedCommodity}</span> với đơn
                  vị giá <span className="font-semibold text-gray-900">{priceSuffix}</span>.
                </p>
              </div>

              {error && (
                <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex h-16 w-full items-center justify-center gap-3 rounded-2xl bg-emerald-600 px-6 text-base font-black tracking-[0.18em] text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:bg-emerald-400 disabled:shadow-none"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  'ĐĂNG TIN NGAY'
                )}
              </button>
            </form>
          </section>
        </div>
      </div>
    </main>
  )
}
