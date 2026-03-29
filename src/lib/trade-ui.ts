import type { Insight } from '@/modules/decision/decision.contract'
import type { Recommendation as DecisionRecommendation } from '@/modules/decision/decision.types'

export type InsightTone = 'opportunity' | 'risk' | 'info'
export type TradeAction = 'BUY' | 'SELL' | 'HOLD'
export type RecommendationPriority = 'low' | 'medium' | 'high' | 'critical'

export interface InsightCardViewModel {
  id: string
  title: string
  type: InsightTone
  confidence: number
  timestamp: string
  commodity: string
  nextStep: string
}

export interface RecommendationCardViewModel {
  id: string
  title: string
  action: TradeAction
  commodity: string
  reason: string
  confidence: number
  priority: RecommendationPriority
}

export interface TradeActionViewModel {
  headline: string
  commodity: string
  reason: string
  confidence: number
}

export interface CrossSellProductViewModel {
  id: string
  name: string
  description: string
  categoryLabel: string
  priceLabel: string
  href: string
}

const KNOWN_COMMODITIES = ['coffee', 'pepper', 'rice', 'corn', 'cocoa', 'vegetables', 'shrimp']

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' ? (value as Record<string, unknown>) : null
}

function toSafeText(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback
}

function toSafeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
}

function toSafeConfidence(value: unknown): number {
  const rawNumber =
    typeof value === 'number' && Number.isFinite(value)
      ? value
      : typeof value === 'string'
        ? Number(value)
        : 0

  if (!Number.isFinite(rawNumber)) {
    return 0
  }

  if (rawNumber > 1) {
    return Math.max(0, Math.min(1, rawNumber / 100))
  }

  return Math.max(0, Math.min(1, rawNumber))
}

function toSafePriceLabel(value: unknown): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 'Contact sales'
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

function capitalize(value: string): string {
  if (!value) {
    return value
  }

  return value.charAt(0).toUpperCase() + value.slice(1)
}

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function extractCommodity(...values: unknown[]): string {
  const haystack = values
    .filter((value): value is string => typeof value === 'string')
    .join(' ')
    .toLowerCase()

  const found = KNOWN_COMMODITIES.find((commodity) => haystack.includes(commodity))

  return found ? capitalize(found) : 'Market'
}

function toInsightTone(value: unknown): InsightTone {
  const safeValue = toSafeText(value, 'info').toLowerCase()

  if (safeValue.includes('risk')) {
    return 'risk'
  }

  if (safeValue.includes('opportunity')) {
    return 'opportunity'
  }

  return 'info'
}

function toTradeAction(value: unknown): TradeAction {
  const safeValue = toSafeText(value, 'hold').toLowerCase()

  if (safeValue.includes('sell')) {
    return 'SELL'
  }

  if (safeValue.includes('buy')) {
    return 'BUY'
  }

  return 'HOLD'
}

function toPriority(value: unknown): RecommendationPriority {
  const safeValue = toSafeText(value, 'medium').toLowerCase()

  if (safeValue === 'critical' || safeValue === 'high' || safeValue === 'low') {
    return safeValue
  }

  return 'medium'
}

function getInsightNextStep(type: InsightTone): string {
  switch (type) {
    case 'opportunity':
      return 'Buyers are active. Move fast and prepare inventory for sale.'
    case 'risk':
      return 'Protect your margin with a faster pricing and listing decision.'
    default:
      return 'Review the signal, then decide whether to list or contact buyers.'
  }
}

export function formatConfidence(confidence: number): string {
  return `${Math.round(toSafeConfidence(confidence) * 100)}%`
}

export function normalizeInsightCard(raw: Insight | null | undefined): InsightCardViewModel {
  const record = asRecord(raw)
  const title = toSafeText(record?.title, 'No title')
  const type = toInsightTone(record?.type)
  const confidence = toSafeConfidence(record?.confidence)
  const timestamp = toSafeText(record?.timestamp, new Date().toISOString())
  const commodity = extractCommodity(title, record?.id, record?.type)

  return {
    id: toSafeText(record?.id, `insight-${toSlug(title) || 'untitled'}`),
    title,
    type,
    confidence,
    timestamp,
    commodity,
    nextStep: getInsightNextStep(type),
  }
}

