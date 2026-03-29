import { getSupabaseServerClient } from '@/lib/supabase/server'
import {
  asRecord,
  clamp,
  toIsoTimestamp,
  toSafeNumber,
  toSafeText,
} from '@/lib/safe-data'

export interface CommodityPrice {
  id: string
  name: string
  symbol: string
  unit: string
  price: number
  change24h: number
  changePercent24h: number
  demandLevel: 'low' | 'medium' | 'high'
  supplyLevel: 'low' | 'medium' | 'high'
  trendDirection: 'uptrend' | 'downtrend' | 'sideways'
  volatilityIndex: number
  timestamp: Date
  source: string
}

type IngestionSourceName = 'fao' | 'usda' | 'world_bank'
type IngestionTrigger = 'manual' | 'cron' | 'api'
type SourceFrequency = 'daily' | 'weekly' | 'monthly' | 'annual'

interface WorldBankSeriesConfig {
  indicator: string
  commodityId: string
  commodityName: string
  symbol: string
  defaultUnit: string
  currencyCode: string
  marketScope: string
  region: string
}

interface UsdaSeriesConfig {
  commodityDesc: string
  commodityId: string
  commodityName: string
  symbol: string
  marketScope: string
  region: string
}

interface FaoSeriesConfig {
  commodityId: string
  commodityName: string
  symbol: string
  marketScope: string
  region: string
}

interface SourceRecordCandidate {
  commodityId: string
  commodityName: string
  symbol: string
  region: string
  marketScope: string
  price: number
  unit: string
  currencyCode: string
  observedAt: string
  providerSeriesId: string
  sourceFrequency: SourceFrequency
  metadata: Record<string, unknown>
  rawPayload: Record<string, unknown>
}

interface NormalizedMarketRow {
  commodity_id: string
  commodity_name: string
  region: string
  current_price: number
  price_unit: string
  price_change_24h: number
  price_change_percentage_24h: number
  demand_level: 'low' | 'medium' | 'high'
  supply_level: 'low' | 'medium' | 'high'
  volatility_index: number
  trend_direction: 'uptrend' | 'downtrend' | 'sideways'
  timestamp: string
  observed_at: string
  ingested_at: string
  data_source: string
  source: string
  provider: IngestionSourceName
  provider_series_id: string
  market_scope: string
  currency_code: string
  source_frequency: SourceFrequency
  is_verified: boolean
  metadata: Record<string, unknown>
  raw_payload: Record<string, unknown>
}

interface SourceRunSummary {
  source: IngestionSourceName
  success: boolean
  fetched: number
  stored: number
  skipped: boolean
  durationMs: number
  error?: string
}

export interface IngestionSummary {
  success: boolean
  partial: boolean
  totalFetched: number
  totalStored: number
  runId: string | null
  sourceResults: SourceRunSummary[]
  timestamp: string
}

interface WorldBankResponseRow {
  indicator?: { id?: string; value?: string }
  country?: { id?: string; value?: string }
  countryiso3code?: string
  date?: string
  value?: number | null
  decimal?: number
}

interface UsdaResponse {
  data?: Record<string, string>[]
}

const REQUEST_TIMEOUT_MS = 20_000

const WORLD_BANK_SERIES: WorldBankSeriesConfig[] = [
  {
    indicator: 'COFFEE_ROBUS',
    commodityId: 'coffee_robusta',
    commodityName: 'Coffee Robusta',
    symbol: 'ROBUSTA',
    defaultUnit: 'World Bank index',
    currencyCode: 'USD',
    marketScope: 'global',
    region: 'Global',
  },
  {
    indicator: 'WHEAT_US_HRW',
    commodityId: 'wheat',
    commodityName: 'Wheat',
    symbol: 'WHEAT',
    defaultUnit: 'World Bank index',
    currencyCode: 'USD',
    marketScope: 'global',
    region: 'Global',
  },
]

const USDA_SERIES: UsdaSeriesConfig[] = [
  {
    commodityDesc: 'CORN',
    commodityId: 'corn',
    commodityName: 'Corn',
    symbol: 'CORN',
    marketScope: 'united_states',
    region: 'United States',
  },
  {
    commodityDesc: 'RICE',
    commodityId: 'rice',
    commodityName: 'Rice',
    symbol: 'RICE',
    marketScope: 'united_states',
    region: 'United States',
  },
  {
    commodityDesc: 'SOYBEANS',
    commodityId: 'soybeans',
    commodityName: 'Soybeans',
    symbol: 'SOYBEAN',
    marketScope: 'united_states',
    region: 'United States',
  },
  {
    commodityDesc: 'WHEAT',
    commodityId: 'wheat_usda',
    commodityName: 'Wheat',
    symbol: 'WHEAT',
    marketScope: 'united_states',
    region: 'United States',
  },
]

