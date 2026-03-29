export type SafeRecord = Record<string, unknown>

export function asRecord(value: unknown): SafeRecord | null {
  return value !== null && typeof value === 'object' ? (value as SafeRecord) : null
}

export function toSafeText(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback
}

export function toSafeNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const normalized = Number(value.trim())

    if (Number.isFinite(normalized)) {
      return normalized
    }
  }

  return fallback
}

export function toOptionalNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const safeNumber = toSafeNumber(value, Number.NaN)
  return Number.isFinite(safeNumber) ? safeNumber : null
}

export function toSafeBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') {
    return value
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()

    if (normalized === 'true' || normalized === '1' || normalized === 'yes') {
      return true
    }

    if (normalized === 'false' || normalized === '0' || normalized === 'no') {
      return false
    }
  }

  if (typeof value === 'number') {
    return value !== 0
  }

  return fallback
}

export function toSafeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
}

export function toIsoTimestamp(value: unknown, fallback = new Date().toISOString()): string {
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = new Date(value)

    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString()
    }
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString()
  }

  return fallback
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
