import type {
  ClimateRiskLevel,
  MarketRecommendationAction,
  RecommendationExplainability,
  RecommendationFactorWeights,
  RecommendationScoringClimateInput,
  RecommendationScoringMarketInput,
  RecommendationScoringUserInput,
  ScoredCommodityRecommendation,
  ScoringComponent,
} from '@/modules/recommendation/recommendation.types'

export const DEFAULT_RECOMMENDATION_WEIGHTS: RecommendationFactorWeights = {
  interest_match: 0.3,
  market_trend: 0.35,
  climate_risk: 0.2,
  user_quality: 0.15,
}

interface NormalizedUserInput {
  userId: string
  interests: string[]
  region: string
  role: string
  qualityScore: number | null
  completionRate: number | null
  profileCompleteness: number
}

interface NormalizedMarketInput {
  commodity: string
  commodityId: string
  price: number
  trend: string
  region: string
  demandLevel: string
  supplyLevel: string
  volatilityIndex: number
}

interface NormalizedClimateInput {
  riskLevel: ClimateRiskLevel
  region: string
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100
}

function toSafeText(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback
}

function toSafeNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? value
    : typeof value === 'string' && value.trim().length > 0 && Number.isFinite(Number(value))
      ? Number(value)
      : fallback
}

function toSafeArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
}

function toComparisonKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function dedupeReasons(reasons: string[]): string[] {
  const seen = new Set<string>()
  const unique: string[] = []

  for (const reason of reasons) {
    const safeReason = toSafeText(reason)
    if (!safeReason) {
      continue
    }

    const key = safeReason.toLowerCase()
    if (!seen.has(key)) {
      seen.add(key)
      unique.push(safeReason)
    }
  }

  return unique
}

function normalizeClimateRisk(value: unknown): ClimateRiskLevel {
  const safeRisk = toSafeText(value, 'medium').toLowerCase()

  if (safeRisk === 'low' || safeRisk === 'high' || safeRisk === 'critical' || safeRisk === 'moderate' || safeRisk === 'medium') {
    return safeRisk
  }

  return 'medium'
}

function normalizeUserInput(
  user: Partial<RecommendationScoringUserInput> | null | undefined
): NormalizedUserInput {
  const safeInterests = toSafeArray(user?.interests).map((interest) => toComparisonKey(interest))
  const hasRegion = toSafeText(user?.region, '').length > 0
  const hasRole = toSafeText(user?.role, '').length > 0
  const completenessSignals = [safeInterests.length > 0, hasRegion, hasRole].filter(Boolean).length
  const profileCompleteness =
    user?.profileCompleteness !== undefined && user?.profileCompleteness !== null
      ? clamp(toSafeNumber(user.profileCompleteness, 0), 0, 1)
      : completenessSignals / 3

  return {
    userId: toSafeText(user?.userId, 'anonymous-user'),
    interests: safeInterests,
    region: toSafeText(user?.region, 'unknown'),
    role: toSafeText(user?.role, 'unknown').toLowerCase(),
    qualityScore:
      user?.qualityScore === undefined || user?.qualityScore === null
        ? null
        : clamp(toSafeNumber(user.qualityScore, 0), 0, 100),
    completionRate:
      user?.completionRate === undefined || user?.completionRate === null
        ? null
        : clamp(toSafeNumber(user.completionRate, 0), 0, 1),
    profileCompleteness,
  }
}

function normalizeMarketInput(
  market: Partial<RecommendationScoringMarketInput> | null | undefined,
  index: number
): NormalizedMarketInput {
  return {
    commodity: toSafeText(market?.commodity, `commodity-${index + 1}`),
    commodityId: toSafeText(market?.commodityId, `commodity-${index + 1}`),
    price: Math.max(0, toSafeNumber(market?.price, 0)),
    trend: toSafeText(market?.trend, 'stable').toLowerCase(),
    region: toSafeText(market?.region, 'unknown'),
    demandLevel: toSafeText(market?.demandLevel, 'medium').toLowerCase(),
    supplyLevel: toSafeText(market?.supplyLevel, 'medium').toLowerCase(),
    volatilityIndex: clamp(toSafeNumber(market?.volatilityIndex, 50), 0, 100),
  }
}

function normalizeClimateInput(
  climate: Partial<RecommendationScoringClimateInput> | null | undefined,
  fallbackRegion: string
): NormalizedClimateInput {
  return {
    riskLevel: normalizeClimateRisk(climate?.risk_level),
    region: toSafeText(climate?.region, fallbackRegion || 'unknown'),
  }
}

function inferAction(market: NormalizedMarketInput): MarketRecommendationAction {
  if (market.trend.includes('up')) {
    return 'SELL'
  }

  if (market.trend.includes('down')) {
    return 'BUY'
  }

  return 'HOLD'
}

