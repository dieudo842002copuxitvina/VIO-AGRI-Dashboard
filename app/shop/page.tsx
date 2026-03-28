'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/utils/supabase/client'
import { ShoppingCart, ExternalLink, Cpu, Leaf, Wrench } from 'lucide-react'

export default function ShopPage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProducts() {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      if (data) setProducts(data)
      setLoading(false)
    }
    fetchProducts()
  }, [])

  // Hàm chọn icon theo danh mục
  const getCategoryIcon = (category: string) => {
    if (category === 'iot') return <Cpu className="w-5 h-5 text-blue-500" />
    if (category === 'fertilizer') return <Leaf className="w-5 h-5 text-green-500" />
    return <Wrench className="w-5 h-5 text-gray-500" />
  }

  if (loading) return <div className="p-20 text-center animate-pulse">Đang tải cửa hàng...</div>

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Cửa hàng VIO AGRI</h1>
        <p className="text-gray-500 mt-2">Vật tư nông nghiệp & Giải pháp canh tác số hóa</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {products.map((item) => (
          <div key={item.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all flex flex-col">
            {/* Ảnh sản phẩm */}
            <div className="h-48 w-full bg-gray-100">
              <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
            </div>

            {/* Thông tin */}
            <div className="p-5 flex-1 flex flex-col">
              <div className="flex items-center space-x-2 mb-2">
                {getCategoryIcon(item.category)}
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  {item.category === 'iot' ? 'Thiết bị thông minh' : item.category === 'fertilizer' ? 'Vật tư' : 'Công cụ'}
                </span>
              </div>
              
              <h3 className="text-lg font-bold text-gray-800 mb-2 leading-tight">{item.name}</h3>
              <p className="text-sm text-gray-600 mb-4 flex-1">{item.description}</p>
              <p className="text-xl font-extrabold text-green-600 mb-5">{item.price.toLocaleString()} đ</p>

              {/* Nút Mua hàng thông minh */}
              {item.affiliate_link ? (
                <a href={item.affiliate_link} target="_blank" rel="noreferrer" className="w-full flex items-center justify-center bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-xl transition-all">
                  Mua trên Sàn TMĐT <ExternalLink className="w-4 h-4 ml-2" />
                </a>
              ) : (
                <button className="w-full flex items-center justify-center bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl transition-all">
                  Thêm vào giỏ hàng <ShoppingCart className="w-4 h-4 ml-2" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}