const FAO_SERIES: FaoSeriesConfig[] = [
  {
    commodityId: 'rice_fao',
    commodityName: 'Rice',
    symbol: 'RICE',
    marketScope: 'global',
    region: 'Global',
  },
  {
    commodityId: 'coffee_fao',
    commodityName: 'Coffee',
    symbol: 'COFFEE',
    marketScope: 'global',
    region: 'Global',
  },
  {
    commodityId: 'maize_fao',
    commodityName: 'Maize',
    symbol: 'MAIZE',
    marketScope: 'global',
    region: 'Global',
  },
]

function parseNumericValue(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const normalized = Number(value.replace(/,/g, '').trim())

    if (Number.isFinite(normalized)) {
      return normalized
    }
  }

  return null
}

function buildObservedAt(year: string, month?: string): string {
  const safeYear = toSafeText(year, '')
  const safeMonth = toSafeText(month, '').padStart(2, '0')

  if (/^\d{4}$/.test(safeYear) && /^\d{2}$/.test(safeMonth)) {
    return toIsoTimestamp(`${safeYear}-${safeMonth}-01T00:00:00.000Z`)
  }

  if (/^\d{4}$/.test(safeYear)) {
    return toIsoTimestamp(`${safeYear}-01-01T00:00:00.000Z`)
  }

  return new Date().toISOString()
}

function inferDemandLevel(changePercent: number): 'low' | 'medium' | 'high' {
  if (changePercent >= 2) {
    return 'high'
  }

  if (changePercent <= -2) {
    return 'low'
  }

  return 'medium'
}

function inferSupplyLevel(changePercent: number): 'low' | 'medium' | 'high' {
  if (changePercent >= 2) {
    return 'low'
  }

  if (changePercent <= -2) {
    return 'high'
  }

  return 'medium'
}

function inferTrend(changePercent: number): 'uptrend' | 'downtrend' | 'sideways' {
  if (changePercent >= 0.5) {
    return 'uptrend'
  }

  if (changePercent <= -0.5) {
    return 'downtrend'
  }

  return 'sideways'
}

function inferVolatility(changePercent: number): number {
  return clamp(Math.abs(changePercent) * 4, 0, 100)
}

