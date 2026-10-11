import type { PartialDate } from './types'

const PATTERN = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/

interface Parts {
  year: number
  month?: number
  day?: number
}

export function parsePartialDate(value: string): Parts | null {
  const m = PATTERN.exec(value)
  if (!m) return null
  const year = Number(m[1])
  if (m[2] === undefined) return { year }
  const month = Number(m[2])
  if (month < 1 || month > 12) return null
  if (m[3] === undefined) return { year, month }
  const day = Number(m[3])
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
  if (day < 1 || day > daysInMonth) return null
  return { year, month, day }
}

export function isPartialDate(value: unknown): value is PartialDate {
  return typeof value === 'string' && parsePartialDate(value) !== null
}

/** Formats only as precisely as entered: "2019", "Jun 2019", "14 Jun 2019" (locale-dependent). */
export function formatPartialDate(value: PartialDate, locale?: string): string {
  const parts = parsePartialDate(value)
  if (!parts) return value
  if (parts.month === undefined) return String(parts.year)
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day ?? 1))
  const options: Intl.DateTimeFormatOptions =
    parts.day === undefined
      ? { year: 'numeric', month: 'short', timeZone: 'UTC' }
      : { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' }
  return new Intl.DateTimeFormat(locale, options).format(date)
}

export function formatDateRange(from?: PartialDate, to?: PartialDate, locale?: string): string {
  if (from && to) {
    if (from === to) return formatPartialDate(from, locale)
    return `${formatPartialDate(from, locale)} – ${formatPartialDate(to, locale)}`
  }
  if (from) return `Since ${formatPartialDate(from, locale)}`
  if (to) return `Until ${formatPartialDate(to, locale)}`
  return ''
}

/**
 * Chronological comparison. A less precise date sorts before a more precise one
 * in the same period ("2019" < "2019-06"), i.e. it is treated as the start of it.
 */
export function comparePartialDates(a: PartialDate, b: PartialDate): number {
  return a < b ? -1 : a > b ? 1 : 0
}
