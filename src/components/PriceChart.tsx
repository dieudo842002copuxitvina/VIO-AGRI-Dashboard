'use client'

import { useEffect, useState } from 'react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

interface MarketCard {
  commodity: string
  price: number
  unit: string
  trend: 'up' | 'down' | 'stable'
  change_percent: number
}

interface ClimateCard {
  commodity: string
  region: string
  risk_level: 'low' | 'medium' | 'high'
  action_hint: string
}

interface MarketHistoryPoint {
  period: string
  [commodityKey: string]: string | number
}

const fallbackHistory: MarketHistoryPoint[] = [
  { period: 'Oct', coffee: 3100, pepper: 82000, rice: 13400 },
  { period: 'Nov', coffee: 3150, pepper: 85000, rice: 13600 },
  { period: 'Dec', coffee: 3080, pepper: 89000, rice: 13800 },
  { period: 'Jan', coffee: 3200, pepper: 91000, rice: 14100 },
  { period: 'Feb', coffee: 3250, pepper: 95000, rice: 14500 },
  { period: 'Mar', coffee: 3300, pepper: 98000, rice: 14800 },
]

function formatAxisValue(value: number) {
  if (value >= 10000) {
    return `${Math.round(value / 1000)}k`
  }

  return value.toString()
}

function normalizeMarketCard(raw: unknown): MarketCard | null {
  if (!raw || typeof raw !== 'object') {
    return null
  }

  const record = raw as Record<string, unknown>
  const commodity = typeof record.commodity === 'string' ? record.commodity.trim() : ''

  if (!commodity) {
    return null
  }

  const price = typeof record.price === 'number' ? record.price : Number(record.price)
  const changePercent =
    typeof record.change_percent === 'number' ? record.change_percent : Number(record.change_percent)
  const trend =
    record.trend === 'up' || record.trend === 'down' || record.trend === 'stable'
      ? record.trend
      : 'stable'

  return {
    commodity,
    price: Number.isFinite(price) ? price : 0,
    unit: typeof record.unit === 'string' && record.unit.trim().length > 0 ? record.unit : 'unit',
    trend,
    change_percent: Number.isFinite(changePercent) ? changePercent : 0,
  }
}

function normalizeClimateCard(raw: unknown): ClimateCard | null {
  if (!raw || typeof raw !== 'object') {
    return null
  }

  const record = raw as Record<string, unknown>
  const commodity = typeof record.commodity === 'string' ? record.commodity.trim() : ''

  if (!commodity) {
    return null
  }

  return {
    commodity,
    region: typeof record.region === 'string' ? record.region : 'Unknown region',
    risk_level:
      record.risk_level === 'low' || record.risk_level === 'high' ? record.risk_level : 'medium',
    action_hint:
      typeof record.action_hint === 'string' && record.action_hint.trim().length > 0
        ? record.action_hint
        : 'Keep monitoring conditions before locking in logistics.',
  }
}

function normalizeHistory(raw: unknown): MarketHistoryPoint[] {
  if (!Array.isArray(raw)) {
    return fallbackHistory
  }

  const normalized: MarketHistoryPoint[] = []

  for (const item of raw) {
    if (!item || typeof item !== 'object') {
      continue
    }

    const record = item as Record<string, unknown>
    const period = typeof record.period === 'string' ? record.period : ''

    if (!period) {
      continue
    }

    normalized.push({
      period,
      coffee: typeof record.coffee === 'number' ? record.coffee : Number(record.coffee) || 0,
      pepper: typeof record.pepper === 'number' ? record.pepper : Number(record.pepper) || 0,
      rice: typeof record.rice === 'number' ? record.rice : Number(record.rice) || 0,
    })
  }

  return normalized.length > 0 ? normalized : fallbackHistory
}

function ChartShell() {
  return (
    <div className="mt-8 h-[320px] w-full rounded-3xl border border-dashed border-stone-200 bg-stone-50">
      <div className="flex h-full items-center justify-center px-6 text-center text-sm text-stone-500">
        Preparing chart view...
      </div>
    </div>
  )
}

