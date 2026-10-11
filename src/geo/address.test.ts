import { describe, expect, it } from 'vitest'
import { localityName, shortAddress } from './address'

describe('shortAddress', () => {
  it('formats as "City, Country"', () => {
    expect(shortAddress({ city: 'Copenhagen', country: 'Denmark', county: 'X' })).toBe('Copenhagen, Denmark')
  })

  it('falls back to less specific localities', () => {
    expect(localityName({ village: 'Hvide Sande', county: 'Ringkøbing' })).toBe('Hvide Sande')
    expect(shortAddress({ state: 'Bavaria', country: 'Germany' })).toBe('Bavaria, Germany')
  })

  it('works with only a country, or nothing', () => {
    expect(shortAddress({ country: 'Iceland' })).toBe('Iceland')
    expect(shortAddress({})).toBe('')
  })
})
