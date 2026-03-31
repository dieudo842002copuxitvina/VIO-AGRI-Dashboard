'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Clock, Package, Users } from 'lucide-react'
import PriceTicker from '@/components/market/PriceTicker'
import { cn } from '@/lib/utils'

interface Order {
  id: string
  side: 'buy' | 'sell'
  commodity: string
  qty: string
  price: string
  time: string
}

const mockOrders: Order[] = [
  { id: '1', side: 'sell', commodity: 'Cà phê Arabica', qty: '2.5 MT', price: '$3,250', time: '2 phút trước' },
  { id: '2', side: 'buy', commodity: 'Tiêu đen', qty: '500 KG', price: '¥98,500', time: '5 phút trước' },
  { id: '3', side: 'sell', commodity: 'Gạo ST25', qty: '10 MT', price: '$14,800', time: '8 phút trước' },
  { id: '4', side: 'buy', commodity: 'Hạt điều', qty: '1.2 MT', price: '$7,200', time: '12 phút trước' },
  { id: '5', side: 'sell', commodity: 'Cao su RSS3', qty: '5 MT', price: '$1,850', time: '15 phút trước' },
]

export default function LiveOrderFlow() {
  const [orders, setOrders] = useState<Order[]>(mockOrders)
  const [autoRotate, setAutoRotate] = useState(true)

  useEffect(() => {
    if (!autoRotate) return

    const interval = setInterval(() => {
      // Mock new order rotation
      const newOrders = [...mockOrders].sort(() => Math.random() - 0.5)
      setOrders(newOrders.slice(0, 5))
    }, 8000)

    return () => clearInterval(interval)
  }, [autoRotate])

  return (
    <Card className="rounded-3xl border border-zinc-200 shadow-xl hover:shadow-2xl transition-all duration-500 bg-gradient-to-b from-zinc-50/50 to-white backdrop-blur-sm h-fit">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
            <Users className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold text-zinc-900 tracking-tight">Luồng đơn hàng trực tiếp</CardTitle>
            <p className="text-sm text-zinc-600 mt-1">Theo dõi hoạt động giao dịch theo thời gian thực</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Price Ticker */}
        <div className="relative">
          <PriceTicker />
          <button 
            onClick={() => setAutoRotate(!autoRotate)}
            className="absolute top-2 right-2 p-1.5 bg-white/80 rounded-xl shadow-sm border border-zinc-200 hover:bg-white text-zinc-500 hover:text-zinc-700 transition-all"
          >
            {autoRotate ? '⏸️' : '▶️'}
          </button>
        </div>

        {/* Recent Orders */}
        <div className="divide-y divide-zinc-200 space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="pt-4 pb-3 first:pt-0 flex items-center justify-between group hover:bg-zinc-50/50 rounded-xl p-3 transition-all cursor-pointer">
              <div className="flex items-center gap-3 flex-1">
                <div className={cn(
                  'p-2 rounded-xl shadow-md text-white font-bold text-sm',
                  order.side === 'buy' 
                    ? 'bg-emerald-500 shadow-emerald-500/25' 
                    : 'bg-orange-500 shadow-orange-500/25'
                )}>
                  {order.side === 'buy' ? 'MUA' : 'BÁN'}
                </div>
                <div>
                  <p className="font-semibold text-zinc-900">{order.commodity}</p>
                  <p className="text-sm text-zinc-600">{order.qty}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-right">
                <p className="font-mono font-bold text-lg text-zinc-900">{order.price}</p>
                <Clock className="h-4 w-4 text-zinc-500" />
                <p className="text-xs text-zinc-500">{order.time}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-zinc-200">
          <a href="/b2b" className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-semibold text-sm group">
            Xem tất cả giao dịch
            <svg className="group-hover:translate-x-1 transition-transform h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </div>
      </CardContent>
    </Card>
  )
}

