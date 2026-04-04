'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { type FormEvent, useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { ArrowLeft, Loader2, ShieldCheck, Sparkles, Store, TrendingUp, Upload, X } from 'lucide-react'
import { getSupabaseBrowserClient } from '@/lib/supabase'

type ListingType = 'buy' | 'sell'
type CommodityValue = 'coffee' | 'pepper' | 'rice' | 'cashew' | 'other'
type ListingStatus = 'active'

type FormState = {
  title: string
  commodity: CommodityValue
  type: ListingType
  quantity: number | ''
  price: number | ''
  description: string
}

interface CommodityOption {
  value: CommodityValue
  label: string
  databaseValue: string
}

interface ListingInsert {
  user_id: string
  title: string
  commodity: string
  type: ListingType
  quantity: number
  price: number
  description: string
  status: ListingStatus
  image_url?: string | null
}

const commodityOptions: CommodityOption[] = [
  { value: 'coffee', label: 'Cà phê', databaseValue: 'coffee' },
  { value: 'pepper', label: 'Hồ tiêu', databaseValue: 'pepper' },
  { value: 'rice', label: 'Lúa gạo', databaseValue: 'rice' },
  { value: 'cashew', label: 'Hạt điều', databaseValue: 'cashew' },
  { value: 'other', label: 'Khác', databaseValue: 'Khác' },
]

const typeOptions: Array<{ value: ListingType; label: string }> = [
  { value: 'sell', label: 'Bán' },
  { value: 'buy', label: 'Mua' },
]

const initialFormState: FormState = {
  title: '',
  commodity: 'coffee',
  type: 'sell',
  quantity: '',
  price: '',
  description: '',
}

function getPriceSuffix(commodity: CommodityValue) {
  if (commodity === 'rice' || commodity === 'cashew') {
    return 'USD/tấn'
  }

  return 'VNĐ/kg'
}

function getFriendlyErrorMessage(message: string) {
  if (!message) {
    return 'Không thể đăng tin ngay lúc này. Vui lòng thử lại sau.'
  }

  if (message.toLowerCase().includes('row-level security')) {
    return 'Tài khoản của bạn chưa có quyền đăng tin. Vui lòng đăng nhập lại hoặc kiểm tra quyền Supabase.'
  }

  return message
}

