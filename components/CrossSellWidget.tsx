'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/utils/supabase/client'
import { ShoppingCart, ExternalLink, Zap } from 'lucide-react'

export default function CrossSellWidget() {
  const [products, setProducts] = useState<any[]>([])

  useEffect(() => {
    async function fetchTopProducts() {
      // Chỉ lấy 2 sản phẩm nổi bật nhất để làm "mồi nhử"
      const { data } = await supabase
        .from('products')
        .select('*')
        .limit(2)
      
      if (data) setProducts(data)
    }
    fetchTopProducts()
  }, [])

  if (products.length === 0) return null

  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100 shadow-sm">
      <div className="flex items-center mb-4">
        <Zap className="text-orange-500 w-5 h-5 mr-2 animate-pulse" />
        <h3 className="text-lg font-bold text-gray-800">Giải pháp nâng cao năng suất</h3>
      </div>
      
      <div className="space-y-4">
        {products.map((item) => (
          <div key={item.id} className="bg-white p-4 rounded-xl border border-green-100 hover:shadow-md transition-all flex items-center space-x-4">
            <img src={item.image_url} alt={item.name} className="w-16 h-16 object-cover rounded-lg bg-gray-100" />
            <div className="flex-1">
              <h4 className="font-semibold text-gray-800 text-sm line-clamp-2">{item.name}</h4>
              <p className="text-green-600 font-bold mt-1">{item.price.toLocaleString()} đ</p>
            </div>
            
            {item.affiliate_link ? (
              <a href={item.affiliate_link} target="_blank" rel="noreferrer" className="bg-orange-100 hover:bg-orange-200 text-orange-600 p-2 rounded-lg transition-colors">
                <ExternalLink className="w-5 h-5" />
              </a>
            ) : (
              <button className="bg-green-100 hover:bg-green-200 text-green-700 p-2 rounded-lg transition-colors">
                <ShoppingCart className="w-5 h-5" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}