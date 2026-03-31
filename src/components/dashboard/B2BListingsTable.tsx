'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Package, MapPin, DollarSign, Clock, TrendingUp } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

interface Listing {
  id: string
  commodity: string
  quantity: string
  price: string
  location: string
  status: 'active' | 'pending' | 'closed'
  matches: number
  created_at: string
}

const mockListings: Listing[] = [
  {
    id: '1',
    commodity: 'Cà phê Robusta',
    quantity: '5 MT',
    price: '$3,200/MT',
    location: 'Đắk Lắk',
    status: 'active',
    matches: 12,
    created_at: '2 giờ trước'
  },
  {
    id: '2',
    commodity: 'Tiêu đen',
    quantity: '2,000 KG',
    price: '¥95,000/KG',
    location: 'Bà Rịa - Vũng Tàu',
    status: 'active',
    matches: 8,
    created_at: '5 giờ trước'
  },
  {
    id: '3',
    commodity: 'Gạo ST25',
    quantity: '20 MT',
    price: '$14,500/MT',
    location: 'Sóc Trăng',
    status: 'pending',
    matches: 3,
    created_at: '1 ngày trước'
  },
]

async function fetchListings(): Promise<Listing[]> {
  try {
    const response = await fetch('/api/listings?limit=6&status=active', { 
      cache: 'no-store' 
    })
    if (!response.ok) throw new Error('API error')
    const json = await response.json()
    // Normalize listings (similar to existing safe patterns)
    return Array.isArray(json.listings) ? json.listings : mockListings
  } catch {
    return mockListings
  }
}

export default function B2BListingsTable() {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchListings().then((data) => {
      setListings(data)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <Card className="rounded-3xl border border-zinc-200 shadow-xl">
        <CardHeader>
          <Skeleton className="h-8 w-64 rounded-xl" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 border-b border-zinc-200 last:border-b-0">
                <Skeleton className="h-12 w-32 rounded-lg" />
                <Skeleton className="h-10 w-24 rounded-xl" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="rounded-3xl border border-zinc-200 shadow-xl hover:shadow-2xl transition-all">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
            <Package className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold text-zinc-900 tracking-tight">Tin đăng B2B hoạt động</CardTitle>
            <p className="text-sm text-zinc-600 mt-1">Cơ hội khớp lệnh từ người mua đã xác minh</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4">
          {listings.map((listing) => (
            <Link key={listing.id} href={`/b2b/post/${listing.id}`} className="group hover:bg-zinc-50/50 rounded-2xl p-5 transition-all border border-zinc-100 hover:border-zinc-200 hover:shadow-md">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-lg text-zinc-900 group-hover:text-emerald-600 truncate">
                      {listing.commodity}
                    </h3>
                    <Badge variant={listing.status === 'active' ? 'default' : 'secondary'} className="uppercase">
                      {listing.status === 'active' ? 'Hoạt động' : 'Đang chờ'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-6 text-sm text-zinc-600 mb-2 flex-wrap">
                    <div className="flex items-center gap-1">
                      <Package className="h-4 w-4" />
                      <span>{listing.quantity}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      <span>{listing.price}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{listing.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{listing.created_at}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 text-right">
                  <div className="flex items-center gap-1 bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm font-bold">
                    <TrendingUp className="h-3.5 w-3.5" />
                    {listing.matches} phù hợp
                  </div>
                  <Button variant="ghost" size="sm" className="h-9 rounded-xl font-semibold group-hover:bg-emerald-500 group-hover:text-white">
                    Xem chi tiết →
                  </Button>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="pt-6 border-t border-zinc-200">
          <Link 
            href="/b2b" 
            className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-semibold text-sm transition-colors"
          >
            Xem toàn bộ tin đăng
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

