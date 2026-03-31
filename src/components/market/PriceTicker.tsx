'use client'

'use client'

import { useEffect, useState, useRef } from 'react'
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface TickerItem {
  commodity: string
  price: number
  change: number
  changePercent: number
  trend: 'up' | 'down'
}

const mockTickerData: TickerItem[] = [
  { commodity: 'Coffee Arabica', price: 3.25, change: 0.08, changePercent: 2.53, trend: 'up' },
  { commodity: 'Pepper Black', price: 98.5, change: -1.2, changePercent: -1.2, trend: 'down' },
  { commodity: 'Rice Jasmine', price: 14.8, change: 0.3, changePercent: 2.07, trend: 'up' },
  { commodity: 'Cashew Nut', price: 7.2, change: 0.15, changePercent: 2.13, trend: 'up' },
  { commodity: 'Rubber RSS3', price: 1.85, change: -0.05, changePercent: -2.63, trend: 'down' },
]

export default function PriceTicker() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState<'left' | 'right'>('left')
  const containerRef = useRef<HTMLDivElement>(null)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isPaused) {
        const nextIndex = (currentIndex + 1) % mockTickerData.length
        setDirection(nextIndex > currentIndex ? 'left' : 'right')
        setCurrentIndex(nextIndex)
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [currentIndex, isPaused])

  const currentItem = mockTickerData[currentIndex]

  return (
    <Card className="border-0 bg-gradient-to-r from-slate-900/90 to-slate-800/90 backdrop-blur-xl shadow-2xl">
      <CardContent className="p-4">
        <div 
          className="flex items-center justify-between cursor-pointer group hover:brightness-105 transition-all duration-300"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Price Display */}
          <div className="flex items-baseline gap-3">
            <div className="text-2xl font-bold text-slate-100 drop-shadow-lg">
              ${currentItem.price}
            </div>
            <div className="text-lg font-mono text-slate-400">
              /mt
            </div>
            <div className={cn(
              'flex items-center gap-1 text-sm font-bold px-3 py-1 rounded-full',
              currentItem.trend === 'up' 
                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            )}>
              {currentItem.trend === 'up' ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {currentItem.changePercent.toFixed(1)}%
            </div>
          </div>

          {/* Commodity Name */}
          <div className="text-xl font-semibold bg-gradient-to-r from-slate-200 to-slate-300 bg-clip-text text-transparent drop-shadow-lg">
            {currentItem.commodity}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="p-1.5 rounded-xl bg-slate-700/50 hover:bg-slate-600 text-slate-300 transition-all">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="p-1.5 rounded-xl bg-slate-700/50 hover:bg-slate-600 text-slate-300 transition-all">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
