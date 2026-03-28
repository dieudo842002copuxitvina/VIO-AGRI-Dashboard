'use client'

import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface PriceData {
  date: string
  price: number
}

export default function PriceChart({ commodityId }: { commodityId: string }) {
  const [data, setData] = useState<PriceData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const generateChartData = () => {
      const mockData = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        mockData.push({
          date: date.toLocaleDateString('vi-VN', { month: '2-digit', day: '2-digit' }),
          price: Math.floor(Math.random() * 50000) + 30000,
        })
      }
      setData(mockData)
      setIsLoading(false)
    }

    generateChartData()
  }, [commodityId])

  if (isLoading) {
    return <div className="w-full h-40 bg-gray-100 rounded animate-pulse"></div>
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
        <XAxis dataKey="date" stroke="#999" style={{ fontSize: '12px' }} />
        <YAxis stroke="#999" style={{ fontSize: '12px' }} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#f5f5f5',
            border: '1px solid #ddd',
            borderRadius: '6px',
          }}
          formatter={(value) => `${value.toLocaleString('vi-VN')} VND`}
        />
        <Line
          type="monotone"
          dataKey="price"
          stroke="#16a34a"
          strokeWidth={2}
          dot={{ fill: '#16a34a', r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
