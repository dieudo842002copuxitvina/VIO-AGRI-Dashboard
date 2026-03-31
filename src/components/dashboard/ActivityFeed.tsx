'use client'

import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UserCheck, DollarSign, Handshake, Clock, TrendingUp } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale/vi'

interface Activity {
  id: string
  type: 'transaction' | 'match' | 'listing' | 'trust'
  title: string
  description: string
  timestamp: string
  status: 'success' | 'pending'
}

const mockActivities: Activity[] = [
  {
    id: '1',
    type: 'transaction',
    title: 'Giao dịch thành công',
    description: 'Bán 5 MT cà phê Robusta cho Công ty ABC',
    timestamp: '2024-04-10T10:30:00Z',
    status: 'success'
  },
  {
    id: '2',
    type: 'match',
    title: 'Khớp lệnh mới',
    description: 'Tìm thấy 3 người mua phù hợp cho tiêu đen',
    timestamp: '2024-04-10T09:45:00Z',
    status: 'success'
  },
  {
    id: '3',
    type: 'listing',
    title: 'Tin đăng mới',
    description: 'Công ty XYZ đăng bán 10 MT gạo ST25',
    timestamp: '2024-04-10T08:20:00Z',
    status: 'success'
  },
  {
    id: '4',
    type: 'trust',
    title: 'Xác minh nhà cung cấp',
    description: 'Công ty ABC đã được xác minh độ tin cậy',
    timestamp: '2024-04-10T07:15:00Z',
    status: 'success'
  },
]

function getActivityIcon(type: Activity['type']) {
  switch (type) {
    case 'transaction': return <DollarSign className="h-5 w-5 text-emerald-600" />
    case 'match': return <TrendingUp className="h-5 w-5 text-blue-600" />
    case 'listing': return <Handshake className="h-5 w-5 text-orange-600" />
    case 'trust': return <UserCheck className="h-5 w-5 text-purple-600" />
  }
}

export default function ActivityFeed() {
  return (
    <Card className="rounded-3xl border border-zinc-200 shadow-xl h-[500px] flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
            <Clock className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold text-zinc-900 tracking-tight">Hoạt động gần đây</CardTitle>
            <p className="text-sm text-zinc-600 mt-1">Lịch sử giao dịch và sự kiện hệ thống</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto pb-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-300 scrollbar-track-zinc-100">
        {mockActivities.map((activity) => (
          <div key={activity.id} className="group flex items-start gap-4 p-4 rounded-2xl hover:bg-zinc-50/50 transition-all cursor-pointer border border-zinc-100 hover:border-zinc-200">
            <div className="flex-shrink-0 p-2 mt-0.5 rounded-xl bg-gradient-to-br from-zinc-100 to-zinc-200 group-hover:from-emerald-100">
              {getActivityIcon(activity.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-zinc-900 text-base truncate">
                  {activity.title}
                </h4>
                <span className={cn(
                  'px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide',
                  activity.status === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-orange-800'
                )}>
                  {activity.status === 'success' ? 'Hoàn thành' : 'Đang xử lý'}
                </span>
              </div>
              <p className="text-sm text-zinc-600 leading-relaxed mb-2">
                {activity.description}
              </p>
              <p className="text-xs text-zinc-500 font-mono">
                {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true, locale: vi })}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

