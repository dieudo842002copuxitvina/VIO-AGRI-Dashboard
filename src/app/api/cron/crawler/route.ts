export const dynamic = 'force-dynamic'

import { getSupabaseAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

type InsightSentiment = 'positive' | 'negative' | 'warning'

type ScrapedArticle = {
  rawText: string
  sourceUrl: string
}

type AIInsightResult = {
  commodity: string
  sentiment: InsightSentiment
  title: string
  cause: string
  impact: string
  source_url: string
}

const allowedSentiments: InsightSentiment[] = ['positive', 'negative', 'warning']

function getRequiredEnv(name: 'CRON_SECRET'): string {
  const value = process.env[name]?.trim()

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

function isAuthorized(request: NextRequest, secret: string): boolean {
  const authHeader = request.headers.get('authorization')
  const querySecret = request.nextUrl.searchParams.get('secret')?.trim()

  if (authHeader === `Bearer ${secret}`) {
    return true
  }

  if (querySecret && querySecret === secret) {
    return true
  }

  return false
}

async function scrapeAgricultureNews(): Promise<ScrapedArticle> {
  return {
    rawText:
      'Drought in Brazil affects coffee yields in key Robusta growing regions. Exporters expect tighter supply, while traders estimate global prices could rise by around 5 percent next week if dry weather persists.',
    sourceUrl: 'https://example.com/agri-news/brazil-drought-coffee-yields',
  }
}

async function processWithAI(rawText: string, sourceUrl: string): Promise<AIInsightResult> {
  const normalized = rawText.toLowerCase()

  if (normalized.includes('coffee') || normalized.includes('robusta')) {
    return {
      commodity: 'coffee',
      sentiment: 'warning',
      title: 'Hạn hán tại Brazil có thể siết nguồn cung cà phê Robusta',
      cause: 'Hạn hán tại Brazil làm giảm sản lượng tại các vùng trồng cà phê trọng điểm.',
      impact: 'Nguồn cung suy giảm, giá cà phê Robusta được dự báo có thể tăng khoảng 5% trong ngắn hạn.',
      source_url: sourceUrl,
    }
  }

  return {
    commodity: 'general',
    sentiment: 'warning',
    title: 'AI phát hiện biến động mới từ thị trường nông sản quốc tế',
    cause: 'Nguồn tin thị trường cho thấy các yếu tố thời tiết và logistics đang gây biến động nguồn cung.',
    impact: 'Giá hàng hóa có thể dao động mạnh hơn trong các phiên giao dịch kế tiếp.',
    source_url: sourceUrl,
  }
}

function validateInsight(insight: AIInsightResult): AIInsightResult {
  const commodity = insight.commodity.trim()
  const title = insight.title.trim()
  const cause = insight.cause.trim()
  const impact = insight.impact.trim()
  const sourceUrl = insight.source_url.trim()

  if (!commodity || !title || !cause || !impact || !sourceUrl) {
    throw new Error('AI processing returned incomplete market insight data')
  }

  if (!allowedSentiments.includes(insight.sentiment)) {
    throw new Error('AI processing returned an invalid sentiment value')
  }

  return {
    commodity,
    sentiment: insight.sentiment,
    title,
    cause,
    impact,
    source_url: sourceUrl,
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const cronSecret = getRequiredEnv('CRON_SECRET')

    if (!isAuthorized(request, cronSecret)) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Unauthorized',
          message: 'A valid cron secret is required.',
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      )
    }

    const supabase = getSupabaseAdminClient()
    const scrapedArticle = await scrapeAgricultureNews()
    const aiInsight = validateInsight(await processWithAI(scrapedArticle.rawText, scrapedArticle.sourceUrl))

    const { data, error } = await supabase
      .from('market_insights')
      .insert([
        {
          commodity: aiInsight.commodity,
          sentiment: aiInsight.sentiment,
          title: aiInsight.title,
          cause: aiInsight.cause,
          impact: aiInsight.impact,
          source_url: aiInsight.source_url,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error('[Cron Crawler API] Failed to insert market insight', {
        error: error.message,
        code: error.code,
      })

      return NextResponse.json(
        {
          ok: false,
          error: 'Database insert failed',
          message: error.message,
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        ok: true,
        data,
      },
      { status: 200 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred'

    console.error('[Cron Crawler API] Unexpected failure', { error: message })

    return NextResponse.json(
      {
        ok: false,
        error: 'Internal server error',
        message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
