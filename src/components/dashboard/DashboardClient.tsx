'use client'

import AISignalHero from './AISignalHero'
import MarketGrid from './MarketGrid'
import B2BListingsTable from './B2BListingsTable'
import ActivityFeed from './ActivityFeed'
import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardClient() {
  return (
    <div className="space-y-12">
      {/* Hero AI Signal */}
      <AISignalHero />
      
      {/* Row 1: Market Data */}
      <section>
        <MarketGrid />
      </section>

      {/* Row 2: B2B Listings */}
      <section aria-label="Tin đăng B2B">
        <B2BListingsTable />
      </section>

      {/* Row 3: Activity Feed */}
      <section aria-label="Hoạt động gần đây">
        <ActivityFeed />
      </section>
    </div>
  )
}

