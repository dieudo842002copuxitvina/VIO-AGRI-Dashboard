'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/utils/supabase/client'
import { AlertCircle, Leaf, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import PriceChart from '@/components/PriceChart'
import Header from '@/components/Header'
import CrossSellWidget from '@/components/CrossSellWidget'

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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header with Auth */}
      <Header />

      {/* Main Content */}
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Error State */}
          {errorMessage && (
            <div className="mb-8 flex items-start gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-700 font-medium">Lỗi kết nối cơ sở dữ liệu</p>
                <p className="text-red-600 text-sm mt-1">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Skeletons */}
              <div className="lg:col-span-2 space-y-6">
                {[...Array(2)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-xl shadow-md p-6 border border-green-100 animate-pulse"
                  >
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="grid grid-cols-3 gap-4">
                      {[...Array(3)].map((_, j) => (
                        <div key={j} className="space-y-2">
                          <div className="h-4 bg-gray-100 rounded"></div>
                          <div className="h-6 bg-gray-200 rounded"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {/* Right Column - Skeleton */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-xl shadow-md p-6 border border-green-100 animate-pulse h-96">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-4 bg-gray-100 rounded"></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : commodities.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Price Cards and Charts */}
              <div className="lg:col-span-2 space-y-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Bảng giá nông sản</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {commodities.map((commodity) => (
                    <div
                      key={commodity.id}
                      className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow border border-green-100 overflow-hidden flex flex-col"
                    >
                      {/* Card Header */}
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 border-b border-green-100">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-bold text-gray-800">{commodity.name}</h3>
                            <p className="text-sm text-gray-600">Mã: {commodity.symbol}</p>
                          </div>
                          <div className="flex-shrink-0">
                            {getTrendIcon(commodity.trend)}
                          </div>
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="p-4 flex-1 flex flex-col">
                        <div className="mb-4">
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Giá hiện tại</p>
                          <p className="text-2xl font-bold text-green-600">
                            {formatPrice(commodity.current_price)}
                          </p>
                        </div>

                        <div className="mb-6">
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Đơn vị tính</p>
                          <p className="text-sm text-gray-700 font-medium">{commodity.unit}</p>
                        </div>

                        {/* Price Chart */}
                        <PriceChart commodityId={commodity.id} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column - Cross Sell Widget */}
              <div className="lg:col-span-1">
                <CrossSellWidget />
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Leaf className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">Không có dữ liệu nông sản</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
