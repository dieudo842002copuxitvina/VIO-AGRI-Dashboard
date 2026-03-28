'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/utils/supabase/client'
import { MapPin } from 'lucide-react'

export default function B2BMarketplace() {
  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchListings() {
      try {
        // Lấy dữ liệu và nối bảng để lấy tên nông sản
        const { data, error } = await supabase
          .from('b2b_listings')
          .select(`
            *,
            commodities (
              name,
              unit
            )
          `)
          .eq('status', 'open')
          .order('created_at', { ascending: false })

        if (error) {
          console.error("Lỗi Supabase khi tải:", error.message)
          return
        }

        if (data) {
          console.log("Dữ liệu thật kéo về từ Supabase:", data) // <--- MÁY QUÉT ĐÂY
          setListings(data)
        }
      } catch (err) {
        console.error("Lỗi hệ thống:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchListings()
  }, [])

  if (loading) {
    return <div className="p-20 text-center text-gray-500 animate-pulse">Đang tải dữ liệu sàn giao dịch...</div>
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Sàn giao dịch B2B</h1>
          <p className="text-gray-500 mt-2">Khám phá các cơ hội chào bán nông sản</p>
        </div>
        <Link href="/b2b/post" className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium shadow-sm transition-all">
          + Đăng tin chào bán mới
        </Link>
      </div>

      {listings.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <p className="text-gray-500 mb-4 text-lg">Hiện chưa có tin đăng nào trên sàn.</p>
          <Link href="/b2b/post" className="text-green-600 font-medium hover:underline">
            Hãy là người đầu tiên đăng tin
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((item) => (
            <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
              <h3 className="text-xl font-bold text-gray-800 mb-3">{item.title}</h3>
              <div className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold mb-4">
                {item.commodities?.name || 'Nông sản'}
              </div>
              <div className="space-y-2 text-gray-600 text-sm">
                <p><span className="font-medium">Khối lượng:</span> {item.quantity} {item.commodities?.unit}</p>
                <p><span className="font-medium">Giá đề xuất:</span> <span className="text-red-600 font-bold">{item.price_per_unit?.toLocaleString()} VND</span></p>
                <div className="flex items-center text-gray-500 mt-3 pt-3 border-t border-gray-100">
                  <MapPin className="w-4 h-4 mr-1"/> {item.location}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}