export default function PriceChart() {
  const [timeframe, setTimeframe] = useState('6M')
  const [mounted, setMounted] = useState(false)
  const [market, setMarket] = useState<MarketCard[]>([])
  const [history, setHistory] = useState<MarketHistoryPoint[]>(fallbackHistory)
  const [climate, setClimate] = useState<ClimateCard | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    let isMounted = true

    async function fetchMarketIntelligence() {
      try {
        const [marketResponse, climateResponse] = await Promise.all([
          fetch('/api/market-data', { cache: 'no-store' }),
          fetch('/api/climate', { cache: 'no-store' }),
        ])

        const marketJson = marketResponse.ok ? ((await marketResponse.json()) as { market?: unknown[]; history?: unknown[] }) : {}
        const climateJson = climateResponse.ok ? ((await climateResponse.json()) as { climate?: unknown[] }) : {}

        if (!isMounted) {
          return
        }

        const safeMarket = Array.isArray(marketJson?.market)
          ? marketJson.market.map((item) => normalizeMarketCard(item)).filter((item): item is MarketCard => item !== null)
          : []
        const safeClimate = Array.isArray(climateJson?.climate)
          ? climateJson.climate.map((item) => normalizeClimateCard(item)).filter((item): item is ClimateCard => item !== null)
          : []

        setMarket(safeMarket)
        setHistory(normalizeHistory(marketJson?.history))
        setClimate(safeClimate[0] || null)
      } catch (fetchError) {
        if (isMounted) {
          setError(fetchError instanceof Error ? fetchError.message : 'Unable to load market intelligence.')
          setMarket([])
          setHistory(fallbackHistory)
          setClimate(null)
        }
      }
    }

    void fetchMarketIntelligence()

    return () => {
      isMounted = false
    }
  }, [])

  const slicedHistory =
    timeframe === '1M'
      ? history.slice(-2)
      : timeframe === '3M'
        ? history.slice(-4)
        : timeframe === '1Y'
          ? history
          : history

  const coffee = market.find((item) => item.commodity.toLowerCase().includes('coffee')) || null
  const pepper = market.find((item) => item.commodity.toLowerCase().includes('pepper')) || null
  const fallbackTop = market[0] || null

  return (
    <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm shadow-stone-950/5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500">Market Data</p>
          <h2 className="mt-3 text-3xl font-semibold text-stone-950">Price momentum, climate pressure, and timing signals</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
            This intelligence layer feeds the actions below so sellers can price, match, and negotiate faster.
          </p>
        </div>

        <div className="inline-flex rounded-full border border-stone-200 bg-stone-50 p-1">
          {['1M', '3M', '6M', '1Y'].map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setTimeframe(option)}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                timeframe === option
                  ? 'bg-white text-emerald-700 shadow-sm shadow-stone-950/5'
                  : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {error}
        </div>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">{coffee?.commodity || 'Coffee'}</p>
          <p className="mt-3 text-2xl font-semibold text-stone-950">{formatAxisValue(Math.round(coffee?.price || fallbackTop?.price || 3300))} {coffee?.unit || fallbackTop?.unit || 'USD/mt'}</p>
          <p className="mt-1 text-sm text-emerald-700">Trend {coffee?.trend || fallbackTop?.trend || 'stable'} | {Math.round(coffee?.change_percent || fallbackTop?.change_percent || 0)}%</p>
        </div>
        <div className="rounded-3xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">{pepper?.commodity || 'Pepper'}</p>
          <p className="mt-3 text-2xl font-semibold text-stone-950">{formatAxisValue(Math.round(pepper?.price || 98000))} {pepper?.unit || 'VND/kg'}</p>
          <p className="mt-1 text-sm text-blue-700">Trend {pepper?.trend || 'stable'} | {Math.round(pepper?.change_percent || 0)}%</p>
        </div>
        <div className="rounded-3xl border border-stone-200 bg-stone-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">Climate</p>
          <p className="mt-3 text-2xl font-semibold capitalize text-stone-950">{climate?.risk_level || 'medium'} risk</p>
          <p className="mt-1 text-sm text-stone-600">{climate?.action_hint || 'Pair market momentum with verified buyers and short negotiation loops.'}</p>
        </div>
      </div>

      {!mounted ? (
        <ChartShell />
      ) : (
        <div className="mt-8 h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%" minHeight={320}>
            <LineChart data={slicedHistory} margin={{ top: 5, right: 12, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E7E5E4" />
              <XAxis
                dataKey="period"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#78716C' }}
                dy={10}
              />
              <YAxis
                yAxisId="left"
                axisLine={false}
                tickLine={false}
                tickFormatter={formatAxisValue}
                tick={{ fontSize: 12, fill: '#78716C' }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                axisLine={false}
                tickLine={false}
                tickFormatter={formatAxisValue}
                tick={{ fontSize: 12, fill: '#78716C' }}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '18px',
                  border: '1px solid #E7E5E4',
                  boxShadow: '0 12px 30px rgba(28, 25, 23, 0.08)',
                }}
                formatter={(value) => new Intl.NumberFormat('en-US').format(Number(value ?? 0))}
              />
              <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '14px' }} />
              <Line
                yAxisId="left"
                type="monotone"
                name="Coffee"
                dataKey="coffee"
                stroke="#059669"
                strokeWidth={3}
                dot={{ r: 4, fill: '#059669', strokeWidth: 2, stroke: '#FFFFFF' }}
                activeDot={{ r: 6 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                name="Pepper"
                dataKey="pepper"
                stroke="#2563EB"
                strokeWidth={3}
                dot={{ r: 4, fill: '#2563EB', strokeWidth: 2, stroke: '#FFFFFF' }}
                activeDot={{ r: 6 }}
              />
              <Line
                yAxisId="left"
                type="monotone"
                name="Rice"
                dataKey="rice"
                stroke="#A16207"
                strokeWidth={3}
                dot={{ r: 4, fill: '#A16207', strokeWidth: 2, stroke: '#FFFFFF' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