function createScoringComponent(
  name: keyof RecommendationFactorWeights,
  value: number,
  reasoning: string[],
  dataQuality: number,
  weights: RecommendationFactorWeights
): ScoringComponent {
  const safeValue = clamp(value, 0, 100)
  const safeWeight = weights[name]

  return {
    name,
    weight: safeWeight,
    value: Math.round(safeValue),
    reasoning: dedupeReasons(reasoning),
    contribution: roundToTwoDecimals(safeValue * safeWeight),
    dataQuality: roundToTwoDecimals(clamp(dataQuality, 0, 1)),
  }
}

function scoreInterestMatch(
  user: NormalizedUserInput,
  market: NormalizedMarketInput,
  weights: RecommendationFactorWeights
): ScoringComponent {
  const commodityKey = toComparisonKey(market.commodity)
  const hasExactInterest = user.interests.some((interest) =>
    interest.includes(commodityKey) || commodityKey.includes(interest)
  )

  let value = 30
  let dataQuality = 0.35
  const reasoning: string[] = []

  if (hasExactInterest) {
    value += 45
    dataQuality += 0.35
    reasoning.push(`User interested in ${market.commodity}`)
  } else if (user.interests.length > 0) {
    value += 15
    dataQuality += 0.2
    reasoning.push(`User has adjacent interests, but ${market.commodity} is not a top explicit match`)
  } else {
    reasoning.push('Interest history missing, using neutral prior')
  }

  if (user.role === 'trader' || user.role === 'exporter') {
    value += 15
    dataQuality += 0.1
    reasoning.push(`User role ${user.role} is well aligned with trading execution`)
  } else if (user.role === 'farmer') {
    value += 8
    dataQuality += 0.05
    reasoning.push('Farmer profile still supports actionable commodity recommendations')
  }

  return createScoringComponent('interest_match', value, reasoning, dataQuality, weights)
}

function scoreMarketTrend(
  market: NormalizedMarketInput,
  action: MarketRecommendationAction,
  weights: RecommendationFactorWeights
): ScoringComponent {
  let value = action === 'SELL' ? 78 : action === 'BUY' ? 74 : 62
  let dataQuality = 0.5
  const reasoning: string[] = []

  if (action === 'SELL') {
    reasoning.push('Price trending up')
  } else if (action === 'BUY') {
    reasoning.push('Price trending down, creating a buy window')
  } else {
    reasoning.push('Market trend is stable, so hold is safer than forcing a trade')
  }

  if (market.demandLevel === 'high') {
    value += action === 'SELL' ? 10 : 4
    dataQuality += 0.15
    reasoning.push('Demand remains high')
  } else if (market.demandLevel === 'low') {
    value += action === 'BUY' ? 8 : -6
    dataQuality += 0.15
    reasoning.push('Demand is soft, reducing immediate upside')
  }

  if (market.supplyLevel === 'low') {
    value += action === 'SELL' ? 8 : 2
    dataQuality += 0.1
    reasoning.push('Lower supply supports pricing power')
  } else if (market.supplyLevel === 'high') {
    value += action === 'BUY' ? 6 : -4
    dataQuality += 0.1
    reasoning.push('Higher supply caps short-term price acceleration')
  }

  if (market.price > 0) {
    dataQuality += 0.1
    reasoning.push(`Observed market price: ${market.price}`)
  }

  const volatilityPenalty = market.volatilityIndex > 70 ? 10 : market.volatilityIndex > 55 ? 4 : 0
  if (volatilityPenalty > 0 && action !== 'HOLD') {
    value -= volatilityPenalty
    reasoning.push('Elevated volatility reduces execution confidence')
  }

  return createScoringComponent('market_trend', value, reasoning, dataQuality, weights)
}

function scoreClimateRisk(
  climate: NormalizedClimateInput,
  action: MarketRecommendationAction,
  weights: RecommendationFactorWeights
): ScoringComponent {
  const reasoning: string[] = []
  let value = 65
  let dataQuality = 0.75

  switch (climate.riskLevel) {
    case 'low':
      value = action === 'BUY' ? 90 : action === 'HOLD' ? 84 : 76
      reasoning.push('Low climate risk')
      break
    case 'moderate':
    case 'medium':
      value = action === 'SELL' ? 78 : action === 'HOLD' ? 72 : 66
      reasoning.push('Moderate climate risk')
      break
    case 'high':
      value = action === 'SELL' ? 86 : action === 'HOLD' ? 46 : 36
      reasoning.push('High climate risk raises urgency to protect margin')
      break
    case 'critical':
      value = action === 'SELL' ? 92 : action === 'HOLD' ? 28 : 20
      reasoning.push('Critical climate risk strongly favors fast exposure reduction')
      break
    default:
      value = 65
      dataQuality = 0.35
      reasoning.push('Climate risk missing, using neutral climate prior')
      break
  }

  return createScoringComponent('climate_risk', value, reasoning, dataQuality, weights)
}