export default function B2BPostPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState<FormState>(initialFormState)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadCurrentUser() {
      const supabase = getSupabaseBrowserClient()
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (!isMounted) {
        return
      }

      if (authError || !user) {
        router.replace('/login')
        return
      }

      setCurrentUser(user)
      setIsCheckingAuth(false)
    }

    void loadCurrentUser()

    return () => {
      isMounted = false
    }
  }, [router])

  const selectedCommodity =
    commodityOptions.find((option) => option.value === formData.commodity) ?? commodityOptions[0]

  const handleTextChange = (field: 'title' | 'description') => {
    return (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormData((current) => ({
        ...current,
        [field]: event.target.value,
      }))
    }
  }

  const handleSelectChange = (field: 'commodity' | 'type') => {
    return (event: React.ChangeEvent<HTMLSelectElement>) => {
      const nextValue = event.target.value

      setFormData((current) => ({
        ...current,
        [field]: nextValue,
      }))
    }
  }

  const handleNumberChange = (field: 'quantity' | 'price') => {
    return (event: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = event.target.value

      setFormData((current) => ({
        ...current,
        [field]: rawValue === '' ? '' : Number(rawValue),
      }))
    }
  }

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setImageFile(file)
      const previewUrl = URL.createObjectURL(file)
      setImagePreview(previewUrl)
    }
  }

  const handleImageRemove = () => {
    setImageFile(null)
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview)
    }
    setImagePreview(null)
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    const file = event.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      setImageFile(file)
      const previewUrl = URL.createObjectURL(file)
      setImagePreview(previewUrl)
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (isLoading) {
      return
    }

    if (!currentUser) {
      router.replace('/login')
      return
    }

    const title = formData.title.trim()
    const description = formData.description.trim()
    const quantity = typeof formData.quantity === 'number' ? formData.quantity : Number.NaN
    const price = typeof formData.price === 'number' ? formData.price : Number.NaN

    if (!title) {
      setError('Vui lòng nhập tiêu đề tin đăng để đối tác hiểu nhanh nhu cầu của bạn.')
      return
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      setError('Vui lòng nhập số lượng lớn hơn 0.')
      return
    }

    if (!Number.isFinite(price) || price <= 0) {
      setError('Vui lòng nhập mức giá lớn hơn 0.')
      return
    }

    setIsLoading(true)
    setError('')

    let imageUrl: string | null = null

    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `${currentUser.id}/${fileName}`

      const supabase = getSupabaseBrowserClient()
      const { error: uploadError } = await supabase.storage.from('listing-images').upload(filePath, imageFile)

      if (uploadError) {
        setError(`Lỗi tải ảnh: ${uploadError.message}`)
        setIsLoading(false)
        return
      }

      const { data } = supabase.storage.from('listing-images').getPublicUrl(filePath)
      imageUrl = data.publicUrl
    }

    const listingPayload: ListingInsert = {
      user_id: currentUser.id,
      title,
      commodity: selectedCommodity.databaseValue,
      type: formData.type,
      quantity,
      price,
      description,
      status: 'active',
      image_url: imageUrl,
    }

    const supabase = getSupabaseBrowserClient()
    const { error: insertError } = await supabase.from('listings').insert(listingPayload)

    if (insertError) {
      setError(getFriendlyErrorMessage(insertError.message))
      setIsLoading(false)
      return
    }

    router.push('/profile')
    router.refresh()
  }

  if (isCheckingAuth) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-[2rem] border border-gray-200 bg-white p-8 shadow-sm sm:p-10">
            <div className="flex items-center gap-4 rounded-3xl border border-emerald-100 bg-emerald-50 px-5 py-5 text-emerald-800">
              <Loader2 className="h-5 w-5 animate-spin" />
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em]">Supabase Auth</p>
                <p className="mt-1 text-sm text-emerald-700">
                  Đang xác thực phiên đăng nhập trước khi mở phòng đăng tin.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 text-gray-950 sm:px-6 lg:px-8 lg:py-14">
      <div className="mx-auto max-w-3xl space-y-6">
        <Link
          href="/b2b"
          className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 shadow-sm transition hover:border-gray-300 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại sàn giao thương
        </Link>

        <section className="overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.16),_transparent_34%),linear-gradient(180deg,#ffffff_0%,#f9fafb_100%)] px-6 py-8 sm:px-8 sm:py-10">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                Phòng đăng tin bảo mật
              </span>
              <span className="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-600">
                {currentUser?.email || 'Tài khoản đã xác thực'}
              </span>
            </div>

            <h1 className="mt-5 text-3xl font-semibold tracking-tight text-gray-950 sm:text-4xl">
              Đăng tin Giao thương B2B
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-gray-600">
              Chi tiết càng chuẩn xác, cơ hội chốt deal càng cao. Vui lòng nhập thông tin sản phẩm đầy đủ.
            </p>
          </div>

          <div className="grid gap-4 border-b border-gray-100 bg-gray-50 px-6 py-5 sm:grid-cols-3 sm:px-8">
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-950">Tin đăng rõ ràng</p>
                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    Mặt hàng, khối lượng và giá chào minh bạch giúp đối tác đánh giá cơ hội nhanh hơn.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
                  <Store className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-950">Phân hệ giao dịch B2B</p>
                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    Biểu mẫu được tối ưu cho luồng mua bán nông sản chuyên nghiệp trên sàn doanh nghiệp.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-amber-50 p-3 text-amber-700">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-950">Thu hút deal tự động</p>
                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    Giá chào chính xác giúp hệ thống AI matching ưu tiên tin của bạn trong luồng gợi ý.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-8 sm:px-8 sm:py-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="title" className="text-sm font-semibold text-gray-900">
                    Tiêu đề tin đăng
                  </label>
                  <input
                    id="title"
                    name="title"
                    type="text"
                    value={formData.title}
                    onChange={handleTextChange('title')}
                    placeholder="VD: Bán 120 tấn cà phê Robusta xuất khẩu tháng 5"
                    disabled={isLoading}
                    className="mt-2 h-14 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 text-base text-gray-950 outline-none transition placeholder:text-gray-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="commodity" className="text-sm font-semibold text-gray-900">
                    Nông sản
                  </label>
                  <select
                    id="commodity"
                    name="commodity"
                    value={formData.commodity}
                    onChange={handleSelectChange('commodity')}
                    disabled={isLoading}
                    className="mt-2 h-14 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 text-base text-gray-950 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {commodityOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="type" className="text-sm font-semibold text-gray-900">
                    Loại giao dịch
                  </label>
                  <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleSelectChange('type')}
                    disabled={isLoading}
                    className="mt-2 h-14 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 text-base text-gray-950 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {typeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="quantity" className="text-sm font-semibold text-gray-900">
                    Số lượng
                  </label>
                  <div className="relative mt-2">
                    <input
                      id="quantity"
                      name="quantity"
                      type="number"
                      min="0"
                      step="0.1"
                      value={formData.quantity === '' ? '' : formData.quantity}
                      onChange={handleNumberChange('quantity')}
                      placeholder="VD: 5000"
                      disabled={isLoading}
                      className="h-14 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 pr-20 text-base text-gray-950 outline-none transition placeholder:text-gray-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                      required
                    />
                    <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm font-medium text-gray-500">
                      Tấn
                    </span>
                  </div>
                </div>

                <div>
                  <label htmlFor="price" className="text-sm font-semibold text-gray-900">
                    Mức giá
                  </label>
                  <div className="relative mt-2">
                    <input
                      id="price"
                      name="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.price === '' ? '' : formData.price}
                      onChange={handleNumberChange('price')}
                      placeholder="VD: 82500"
                      disabled={isLoading}
                      className="h-14 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 pr-28 text-base text-gray-950 outline-none transition placeholder:text-gray-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                      required
                    />
                    <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm font-medium text-gray-500">
                      {getPriceSuffix(formData.commodity)}
                    </span>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-sm font-semibold text-gray-900">
                    Ảnh lô hàng
                  </label>
                  <div
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className="mt-2 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-8 text-center transition hover:border-emerald-500 hover:bg-emerald-50"
                  >
                    {imagePreview ? (
                      <div className="space-y-4">
                        <div className="relative mx-auto h-40 w-40">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="h-full w-full rounded-xl object-cover"
                          />
                        </div>
                        <div className="flex flex-col items-center gap-2">
                          <p className="text-sm font-medium text-gray-900">
                            {imageFile?.name}
                          </p>
                          <button
                            type="button"
                            onClick={handleImageRemove}
                            disabled={isLoading}
                            className="inline-flex items-center gap-2 rounded-lg bg-red-100 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <X className="h-4 w-4" />
                            Thay đổi ảnh
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="cursor-pointer">
                        <div className="flex flex-col items-center gap-3">
                          <div className="rounded-xl bg-emerald-100 p-3 text-emerald-600">
                            <Upload className="h-6 w-6" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              Kéo ảnh vào đây hoặc click để chọn
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              Hỗ trợ: JPG, PNG, WebP. Kích thước tối đa 5MB
                            </p>
                          </div>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageSelect}
                          disabled={isLoading}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="description" className="text-sm font-semibold text-gray-900">
                    Mô tả lô hàng
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={5}
                    value={formData.description}
                    onChange={handleTextChange('description')}
                    placeholder="Mô tả chất lượng, quy cách đóng gói, thời gian giao hàng hoặc ghi chú thương lượng để tăng độ tin cậy của tin đăng."
                    disabled={isLoading}
                    className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 text-base text-gray-950 outline-none transition placeholder:text-gray-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-gray-200 bg-gray-50 p-5">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-950">Tóm tắt trước khi đưa lên sàn</p>
                    <p className="mt-2 text-sm leading-6 text-gray-600">
                      Tin <span className="font-semibold text-gray-950">{formData.type === 'sell' ? 'Bán' : 'Mua'}</span>{' '}
                      cho <span className="font-semibold text-gray-950">{selectedCommodity.label}</span> với đơn vị giá{' '}
                      <span className="font-semibold text-gray-950">{getPriceSuffix(formData.commodity)}</span>.
                    </p>
                  </div>
                </div>
              </div>

              {error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex h-16 w-full items-center justify-center gap-3 rounded-2xl bg-emerald-600 px-6 text-base font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:bg-emerald-400 disabled:shadow-none"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    {imageFile ? 'Đang tải ảnh và đăng tin...' : 'Đang đẩy lên sàn...'}
                  </>
                ) : (
                  'Đăng tin lên sàn'
                )}
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  )
}
