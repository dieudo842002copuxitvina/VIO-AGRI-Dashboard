'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { BarChart3, Package, ShoppingBag, Trash2 } from 'lucide-react'

export default function AdminDashboard() {
  const [stats, setStats] = useState({ listings: 0, products: 0 })
  const [recentListings, setRecentListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAdminData() {
      // 1. Láº¥y tá»•ng sá»‘ tin Ä‘Äƒng B2B
      const { count: listingsCount } = await supabase
        .from('b2b_listings')
        .select('*', { count: 'exact', head: true })

      // 2. Láº¥y tá»•ng sá»‘ sáº£n pháº©m trong Shop
      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })

      setStats({
        listings: listingsCount || 0,
        products: productsCount || 0
      })

      // 3. Láº¥y danh sÃ¡ch 10 tin Ä‘Äƒng má»›i nháº¥t Ä‘á»ƒ kiá»ƒm duyá»‡t
      const { data: listings } = await supabase
        .from('b2b_listings')
        .select('*, commodities(name)')
        .order('created_at', { ascending: false })
        .limit(10)

      if (listings) setRecentListings(listings)
      setLoading(false)
    }

    fetchAdminData()
  }, [])

  // HÃ m dÃ nh cho Admin: XÃ³a báº¥t ká»³ tin Ä‘Äƒng nÃ o vi pháº¡m
  const handleAdminDelete = async (id: string) => {
    if (!confirm("XÃ³a tin Ä‘Äƒng nÃ y khá»i há»‡ thá»‘ng?")) return

    const { error } = await supabase.from('b2b_listings').delete().eq('id', id)
    if (!error) {
      setRecentListings(recentListings.filter(item => item.id !== id))
      setStats(prev => ({ ...prev, listings: prev.listings - 1 }))
      alert("ÄÃ£ xÃ³a tin vi pháº¡m!")
    }
  }

  if (loading) return <div className="p-20 text-center animate-pulse">Äang táº£i trung tÃ¢m Ä‘iá»u hÃ nh...</div>

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Tá»•ng hÃ nh dinh VIO AGRI</h1>
        <p className="text-gray-500 mt-2">Báº£ng Ä‘iá»u khiá»ƒn trung tÃ¢m dÃ nh cho Ban Quáº£n Trá»‹</p>
      </div>

      {/* Tháº» Thá»‘ng KÃª */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="p-4 bg-blue-100 text-blue-600 rounded-xl"><Package className="w-8 h-8" /></div>
          <div>
            <p className="text-sm font-medium text-gray-500">Tá»•ng tin B2B</p>
            <h3 className="text-2xl font-bold text-gray-800">{stats.listings}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="p-4 bg-green-100 text-green-600 rounded-xl"><ShoppingBag className="w-8 h-8" /></div>
          <div>
            <p className="text-sm font-medium text-gray-500">Váº­t tÆ° IoT & Affiliate</p>
            <h3 className="text-2xl font-bold text-gray-800">{stats.products}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="p-4 bg-purple-100 text-purple-600 rounded-xl"><BarChart3 className="w-8 h-8" /></div>
          <div>
            <p className="text-sm font-medium text-gray-500">Doanh thu dá»± kiáº¿n</p>
            <h3 className="text-2xl font-bold text-gray-800">Äang cáº­p nháº­t...</h3>
          </div>
        </div>
      </div>

      {/* Báº£ng Kiá»ƒm duyá»‡t */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800">Tin Ä‘Äƒng má»›i nháº¥t trÃªn sÃ n</h2>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b text-sm">
              <th className="p-4 font-semibold text-gray-600">TiÃªu Ä‘á»</th>
              <th className="p-4 font-semibold text-gray-600">Loáº¡i hÃ ng</th>
              <th className="p-4 font-semibold text-gray-600">GiÃ¡</th>
              <th className="p-4 font-semibold text-gray-600">Khu vá»±c</th>
              <th className="p-4 font-semibold text-gray-600 text-right">Thao tÃ¡c Admin</th>
            </tr>
          </thead>
          <tbody>
            {recentListings.map((item) => (
              <tr key={item.id} className="border-b hover:bg-gray-50 transition-colors text-sm">
                <td className="p-4 font-medium text-gray-800">{item.title}</td>
                <td className="p-4 text-gray-600">{item.commodities?.name}</td>
                <td className="p-4 text-red-600 font-bold">{item.price_per_unit?.toLocaleString()} Ä‘</td>
                <td className="p-4 text-gray-600">{item.location}</td>
                <td className="p-4 text-right">
                  <button onClick={() => handleAdminDelete(item.id)} className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200" title="XÃ³a vi pháº¡m">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
