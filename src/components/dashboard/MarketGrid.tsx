'use client'

import PriceChart from '@/components/PriceChart'
import LiveOrderFlow from './LiveOrderFlow'
import { Card } from '@/components/ui/card'

export default function MarketGrid() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <PriceChart />
      <LiveOrderFlow />
    </div>
  )
}

