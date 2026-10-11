import { describe, expect, it } from 'vitest'
import {
  comparePartialDates,
  formatDateRange,
  formatPartialDate,
  isPartialDate,
  parsePartialDate,
} from './partialDate'

describe('parsePartialDate', () => {
  it('accepts year, year-month and full dates', () => {
    expect(parsePartialDate('2019')).toEqual({ year: 2019 })
    expect(parsePartialDate('2019-06')).toEqual({ year: 2019, month: 6 })
    expect(parsePartialDate('2019-06-14')).toEqual({ year: 2019, month: 6, day: 14 })
  })

  it('rejects malformed and impossible dates', () => {
    for (const bad of ['', '19', '2019-6', '2019-13', '2019-00', '2019-02-30', '2019-06-14T00:00', 'June 2019']) {
      expect(parsePartialDate(bad), bad).toBeNull()
    }
  })

  it('knows leap years', () => {
    expect(isPartialDate('2024-02-29')).toBe(true)
    expect(isPartialDate('2023-02-29')).toBe(false)
  })
})

describe('formatPartialDate', () => {
  it('formats only as precisely as entered', () => {
    expect(formatPartialDate('2019', 'en-GB')).toBe('2019')
    expect(formatPartialDate('2019-06', 'en-GB')).toBe('Jun 2019')
    expect(formatPartialDate('2019-06-14', 'en-GB')).toBe('14 Jun 2019')
  })

  it('uses the given locale', () => {
    expect(formatPartialDate('2019-06', 'da-DK')).toMatch(/jun/)
  })
})

describe('formatDateRange', () => {
  it('handles open ends and equal ends', () => {
    expect(formatDateRange('2005', '2010', 'en-GB')).toBe('2005 – 2010')
    expect(formatDateRange('2021', undefined, 'en-GB')).toBe('Since 2021')
    expect(formatDateRange(undefined, '2010', 'en-GB')).toBe('Until 2010')
    expect(formatDateRange('2019', '2019', 'en-GB')).toBe('2019')
    expect(formatDateRange(undefined, undefined, 'en-GB')).toBe('')
  })
})

describe('comparePartialDates', () => {
  it('orders chronologically, less precise first within a period', () => {
    const sorted = ['2019-06-14', '2005', '2019', '2019-06', '2018-12-31'].sort(comparePartialDates)
    expect(sorted).toEqual(['2005', '2018-12-31', '2019', '2019-06', '2019-06-14'])
  })
})
