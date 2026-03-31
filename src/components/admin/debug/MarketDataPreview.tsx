'use client'

import { MarketData } from '@/components/admin/types'

interface Props {
  marketData: MarketData[]
}

export function MarketDataPreview({ marketData }: Props) {
  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h3 className="font-bold text-lg mb-2 text-gray-700">Live Market Data</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-200">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-gray-600">Commodity</th>
              <th className="px-4 py-2 text-left font-semibold text-gray-600">Price</th>
              <th className="px-4 py-2 text-left font-semibold text-gray-600">Trend</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {marketData.map((item) => (
              <tr key={item.id} className="border-b">
                <td className="px-4 py-2">{item.commodity}</td>
                <td className="px-4 py-2">${item.price.toFixed(2)}</td>
                <td className="px-4 py-2">
                  <span className={`font-mono ${item.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                    {item.trend === 'up' ? '▲' : '▼'} {item.trend}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}