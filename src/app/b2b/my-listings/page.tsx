'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Trash2, PackageCheck } from 'lucide-react'
import Link from 'next/link'

export default function MyListingsPage() {
  const router = useRouter()
  const [myListings, setMyListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchMyData() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('b2b_listings')
        .select('*, commodities(name, unit)')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

      if (data) setMyListings(data)
      setLoading(false)
    }
    fetchMyData()
  }, [router])

  // Hàm Xóa tin đăng
  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa tin này không?")) return

    const { error } = await supabase.from('b2b_listings').delete().eq('id', id)
    if (error) {
      alert("Lỗi khi xóa: " + error.message)
    } else {
      setMyListings(myListings.filter(item => item.id !== id))
      alert("Đã xóa tin thành công!")
    }
  }

  // Hàm Đánh dấu đã bán xong (Chuyển status thành closed)
  const handleMarkAsSold = async (id: string) => {
    const { error } = await supabase.from('b2b_listings').update({ status: 'closed' }).eq('id', id)
    if (error) {
      alert("Lỗi cập nhật: " + error.message)
    } else {
      setMyListings(myListings.map(item => item.id === id ? { ...item, status: 'closed' } : item))
      alert("Chúc mừng bạn đã chốt đơn thành công!")
    }
  }

  if (loading) return <div className="p-20 text-center animate-pulse">Đang tải dữ liệu của bạn...</div>

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Quản lý tin đăng</h1>
          <p className="text-gray-500 mt-2">Xem, cập nhật trạng thái hoặc xóa các chào hàng của bạn</p>
        </div>
        <Link href="/b2b/post" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium">
          + Đăng tin mới
        </Link>
      </div>

      {myListings.length === 0 ? (
        <div className="text-center py-16 bg-white border rounded-xl">
          <p className="text-gray-500">Bạn chưa có tin đăng nào.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="p-4 font-semibold text-gray-600">Tiêu đề</th>
                <th className="p-4 font-semibold text-gray-600">Nông sản</th>
                <th className="p-4 font-semibold text-gray-600">Trạng thái</th>
                <th className="p-4 font-semibold text-gray-600 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {myListings.map((item) => (
                <tr key={item.id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-medium text-gray-800">{item.title}</td>
                  <td className="p-4 text-gray-600">{item.commodities?.name}</td>
                  <td className="p-4">
                    {item.status === 'open' || item.status === 'active' ? (
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-bold">Đang bán</span>
                    ) : (
                      <span className="bg-gray-200 text-gray-600 px-2 py-1 rounded-full text-xs font-bold">Đã chốt xong</span>
                    )}
                  </td>
                  <td className="p-4 text-right space-x-2">
                    {item.status === 'open' || item.status === 'active' && (
                      <button onClick={() => handleMarkAsSold(item.id)} className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200" title="Đánh dấu đã bán">
                        <PackageCheck className="w-5 h-5" />
                      </button>
                    )}
                    <button onClick={() => handleDelete(item.id)} className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200" title="Xóa tin">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