function scoreUserQuality(
  user: NormalizedUserInput,
  weights: RecommendationFactorWeights
): ScoringComponent {
  const reasoning: string[] = []
  let value = 25
  let dataQuality = 0.35

  if (user.qualityScore !== null) {
    value += user.qualityScore * 0.55
    dataQuality += 0.3
    reasoning.push(`Historical user quality score: ${Math.round(user.qualityScore)}`)
  }

  if (user.completionRate !== null) {
    value += user.completionRate * 20
    dataQuality += 0.2
    reasoning.push(`Completion rate: ${Math.round(user.completionRate * 100)}%`)
  }

  value += user.profileCompleteness * 20
  reasoning.push(`Profile completeness: ${Math.round(user.profileCompleteness * 100)}%`)

  if (user.role === 'trader' || user.role === 'exporter') {
    value += 8
    reasoning.push(`Execution role ${user.role} improves action readiness`)
  }

  return createScoringComponent('user_quality', value, reasoning, dataQuality, weights)
}

function normalizeScoringComponents(components: ScoringComponent[]): ScoringComponent[] {
  const totalWeight = components.reduce((sum, component) => sum + component.weight, 0) || 1

  return components.map((component) => ({
    ...component,
    contribution: roundToTwoDecimals(component.value * (component.weight / totalWeight)),
  }))
}

function calculateFinalScore(components: ScoringComponent[]): number {
  const totalWeight = components.reduce((sum, component) => sum + component.weight, 0) || 1
  const score =
    components.reduce((sum, component) => sum + component.value * component.weight, 0) / totalWeight

  return Math.round(clamp(score, 0, 100))
}

function calculateConfidence(components: ScoringComponent[]): number {
  if (components.length === 0) {
    return 0
  }

  const weightedCoverage = components.reduce(
    (sum, component) => sum + (component.dataQuality || 0) * component.weight,
    0
  )
  const weightedSignalStrength = components.reduce(
    (sum, component) => sum + (Math.abs(component.value - 50) / 50) * component.weight,
    0
  )
  const mean = components.reduce((sum, component) => sum + component.value, 0) / components.length
  const variance =
    components.reduce((sum, component) => sum + (component.value - mean) ** 2, 0) /
    components.length
  const agreement = clamp(1 - Math.sqrt(variance) / 50, 0, 1)

  const confidence = 0.28 + weightedCoverage * 0.37 + weightedSignalStrength * 0.2 + agreement * 0.15
  return roundToTwoDecimals(clamp(confidence, 0, 1))
}

function buildReasoning(components: ScoringComponent[]): string[] {
  return dedupeReasons(
    [...components]
      .sort((left, right) => (right.contribution || 0) - (left.contribution || 0))
      .flatMap((component) => component.reasoning.slice(0, 2))
  ).slice(0, 5)
}

function buildExplainability(
  components: ScoringComponent[],
  weights: RecommendationFactorWeights
): RecommendationExplainability {
  return {
    weights,
    components,
  }
}

function calculateTargetPrice(market: NormalizedMarketInput, action: MarketRecommendationAction): number | undefined {
  if (market.price <= 0) {
    return undefined
  }

  if (action === 'SELL') {
    return Math.round(market.price * 1.08)
  }

  if (action === 'BUY') {
    return Math.round(market.price * 0.95)
  }

  return Math.round(market.price)
}

export function generateRecommendations(
  user: Partial<RecommendationScoringUserInput> | null | undefined,
  marketData: Array<Partial<RecommendationScoringMarketInput> | null | undefined> | null | undefined,
  climateData?: Partial<RecommendationScoringClimateInput> | null,
  weights: RecommendationFactorWeights = DEFAULT_RECOMMENDATION_WEIGHTS
): ScoredCommodityRecommendation[] {
  const normalizedUser = normalizeUserInput(user)
  const safeMarkets = Array.isArray(marketData) ? marketData : []

  return safeMarkets
    .map((rawMarket, index) => {
      const normalizedMarket = normalizeMarketInput(rawMarket, index)
      const normalizedClimate = normalizeClimateInput(climateData, normalizedUser.region || normalizedMarket.region)
      const action = inferAction(normalizedMarket)
      const components = normalizeScoringComponents([
        scoreInterestMatch(normalizedUser, normalizedMarket, weights),
        scoreMarketTrend(normalizedMarket, action, weights),
        scoreClimateRisk(normalizedClimate, action, weights),
        scoreUserQuality(normalizedUser, weights),
      ])
      const score = calculateFinalScore(components)
      const confidence = calculateConfidence(components)
      const reasoning = buildReasoning(components)

      return {
        commodity: normalizedMarket.commodity,
        commodityId: normalizedMarket.commodityId,
        action,
        score,
        confidence,
        reasoning,
        explainability: buildExplainability(components, weights),
        targetPrice: calculateTargetPrice(normalizedMarket, action),
      }
    })
    .sort((left, right) => right.score - left.score || right.confidence - left.confidence)
}