function normalizeCandidatePair(
  source: IngestionSourceName,
  current: SourceRecordCandidate,
  previous: SourceRecordCandidate | null
): NormalizedMarketRow {
  const previousPrice = previous?.price ?? current.price
  const change24h = current.price - previousPrice
  const changePercent =
    previousPrice > 0 ? Number(((change24h / previousPrice) * 100).toFixed(4)) : 0
  const observedAt = toIsoTimestamp(current.observedAt)
  const ingestedAt = new Date().toISOString()

  return {
    commodity_id: current.commodityId,
    commodity_name: current.commodityName,
    region: current.region,
    current_price: Number(current.price.toFixed(4)),
    price_unit: current.unit,
    price_change_24h: Number(change24h.toFixed(4)),
    price_change_percentage_24h: changePercent,
    demand_level: inferDemandLevel(changePercent),
    supply_level: inferSupplyLevel(changePercent),
    volatility_index: inferVolatility(changePercent),
    trend_direction: inferTrend(changePercent),
    timestamp: observedAt,
    observed_at: observedAt,
    ingested_at: ingestedAt,
    data_source: source,
    source: source,
    provider: source,
    provider_series_id: current.providerSeriesId,
    market_scope: current.marketScope,
    currency_code: current.currencyCode,
    source_frequency: current.sourceFrequency,
    is_verified: true,
    metadata: {
      ...current.metadata,
      previous_observed_at: previous?.observedAt ?? null,
    },
    raw_payload: current.rawPayload,
  }
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init?.headers || {}),
      },
      signal: controller.signal,
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`)
    }

    return (await response.json()) as T
  } finally {
    clearTimeout(timeout)
  }
}
async function beginIngestionRun(trigger: IngestionTrigger): Promise<string | null> {
  try {
    const supabase = getSupabaseServerClient()
    const { data, error } = await supabase
      .from('market_data_ingestion_runs')
      .insert({
        trigger,
        status: 'running',
        started_at: new Date().toISOString(),
      })
      .select('id')
      .maybeSingle()

    if (error) {
      return null
    }

    return toSafeText(asRecord(data)?.id, '') || null
  } catch {
    return null
  }
}

async function finishIngestionRun(
  runId: string | null,
  payload: {
    status: 'success' | 'partial' | 'failed'
    sourceResults: SourceRunSummary[]
    fetched: number
    stored: number
    error?: string
  }
): Promise<void> {
  if (!runId) {
    return
  }

  try {
    const supabase = getSupabaseServerClient()
    await supabase
      .from('market_data_ingestion_runs')
      .update({
        status: payload.status,
        source_results: payload.sourceResults,
        records_fetched: payload.fetched,
        records_stored: payload.stored,
        error_message: payload.error || null,
        finished_at: new Date().toISOString(),
      })
      .eq('id', runId)
  } catch {
    return
  }
}

function normalizeWorldBankSeries(
  config: WorldBankSeriesConfig,
  payload: unknown
): SourceRecordCandidate[] {
  if (!Array.isArray(payload) || payload.length < 2 || !Array.isArray(payload[1])) {
    return []
  }

  const rows = payload[1] as WorldBankResponseRow[]
  const usableRows = rows
    .filter((row) => typeof row?.date === 'string' && typeof row?.value === 'number')
    .sort((left, right) => String(right.date).localeCompare(String(left.date)))
    .slice(0, 2)

  return usableRows.map((row) => ({
    commodityId: config.commodityId,
    commodityName: config.commodityName,
    symbol: config.symbol,
    region: config.region,
    marketScope: config.marketScope,
    price: Number(row.value || 0),
    unit: config.defaultUnit,
    currencyCode: config.currencyCode,
    observedAt: buildObservedAt(String(row.date || '')),
    providerSeriesId: config.indicator,
    sourceFrequency: 'monthly',
    metadata: {
      country: row.country?.value || 'World',
      country_code: row.countryiso3code || 'WLD',
      indicator: row.indicator?.id || config.indicator,
    },
    rawPayload: (asRecord(row) || {}) as Record<string, unknown>,
  }))
}

async function fetchFromWorldBank(): Promise<SourceRunSummary & { records: NormalizedMarketRow[] }> {
  const startedAt = Date.now()
  const rows: NormalizedMarketRow[] = []

  try {
    for (const config of WORLD_BANK_SERIES) {
      const url =
        `https://api.worldbank.org/v2/country/WLD/indicator/${config.indicator}` +
        '?format=json&per_page=12&mrnev=12'
      const payload = await fetchJson<unknown>(url)
      const candidates = normalizeWorldBankSeries(config, payload)

      if (candidates.length > 0) {
        rows.push(normalizeCandidatePair('world_bank', candidates[0], candidates[1] || null))
      }
    }

    return {
      source: 'world_bank',
      success: rows.length > 0,
      fetched: rows.length,
      stored: 0,
      skipped: false,
      durationMs: Date.now() - startedAt,
      error: rows.length > 0 ? undefined : 'World Bank returned no commodity rows',
      records: rows,
    }
  } catch (error) {
    return {
      source: 'world_bank',
      success: false,
      fetched: 0,
      stored: 0,
      skipped: false,
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : 'World Bank fetch failed',
      records: [],
    }
  }
}

function normalizeUsdaRows(
  config: UsdaSeriesConfig,
  payload: UsdaResponse
): SourceRecordCandidate[] {
  const rows = Array.isArray(payload.data) ? payload.data : []
  const usableRows: SourceRecordCandidate[] = []

  for (const row of rows) {
    const price = parseNumericValue(row.Value ?? row.value)
    const observedAt =
      toSafeText(row.week_ending, '') ||
      buildObservedAt(toSafeText(row.year, ''), toSafeText(row.begin_code, ''))

    if (price === null) {
      continue
    }

    usableRows.push({
      commodityId: config.commodityId,
      commodityName: config.commodityName,
      symbol: config.symbol,
      region: config.region,
      marketScope: config.marketScope,
      price,
      unit: toSafeText(row.unit_desc, 'USDA reported unit'),
      currencyCode: 'USD',
      observedAt,
      providerSeriesId: config.commodityDesc,
      sourceFrequency: toSafeText(row.freq_desc, 'MONTHLY').toLowerCase().includes('week')
        ? 'weekly'
        : 'monthly',
      metadata: {
        short_desc: toSafeText(row.short_desc, ''),
        statisticcat_desc: toSafeText(row.statisticcat_desc, ''),
        location_desc: toSafeText(row.location_desc, toSafeText(row.country_name, 'United States')),
      },
      rawPayload: row,
    })
  }

  return usableRows
    .sort((left, right) => right.observedAt.localeCompare(left.observedAt))
    .slice(0, 2)
}

