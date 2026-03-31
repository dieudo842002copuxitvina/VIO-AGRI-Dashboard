'use client'

import { useDecision } from '@/hooks/useDecision'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, TrendingUp, Award, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Insight {
  title: string
  type?: 'Opportunity' | 'Risk'
  confidence: number
  reason: string
}

const mockInsight: Insight = {
  title: 'Giá cà phê đang tăng mạnh',
  type: 'Opportunity',
  confidence: 0.87,
  reason: 'Dữ liệu thị trường cho thấy nhu cầu tăng 15% từ EU và giá xuất khẩu tăng liên tục 3 tuần. Khuyến nghị khóa giá ngay.'
}

export default function AISignalHero() {
  const { insights, loading } = useDecision()

  const insight = insights?.[0] || mockInsight
  const isOpportunity = insight.type === 'Opportunity' || insight.confidence > 0.7

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-12 lg:px-8">
        <Card className="rounded-3xl border-0 bg-gradient-to-br from-emerald-50/80 to-green-50/80 backdrop-blur-xl shadow-2xl border-emerald-200/50">
          <CardContent className="pt-12 pb-16">
            <div className="flex items-center justify-center space-x-3 text-emerald-700">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
              <span className="text-lg font-semibold">Đang phân tích tín hiệu AI...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12 lg:px-8">
      <Card className={cn(
        'rounded-3xl border-0 shadow-2xl backdrop-blur-xl',
        isOpportunity 
          ? 'bg-gradient-to-br from-emerald-50/90 to-green-50/90 border-emerald-200/50'
          : 'bg-gradient-to-br from-orange-50/90 to-red-50/90 border-orange-200/50'
      )}>
        <CardHeader className="pb-4">
          <div className="inline-flex items-center gap-2">
            <div className={cn(
              'p-2 rounded-2xl shadow-lg',
              isOpportunity ? 'bg-emerald-500/20 border-emerald-500/30' : 'bg-orange-500/20 border-orange-500/30'
            )}>
              {isOpportunity ? <TrendingUp className="h-6 w-6 text-emerald-600" /> : <AlertCircle className="h-6 w-6 text-orange-600" />}
            </div>
            <div>
              <Badge variant={isOpportunity ? 'default' : 'destructive'} className="font-semibold uppercase tracking-wide text-xs">
                {insight.type || (isOpportunity ? 'Cơ hội' : 'Rủi ro')}
              </Badge>
              <div className="w-24 bg-gradient-to-r from-zinc-200 to-zinc-300 h-1 mt-2 rounded-full overflow-hidden">
                <div className={cn(
                  'h-full rounded-full transition-all duration-1000',
                  isOpportunity ? 'bg-gradient-to-r from-emerald-500 to-green-600' : 'bg-gradient-to-r from-orange-500 to-red-600'
                )} style={{ width: `${Math.round(insight.confidence * 100)}%` }} />
              </div>
              <p className="text-2xs text-zinc-500 mt-1 font-mono">
                Độ tin cậy {Math.round(insight.confidence * 100)}%
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-2">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black leading-tight bg-gradient-to-r from-zinc-900 to-zinc-700 bg-clip-text text-transparent">
            {insight.title}
          </h1>
          <p className="text-xl leading-relaxed text-zinc-700 max-w-3xl">
            {insight.reason}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-zinc-200">
            <Button asChild size="lg" className="flex-1 font-semibold shadow-xl hover:shadow-2xl h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-lg">
              <Link href="/b2b/post">
                Thực hiện ngay
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button variant="outline" asChild size="lg" className="flex-1 font-semibold h-14 rounded-2xl border-2 border-zinc-300 hover:border-zinc-400 hover:bg-zinc-50">
              <Link href="/insights">
                Chi tiết tín hiệu
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

