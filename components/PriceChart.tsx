'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/utils/supabase/client'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface PriceData {
  recorded_date: string
  price: number
}

interface PriceChartProps {
  commodityId: string
}

// Generate mock data for 7 days
const generateMockData = (basePrice: number = 10000): PriceData[] => {
  const data: PriceData[] = []
  const today = new Date()

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateString = date.toISOString().split('T')[0]

    // Generate price with random fluctuation (±5%)
    const fluctuation = (Math.random() - 0.5) * 0.1 * basePrice
    const price = Math.round(basePrice + fluctuation)

    data.push({
      recorded_date: dateString,
      price,
    })
  }

  return data
}

export default function PriceChart({ commodityId }: PriceChartProps) {
  const [chartData, setChartData] = useState<PriceData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchPriceHistory = async () => {
      try {
        setIsLoading(true)
        const { data, error } = await supabase
          .from('price_history')
          .select('recorded_date, price')
          .eq('commodity_id', commodityId)
          .order('recorded_date', { ascending: true })

        if (error) {
          throw error
        }

        // If no data, generate mock data
        if (!data || data.length === 0) {
          const mockData = generateMockData(15000)
          setChartData(mockData)
        } else {
          setChartData(data)
        }
      } catch (err) {
        console.error('Error fetching price history:', err)
        // Fallback to mock data on error
        const mockData = generateMockData(12000)
        setChartData(mockData)
      } finally {
        setIsLoading(false)
      }
    }

    if (commodityId) {
      fetchPriceHistory()
    }
  }, [commodityId])

  if (isLoading) {
    return (
      <div className="w-full h-64 bg-gray-50 rounded-lg animate-pulse flex items-center justify-center">
        <p className="text-gray-400">Đang tải biểu đồ...</p>
      </div>
    )
  }

  return (
    <div className="w-full h-64 bg-white rounded-lg p-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
          <XAxis
            dataKey="recorded_date"
            stroke="#9ca3af"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke="#9ca3af"
            style={{ fontSize: '12px' }}
            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
            formatter={(value) => [
              new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND',
                minimumFractionDigits: 0,
              }).format(value as number),
              'Giá',
            ]}
            labelFormatter={(label) => `Ngày: ${label}`}
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#059669"
            strokeWidth={3}
            dot={{ fill: '#059669', r: 4 }}
            activeDot={{ r: 6 }}
            isAnimationActive={true}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