async function fetchFromUsda(): Promise<SourceRunSummary & { records: NormalizedMarketRow[] }> {
  const startedAt = Date.now()
  const apiKey = toSafeText(process.env.USDA_QUICKSTATS_API_KEY, '')

  if (!apiKey) {
    return {
      source: 'usda',
      success: false,
      fetched: 0,
      stored: 0,
      skipped: true,
      durationMs: Date.now() - startedAt,
      error: 'USDA_QUICKSTATS_API_KEY is not configured',
      records: [],
    }
  }

  const rows: NormalizedMarketRow[] = []
  const currentYear = new Date().getUTCFullYear()

  try {
    for (const config of USDA_SERIES) {
      const params = new URLSearchParams({
        key: apiKey,
        commodity_desc: config.commodityDesc,
        statisticcat_desc: 'PRICE RECEIVED',
        agg_level_desc: 'NATIONAL',
        year__GE: String(currentYear - 2),
        format: 'JSON',
      })
      const payload = await fetchJson<UsdaResponse>(
        `https://quickstats.nass.usda.gov/api/api_GET/?${params.toString()}`
      )
      const candidates = normalizeUsdaRows(config, payload)

      if (candidates.length > 0) {
        rows.push(normalizeCandidatePair('usda', candidates[0], candidates[1] || null))
      }
    }

    return {
      source: 'usda',
      success: rows.length > 0,
      fetched: rows.length,
      stored: 0,
      skipped: false,
      durationMs: Date.now() - startedAt,
      error: rows.length > 0 ? undefined : 'USDA returned no commodity price rows',
      records: rows,
    }
  } catch (error) {
    return {
      source: 'usda',
      success: false,
      fetched: 0,
      stored: 0,
      skipped: false,
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : 'USDA fetch failed',
      records: [],
    }
  }
}
function normalizeFaoRows(
  payload: unknown,
  allowedSeries: FaoSeriesConfig[]
): SourceRecordCandidate[] {
  const root = asRecord(payload)
  const rows = Array.isArray(root?.data)
    ? root?.data
    : Array.isArray(root?.items)
      ? root?.items
      : Array.isArray(payload)
        ? payload
        : []

  const candidates: SourceRecordCandidate[] = []

  for (const item of rows) {
    const record = asRecord(item)
    const commodityName =
      toSafeText(record?.item, '') ||
      toSafeText(record?.item_name, '') ||
      toSafeText(record?.commodity_name, '')

    const configuredSeries =
      allowedSeries.find(
        (series) =>
          series.commodityName.toLowerCase() === commodityName.toLowerCase() ||
          series.symbol.toLowerCase() === commodityName.toLowerCase()
      ) || null

    if (!configuredSeries) {
      continue
    }

    const price =
      parseNumericValue(record?.value) ??
      parseNumericValue(record?.Value) ??
      parseNumericValue(record?.price)

    if (price === null) {
      continue
    }

    const itemCode =
      toSafeText(record?.item_code, '') ||
      toSafeText(record?.item, '') ||
      configuredSeries.commodityId

    candidates.push({
      commodityId: configuredSeries.commodityId,
      commodityName: configuredSeries.commodityName,
      symbol: configuredSeries.symbol,
      region:
        toSafeText(record?.area, '') ||
        toSafeText(record?.area_name, '') ||
        configuredSeries.region,
      marketScope: configuredSeries.marketScope,
      price,
      unit:
        toSafeText(record?.unit, '') ||
        toSafeText(record?.unit_name, '') ||
        'FAO reported unit',
      currencyCode: toSafeText(record?.currency, 'USD') || 'USD',
      observedAt:
        toSafeText(record?.month, '') || toSafeText(record?.month_code, '')
          ? buildObservedAt(
              toSafeText(record?.year, ''),
              toSafeText(record?.month, toSafeText(record?.month_code, ''))
            )
          : buildObservedAt(toSafeText(record?.year, '')),
      providerSeriesId: itemCode,
      sourceFrequency:
        toSafeText(record?.month, '') || toSafeText(record?.month_code, '') ? 'monthly' : 'annual',
      metadata: {
        area_code: toSafeText(record?.area_code, ''),
        element: toSafeText(record?.element, ''),
        source_note: 'FAO producer prices',
      },
      rawPayload: record || {},
    })
  }

  const latestBySeries = new Map<string, SourceRecordCandidate[]>()

  for (const candidate of candidates) {
    const key = candidate.providerSeriesId
    const existing = latestBySeries.get(key) || []
    existing.push(candidate)
    latestBySeries.set(key, existing)
  }

  return Array.from(latestBySeries.values()).flatMap((group) =>
    group.sort((left, right) => right.observedAt.localeCompare(left.observedAt)).slice(0, 2)
  )
}

