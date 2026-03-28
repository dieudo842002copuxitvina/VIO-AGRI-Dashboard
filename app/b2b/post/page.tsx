'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/utils/supabase/client'
import Link from 'next/link'

export default function PostB2BPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [commodities, setCommodities] = useState<any[]>([])
  const [userId, setUserId] = useState<string | null>(null)

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    commodity_id: '',
    quantity: '',
    price_per_unit: '',
    location: '',
    description: ''
  })

  // 1. Kiểm tra đăng nhập và lấy danh sách Nông sản
  useEffect(() => {
    const initData = async () => {
      // Lấy User ID
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        alert("Bạn cần đăng nhập để đăng tin!")
        router.push('/login')
        return
      }
      setUserId(session.user.id)

      // Lấy danh sách nông sản cho thẻ Select
      const { data: comms } = await supabase.from('commodities').select('*')
      if (comms) {
        setCommodities(comms)
        if (comms.length > 0) {
          setFormData(prev => ({ ...prev, commodity_id: comms[0].id }))
        }
      }
    }
    initData()
  }, [router])

  // 2. Hàm Xử lý Gửi Dữ liệu
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!userId) throw new Error("Không tìm thấy thông tin tài khoản. Vui lòng tải lại trang.")

      // Đóng gói dữ liệu chuẩn bị gửi (ép kiểu Số chuẩn xác)
      const payload = {
        user_id: userId,
        title: formData.title,
        commodity_id: formData.commodity_id,
        quantity: Number(formData.quantity),
        price_per_unit: Number(formData.price_per_unit),
        location: formData.location,
        description: formData.description,
        status: 'open'
      }

      console.log("Dữ liệu chuẩn bị gửi lên Supabase:", payload)

      // Gửi lệnh Insert và YÊU CẦU trả về dữ liệu vừa tạo (.select())
      const { data, error } = await supabase
        .from('b2b_listings')
        .insert([payload])
        .select()

      if (error) {
        throw error // Nếu có lỗi từ database, ném ra ngay để xử lý
      }

      console.log("Đã lưu thành công vào Database:", data)
      alert("🎉 Đăng tin chào bán thành công!")
      router.push('/b2b')

    } catch (error: any) {
      console.error("Lỗi thực sự khi Insert:", error)
      alert("Lỗi đăng tin: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow-md rounded-xl mt-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-green-700">Đăng tin chào bán B2B</h1>
        <Link href="/b2b" className="text-gray-500 hover:text-gray-800 text-sm">Quay lại chợ</Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề tin đăng *</label>
          <input required type="text" name="title" value={formData.title} onChange={handleChange} placeholder="VD: Bán 10 tấn Tiêu Đen chuẩn xuất khẩu" className="w-full p-2 border rounded-md" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Loại nông sản *</label>
            <select name="commodity_id" value={formData.commodity_id} onChange={handleChange} className="w-full p-2 border rounded-md bg-white">
              {commodities.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.unit})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng *</label>
            <input required type="number" min="1" step="any" name="quantity" value={formData.quantity} onChange={handleChange} placeholder="VD: 10" className="w-full p-2 border rounded-md" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Giá đề xuất (VND) *</label>
            <input required type="number" min="0" step="any" name="price_per_unit" value={formData.price_per_unit} onChange={handleChange} placeholder="VD: 120000" className="w-full p-2 border rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Khu vực giao hàng *</label>
            <input required type="text" name="location" value={formData.location} onChange={handleChange} placeholder="VD: Đồng Nai" className="w-full p-2 border rounded-md" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả chi tiết</label>
          <textarea name="description" value={formData.description} onChange={handleChange} rows={4} placeholder="Mô tả thêm về quy cách đóng gói, chất lượng..." className="w-full p-2 border rounded-md"></textarea>
        </div>

        <button type="submit" disabled={loading} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-md transition-all">
          {loading ? 'Đang xử lý...' : 'Đăng tin ngay'}
        </button>
      </form>
    </div>
  )
}