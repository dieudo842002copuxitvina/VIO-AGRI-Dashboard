'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/utils/supabase/client'
import { AlertCircle, Leaf, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import PriceChart from '@/components/PriceChart'
import Header from '@/components/Header'
import CrossSellWidget from '@/components/CrossSellWidget'
import WeatherWidget from '@/components/WeatherWidget'
// ... các import khác

interface Commodity {
  id: string
  name: string
  symbol: string
  current_price: number
  unit: string
  trend: 'up' | 'down' | 'stable'
}

export default function Home() {
  const [commodities, setCommodities] = useState<Commodity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string>('')

  useEffect(() => {
    const fetchCommodities = async () => {
      try {
        setIsLoading(true)
        const { data, error } = await supabase
          .from('commodities')
          .select('*')

        if (error) {
          throw error
        }

        setCommodities(data || [])
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : 'Lỗi kết nối cơ sở dữ liệu')
      } finally {
        setIsLoading(false)
      }
    }

    fetchCommodities()
  }, [])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(price)
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-5 h-5 text-green-600" />
      case 'down':
        return <TrendingDown className="w-5 h-5 text-red-600" />
      case 'stable':
        return <Minus className="w-5 h-5 text-gray-400" />
      default:
        return null
    }
  }

  {/* Box chứa dữ liệu giá nông sản */}
          <div className="bg-white p-6 rounded-2xl border shadow-sm">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Biến động giá Nông sản</h2>
            
            {isLoading ? (
               <p className="text-gray-500 animate-pulse p-4">Đang tải dữ liệu giá...</p>
            ) : errorMessage ? (
               <p className="text-red-500 p-4">{errorMessage}</p>
            ) : (
               <>
                 {/* 1. Hiển thị các thẻ Giá (Commodity Cards) */}
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                   {commodities.map((item) => (
                     <div key={item.id} className="bg-gray-50 p-4 rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
                       <div className="flex justify-between items-start mb-2">
                         <span className="text-sm font-semibold text-gray-600">{item.name}</span>
                         {getTrendIcon(item.trend)}
                       </div>
                       <div className="text-lg font-bold text-gray-800">
                         {formatPrice(item.current_price)}
                       </div>
                       <div className="text-xs text-gray-500 mt-1">/ {item.unit}</div>
                     </div>
                   ))}
                 </div>

                 {/* 2. Hiển thị Biểu đồ ngay bên dưới */}
                 <div className="border-t pt-6">
                   <PriceChart /> 
                 </div>
               </>
            )}
          </div>

  // ... phần logic useState và useEffect cũ của bạn ở trên giữ nguyên nhé ...

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Tổng quan thị trường</h1>
        <p className="text-gray-500">Cập nhật dữ liệu thời tiết và biến động giá theo thời gian thực</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Cột Trái (Chiếm 2 phần): Thời tiết + Biểu đồ giá */}
        <div className="lg:col-span-2 space-y-6">
          <WeatherWidget />
          
          {/* Box chứa dữ liệu giá nông sản cũ của bạn */}
          <div className="bg-white p-6 rounded-2xl border shadow-sm">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Biến động giá Nông sản</h2>
            
            {/* Nếu bạn đang dùng component PriceChart thì gọi nó ra, hoặc map danh sách commodities ra đây */}
            {isLoading ? (
               <p className="text-gray-500 animate-pulse">Đang tải dữ liệu giá...</p>
            ) : errorMessage ? (
               <p className="text-red-500">{errorMessage}</p>
            ) : (
               <PriceChart />
            )}
          </div>
        </div>

        {/* Cột Phải (Chiếm 1 phần): Vũ khí Bán chéo */}
        <div className="lg:col-span-1">
          <CrossSellWidget />
        </div>

      </div>
    </div>
  )
}