async function fetchFromFao(): Promise<SourceRunSummary & { records: NormalizedMarketRow[] }> {
  const startedAt = Date.now()
  const endpoint = toSafeText(process.env.FAO_PRICES_API_URL, '')

  if (!endpoint) {
    return {
      source: 'fao',
      success: false,
      fetched: 0,
      stored: 0,
      skipped: true,
      durationMs: Date.now() - startedAt,
      error: 'FAO_PRICES_API_URL is not configured',
      records: [],
    }
  }

  try {
    const payload = await fetchJson<unknown>(endpoint)
    const candidates = normalizeFaoRows(payload, FAO_SERIES)
    const latestBySeries = new Map<string, SourceRecordCandidate[]>()

    for (const candidate of candidates) {
      const bucket = latestBySeries.get(candidate.providerSeriesId) || []
      bucket.push(candidate)
      latestBySeries.set(candidate.providerSeriesId, bucket)
    }

    const records = Array.from(latestBySeries.values())
      .map((group) =>
        group.sort((left, right) => right.observedAt.localeCompare(left.observedAt)).slice(0, 2)
      )
      .filter((group) => group.length > 0)
      .map((group) => normalizeCandidatePair('fao', group[0], group[1] || null))

    return {
      source: 'fao',
      success: records.length > 0,
      fetched: records.length,
      stored: 0,
      skipped: false,
      durationMs: Date.now() - startedAt,
      error: records.length > 0 ? undefined : 'FAO returned no normalized rows',
      records,
    }
  } catch (error) {
    return {
      source: 'fao',
      success: false,
      fetched: 0,
      stored: 0,
      skipped: false,
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : 'FAO fetch failed',
      records: [],
    }
  }
}

async function storeNormalizedMarketData(rows: NormalizedMarketRow[]): Promise<{
  success: boolean
  stored: number
  error?: string
}> {
  if (rows.length === 0) {
    return {
      success: false,
      stored: 0,
      error: 'No market rows to store',
    }
  }

  try {
    const supabase = getSupabaseServerClient()
    const { data, error } = await supabase
      .from('market_data')
      .upsert(rows, {
        onConflict: 'provider,provider_series_id,region,observed_at',
        ignoreDuplicates: false,
      })
      .select('id')

    if (error) {
      return {
        success: false,
        stored: 0,
        error: error.message,
      }
    }

    return {
      success: true,
      stored: Array.isArray(data) ? data.length : rows.length,
    }
  } catch (error) {
    return {
      success: false,
      stored: 0,
      error: error instanceof Error ? error.message : 'Unknown storage error',
    }
  }
}

