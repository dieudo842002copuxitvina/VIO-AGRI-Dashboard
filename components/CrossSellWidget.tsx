'use client'

import Link from 'next/link'
import { Zap, Package, ShoppingBag } from 'lucide-react'

const products = [
  {
    id: 1,
    name: 'Cảm biến đo độ ẩm',
    price: '250.000',
    icon: Zap,
    description: 'Cảm biến IoT chính xác cao',
  },
  {
    id: 2,
    name: 'Bộ tưới nước tự động',
    price: '1.200.000',
    icon: Package,
    description: 'Hệ thống tưới thông minh',
  },
  {
    id: 3,
    name: 'Phân bón hữu cơ',
    price: '180.000',
    icon: ShoppingBag,
    description: 'Phân hữu cơ cao cấp',
  },
]

export default function CrossSellWidget() {
  return (
    <div className="bg-white rounded-xl shadow-md border border-green-100 p-6 sticky top-6">
      <h3 className="text-lg font-bold text-gray-800 mb-6">Sản phẩm khuyên dùng</h3>

      <div className="space-y-4">
        {products.map((product) => {
          const Icon = product.icon
          return (
            <div
              key={product.id}
              className="p-4 border border-gray-100 rounded-lg hover:border-green-300 hover:bg-green-50 transition-all cursor-pointer"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800 line-clamp-1">{product.name}</p>
                  <p className="text-xs text-gray-500 line-clamp-1">{product.description}</p>
                </div>
              </div>

              <div className="flex items-center justify-between mb-3">
                <p className="text-lg font-bold text-green-600">{product.price} đ</p>
              </div>

              <button className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm font-semibold py-2 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all">
                Xem chi tiết
              </button>
            </div>
          )
        })}
      </div>

      <Link
        href="/shop"
        className="block mt-6 text-center text-sm font-semibold text-green-600 hover:text-green-700 py-2 border border-green-300 rounded-lg hover:bg-green-50 transition-all"
      >
        Xem tất cả sản phẩm →
      </Link>
    </div>
  )
}
