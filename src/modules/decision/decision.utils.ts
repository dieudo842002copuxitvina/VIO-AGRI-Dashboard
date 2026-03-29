/**
 * Decision Engine Utilities
 * Helper functions and logging utilities
 */

/**
 * Logger class for consistent logging across the decision engine
 */
export class Logger {
  private logLevel: 'debug' | 'info' | 'warn' | 'error'

  private static readonly LOG_LEVELS = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  }

  constructor(logLevel: 'debug' | 'info' | 'warn' | 'error' = 'info') {
    this.logLevel = logLevel
  }

  private shouldLog(level: 'debug' | 'info' | 'warn' | 'error'): boolean {
    return Logger.LOG_LEVELS[level] >= Logger.LOG_LEVELS[this.logLevel]
  }

  debug(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog('debug')) {
      console.debug(`[DECISION_ENGINE:DEBUG] ${message}`, context || {})
    }
  }

  info(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog('info')) {
      console.info(`[DECISION_ENGINE:INFO] ${message}`, context || {})
    }
  }

  warn(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog('warn')) {
      console.warn(`[DECISION_ENGINE:WARN] ${message}`, context || {})
    }
  }

  error(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog('error')) {
      console.error(`[DECISION_ENGINE:ERROR] ${message}`, context || {})
    }
  }
}

/**
 * Generate unique ID for insights
 */
export function generateInsightId(): string {
  return `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Generate unique ID for recommendations
 */
export function generateRecommendationId(): string {
  return `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Generate unique session ID for decision engine execution
 */
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Format decimal numbers to specific precision
 */
export function formatNumber(num: number, decimals: number = 2): number {
  return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals)
}

/**
 * Calculate percentage change between two values
 */
export function calculatePercentageChange(oldValue: number, newValue: number): number {
  if (oldValue === 0) return 0
  return formatNumber(((newValue - oldValue) / oldValue) * 100)
}

/**
 * Determine trend direction based on price change
 */
export function determineTrend(
  percentageChange: number
): 'uptrend' | 'downtrend' | 'sideways' {
  if (percentageChange > 2) return 'uptrend'
  if (percentageChange < -2) return 'downtrend'
  return 'sideways'
}

/**
 * Calculate confidence score based on multiple factors
 */
export function calculateConfidenceScore(factors: number[]): number {
  if (factors.length === 0) return 0
  const average = factors.reduce((a, b) => a + b, 0) / factors.length
  return Math.min(1, Math.max(0, average))
}

/**
 * Normalize value to 0-1 range
 */
export function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0.5
  return Math.min(1, Math.max(0, (value - min) / (max - min)))
}

/**
 * Determine demand level based on multiple metrics
 */
export function determineDemandLevel(
  confidence: number
): 'low' | 'medium' | 'high' {
  if (confidence >= 0.7) return 'high'
  if (confidence >= 0.4) return 'medium'
  return 'low'
}

/**
 * Determine supply level based on multiple metrics
 */
export function determineSupplyLevel(
  confidence: number
): 'low' | 'medium' | 'high' {
  if (confidence >= 0.7) return 'high'
  if (confidence >= 0.4) return 'medium'
  return 'low'
}

/**
 * Get priority level based on confidence and risk
 */
export function determinePriority(
  confidence: number,
  isRisk: boolean
): 'low' | 'medium' | 'high' | 'critical' {
  if (isRisk && confidence >= 0.8) return 'critical'
  if (confidence >= 0.85) return 'high'
  if (confidence >= 0.6) return 'medium'
  return 'low'
}

/**
 * Parse CSV data into structured format
 */
export function parseCSVData(csv: string): Record<string, unknown>[] {
  const lines = csv.trim().split('\n')
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map((h) => h.trim())
  const data: Record<string, unknown>[] = []

  for (let i = 1; i < lines.length; i++) {
    const obj: Record<string, unknown> = {}
    const currentLine = lines[i].split(',')

    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = currentLine[j]?.trim() || ''
    }
    data.push(obj)
  }

  return data
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelayMs: number = 100
): Promise<T> {
  let lastError: Error | null = null

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      if (i < maxRetries - 1) {
        const delay = initialDelayMs * Math.pow(2, i)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError
}

/**
 * Measure execution time of async function
 */
export async function measureExecutionTime<T>(
  fn: () => Promise<T>
): Promise<{ result: T; executionTime: number }> {
  const startTime = Date.now()
  const result = await fn()
  const executionTime = Date.now() - startTime

  return { result, executionTime }
}

/**
 * Check if value is within acceptable range
 */
export function isWithinRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max
}

/**
 * Deep clone an object (simple implementation)
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => deepClone(item)) as unknown as T
  }

  const cloned = {} as T
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key])
    }
  }

  return cloned
}