function normalizeStoredCommodityPrice(raw: unknown): CommodityPrice | null {
  const record = asRecord(raw)
  const commodityId = toSafeText(record?.commodity_id, '')

  if (!commodityId) {
    return null
  }

  const demandLevel = toSafeText(record?.demand_level, 'medium')
  const supplyLevel = toSafeText(record?.supply_level, 'medium')
  const trendDirection = toSafeText(record?.trend_direction, 'sideways')

  return {
    id: commodityId,
    name: toSafeText(record?.commodity_name, commodityId),
    symbol: toSafeText(record?.provider_series_id, '') || commodityId.toUpperCase(),
    unit: toSafeText(record?.price_unit, 'unit'),
    price: toSafeNumber(record?.current_price, 0),
    change24h: toSafeNumber(record?.price_change_24h, 0),
    changePercent24h: toSafeNumber(record?.price_change_percentage_24h, 0),
    demandLevel:
      demandLevel === 'low' || demandLevel === 'high' ? demandLevel : 'medium',
    supplyLevel:
      supplyLevel === 'low' || supplyLevel === 'high' ? supplyLevel : 'medium',
    trendDirection:
      trendDirection === 'uptrend' || trendDirection === 'downtrend' ? trendDirection : 'sideways',
    volatilityIndex: toSafeNumber(record?.volatility_index, 0),
    timestamp: new Date(
      toSafeText(record?.observed_at, toSafeText(record?.timestamp, new Date().toISOString()))
    ),
    source: toSafeText(record?.source, '') || toSafeText(record?.data_source, 'market_data'),
  }
}
export async function fetchCommodityPrices(): Promise<CommodityPrice[]> {
  const sourceResults = await Promise.all([fetchFromFao(), fetchFromUsda(), fetchFromWorldBank()])

  return sourceResults
    .flatMap((result) => result.records)
    .map((row) => normalizeStoredCommodityPrice(row))
    .filter((row): row is CommodityPrice => row !== null)
}

export async function storeCommodityPrices(prices: CommodityPrice[]): Promise<boolean> {
  const normalizedRows = prices.map((price) =>
    normalizeCandidatePair(
      price.source.toLowerCase().includes('usda')
        ? 'usda'
        : price.source.toLowerCase().includes('fao')
          ? 'fao'
          : 'world_bank',
      {
        commodityId: price.id,
        commodityName: price.name,
        symbol: price.symbol,
        region: 'Global',
        marketScope: 'global',
        price: price.price,
        unit: price.unit,
        currencyCode: 'USD',
        observedAt: price.timestamp.toISOString(),
        providerSeriesId: price.symbol,
        sourceFrequency: 'daily',
        metadata: {},
        rawPayload: {},
      },
      null
    )
  )

  const stored = await storeNormalizedMarketData(normalizedRows)
  return stored.success
}

export async function getLatestCommodityPrice(commodityId: string): Promise<CommodityPrice | null> {
  try {
    const supabase = getSupabaseServerClient()
    const { data, error } = await supabase
      .from('market_data')
      .select('*')
      .eq('commodity_id', commodityId)
      .order('observed_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error || !data) {
      return null
    }

    return normalizeStoredCommodityPrice(data)
  } catch {
    return null
  }
}

export async function getAllLatestCommodityPrices(): Promise<CommodityPrice[]> {
  try {
    const supabase = getSupabaseServerClient()
    const { data, error } = await supabase
      .from('market_data')
      .select('*')
      .order('observed_at', { ascending: false })
      .limit(100)

    if (error || !Array.isArray(data)) {
      return []
    }

    const latestByCommodity = new Map<string, CommodityPrice>()

    for (const row of data) {
      const normalized = normalizeStoredCommodityPrice(row)

      if (!normalized || latestByCommodity.has(normalized.id)) {
        continue
      }

      latestByCommodity.set(normalized.id, normalized)
    }

    return Array.from(latestByCommodity.values())
  } catch {
    return []
  }
}

export async function ingestCommodityPrices(
  trigger: IngestionTrigger = 'manual'
): Promise<IngestionSummary> {
  const runId = await beginIngestionRun(trigger)
  const sourceResults = await Promise.all([fetchFromFao(), fetchFromUsda(), fetchFromWorldBank()])
  const totalFetched = sourceResults.reduce((sum, result) => sum + result.fetched, 0)
  const rows = sourceResults.flatMap((result) => result.records)
  const storage = await storeNormalizedMarketData(rows)
  const successfulSources = sourceResults.filter((result) => result.success).length
  const summary: IngestionSummary = {
    success: storage.success && successfulSources > 0,
    partial:
      successfulSources > 0 &&
      sourceResults.some((result) => !result.success || result.skipped),
    totalFetched,
    totalStored: storage.stored,
    runId,
    sourceResults: sourceResults.map((result) => ({
      source: result.source,
      success: result.success,
      fetched: result.fetched,
      stored: result.success && storage.success ? result.fetched : 0,
      skipped: result.skipped,
      durationMs: result.durationMs,
      error: result.error,
    })),
    timestamp: new Date().toISOString(),
  }

  await finishIngestionRun(runId, {
    status: summary.success ? (summary.partial ? 'partial' : 'success') : 'failed',
    sourceResults: summary.sourceResults,
    fetched: totalFetched,
    stored: storage.stored,
    error: storage.error,
  })

  return summary
}