export function normalizeDecisionRecommendation(
  raw: DecisionRecommendation | null | undefined
): RecommendationCardViewModel {
  const record = asRecord(raw)
  const reasoning = toSafeStringArray(record?.reasoning)
  const title = toSafeText(record?.title, 'Market recommendation')
  const reason =
    reasoning[0] ||
    toSafeText(record?.description, '') ||
    toSafeText(record?.expectedImpact, 'No market reason available')
  const commodity = extractCommodity(
    title,
    toSafeText(record?.description, ''),
    reasoning.join(' '),
    toSafeText(record?.id, '')
  )
  const action = toTradeAction(record?.suggestedAction ?? record?.title)

  return {
    id: toSafeText(record?.id, `recommendation-${toSlug(title) || 'untitled'}`),
    title,
    action,
    commodity,
    reason,
    confidence: toSafeConfidence(record?.confidence),
    priority: toPriority(record?.priority),
  }
}

export function buildTradeActionViewModel(
  insight: Insight | null | undefined,
  recommendation: DecisionRecommendation | null | undefined
): TradeActionViewModel {
  const safeInsight = insight ? normalizeInsightCard(insight) : null
  const safeRecommendation = recommendation ? normalizeDecisionRecommendation(recommendation) : null
  const commodity =
    safeRecommendation && safeRecommendation.commodity !== 'Market'
      ? safeRecommendation.commodity
      : safeInsight?.commodity || 'Market'
  const headline =
    safeInsight?.title ||
    safeRecommendation?.title ||
    'Turn today\'s market signal into your next trade action'
  const reason =
    safeRecommendation?.reason ||
    safeInsight?.nextStep ||
    'Move from analysis to execution while the opportunity is still open.'

  return {
    headline,
    commodity,
    reason,
    confidence: Math.max(safeInsight?.confidence || 0, safeRecommendation?.confidence || 0),
  }
}

export function normalizeCrossSellProduct(raw: unknown): CrossSellProductViewModel | null {
  const record = asRecord(raw)

  if (toSafeText(record?.type, '') !== 'product') {
    return null
  }

  const product = asRecord(record?.product)
  const category = toSafeText(product?.category, 'farm_input')
  const categoryLabel = category.replace(/_/g, ' ')
  const name = toSafeText(product?.name, 'Farm input recommendation')

  return {
    id: toSafeText(record?.id, `product-${toSlug(name) || 'item'}`),
    name,
    description:
      toSafeText(record?.description, '') ||
      toSafeText(product?.description, 'Support the next trade with a practical farm input.'),
    categoryLabel: capitalize(categoryLabel),
    priceLabel: toSafePriceLabel(product?.price),
    href: `/shop?category=${encodeURIComponent(category)}`,
  }
}

export const FALLBACK_CROSS_SELL_PRODUCTS: CrossSellProductViewModel[] = [
  {
    id: 'fallback-fertilizer',
    name: 'Yield Booster Fertilizer',
    description: 'Improve crop quality before you bring new supply to market.',
    categoryLabel: 'Fertilizer',
    priceLabel: 'From $48',
    href: '/shop?category=fertilizer',
  },
  {
    id: 'fallback-iot',
    name: 'Field Moisture Sensor',
    description: 'Track field conditions with IoT data before you commit inventory.',
    categoryLabel: 'IoT Device',
    priceLabel: 'From $120',
    href: '/shop?category=iot_sensor',
  },
  {
    id: 'fallback-irrigation',
    name: 'Smart Irrigation Kit',
    description: 'Reduce water waste and protect margin during volatile pricing cycles.',
    categoryLabel: 'Irrigation System',
    priceLabel: 'From $399',
    href: '/shop?category=irrigation_system',
  },
]


