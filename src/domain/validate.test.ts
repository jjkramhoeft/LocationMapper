import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { createInitialData, OTHER_GROUP_ID } from './defaultGroups'
import { parseMapDataJson, validateMapData, type ImportResult } from './validate'

type Loose = Record<string, unknown>

function valid(): Loose & { groups: Loose[]; places: Loose[] } {
  return {
    version: 1,
    groups: createInitialData().groups.map((g) => ({ ...g })),
    places: [
      {
        id: 'p1',
        groupId: 'lived',
        title: 'First flat',
        lat: 55.68,
        lng: 12.57,
        address: 'Copenhagen, Denmark',
        note: 'Third floor',
        imageUrl: 'https://example.com/a.jpg',
        dateFrom: '2005-08',
        dateTo: '2010',
        color: '#ff0000',
        icon: 'building',
      },
    ],
  }
}

function expectOk(result: ImportResult) {
  if (!result.ok) throw new Error(`Expected ok, got: ${result.error}`)
  return result
}

function expectFatal(result: ImportResult, message: RegExp) {
  expect(result.ok).toBe(false)
  if (!result.ok) expect(result.error).toMatch(message)
}

describe('validateMapData', () => {
  it('accepts a valid file without warnings and keeps every field', () => {
    const input = valid()
    const result = expectOk(validateMapData(input))
    expect(result.warnings).toEqual([])
    expect(result.data).toEqual(input)
  })

  describe('fatal problems', () => {
    it('rejects invalid JSON', () => {
      expectFatal(parseMapDataJson('{ nope'), /not valid JSON/)
    })

    it('rejects non-objects', () => {
      expectFatal(validateMapData([]), /map data object/)
      expectFatal(validateMapData(null), /map data object/)
    })

    it('rejects a missing or unknown version', () => {
      const { version: _, ...noVersion } = valid()
      expectFatal(validateMapData(noVersion), /no "version"/)
      expectFatal(validateMapData({ ...valid(), version: 2 }), /newer version/)
      expectFatal(validateMapData({ ...valid(), version: 'x' }), /Unknown file version/)
    })

    it('rejects missing lists', () => {
      expectFatal(validateMapData({ ...valid(), groups: undefined }), /"groups"/)
      expectFatal(validateMapData({ ...valid(), places: {} }), /"places"/)
    })

    it('rejects invalid coordinates', () => {
      for (const coords of [{ lat: 200, lng: 0 }, { lat: 0, lng: -181 }, { lat: '55', lng: 12 }, { lat: Number.NaN, lng: 0 }, {}]) {
        const data = valid()
        data.places[0] = { ...data.places[0], lat: undefined, lng: undefined, ...coords }
        expectFatal(validateMapData(data), /invalid coordinates/)
      }
    })

    it('rejects entries that are not objects', () => {
      expectFatal(validateMapData({ ...valid(), places: [42] }), /Place #1 is not an object/)
      expectFatal(validateMapData({ ...valid(), groups: ['x'] }), /Group #1 is not an object/)
    })
  })

  describe('minor problems are fixed and reported', () => {
    it('moves places with an unknown group to Other', () => {
      const data = valid()
      data.places[0]!.groupId = 'deleted-group'
      const result = expectOk(validateMapData(data))
      expect(result.data.places[0]!.groupId).toBe(OTHER_GROUP_ID)
      expect(result.warnings).toHaveLength(1)
    })

    it('adds a missing Other group', () => {
      const data = valid()
      data.groups = data.groups.filter((g) => g.id !== OTHER_GROUP_ID)
      const result = expectOk(validateMapData(data))
      expect(result.data.groups.some((g) => g.id === OTHER_GROUP_ID)).toBe(true)
      expect(result.warnings.join()).toMatch(/Other/)
    })

    it('fixes bad group colors and icons, and skips duplicate groups', () => {
      const data = valid()
      data.groups[0] = { ...data.groups[0], color: 'blue', icon: 'unicorn' }
      data.groups.push({ ...data.groups[1] })
      const result = expectOk(validateMapData(data))
      expect(result.data.groups[0]).toMatchObject({ color: '#6b7280', icon: 'map-pin' })
      expect(result.data.groups).toHaveLength(6)
      expect(result.warnings).toHaveLength(3)
    })

    it('regenerates missing and duplicate place ids', () => {
      const data = valid()
      data.places.push({ ...data.places[0] }, { ...data.places[0], id: undefined })
      const result = expectOk(validateMapData(data))
      const ids = result.data.places.map((p) => p.id)
      expect(new Set(ids).size).toBe(3)
      expect(ids[0]).toBe('p1')
      expect(result.warnings).toHaveLength(2)
    })

    it('fills in a missing title from the address', () => {
      const data = valid()
      data.places[0]!.title = '  '
      const result = expectOk(validateMapData(data))
      expect(result.data.places[0]!.title).toBe('Copenhagen, Denmark')
    })

    it('drops invalid optional fields', () => {
      const data = valid()
      Object.assign(data.places[0]!, {
        imageUrl: 'javascript:alert(1)',
        dateFrom: '2019-13',
        color: 'red',
        icon: 'unicorn',
        note: 5,
      })
      const result = expectOk(validateMapData(data))
      const place = result.data.places[0]!
      expect(place.imageUrl).toBeUndefined()
      expect(place.dateFrom).toBeUndefined()
      expect(place.dateTo).toBe('2010')
      expect(place.color).toBeUndefined()
      expect(place.icon).toBeUndefined()
      expect(place.note).toBeUndefined()
      expect(result.warnings).toHaveLength(5)
    })

    it('swaps dates in the wrong order', () => {
      const data = valid()
      Object.assign(data.places[0]!, { dateFrom: '2012', dateTo: '2010-05' })
      const result = expectOk(validateMapData(data))
      expect(result.data.places[0]).toMatchObject({ dateFrom: '2010-05', dateTo: '2012' })
      expect(result.warnings).toHaveLength(1)
    })

    it('drops unknown fields silently', () => {
      const data = valid()
      data.places[0]!.extra = 'x'
      const result = expectOk(validateMapData(data))
      expect(result.data.places[0]).not.toHaveProperty('extra')
      expect(result.warnings).toEqual([])
    })
  })
})

describe('sample data', () => {
  it('is a valid file without warnings', () => {
    const text = readFileSync(new URL('../../public/sample-data.json', import.meta.url), 'utf8')
    const result = expectOk(parseMapDataJson(text))
    expect(result.warnings).toEqual([])
    expect(result.data.places.length).toBeGreaterThan(5)
  })

  it('has places only in Job, Wish list and the extra Wonders group', () => {
    const text = readFileSync(new URL('../../public/sample-data.json', import.meta.url), 'utf8')
    const { data } = expectOk(parseMapDataJson(text))
    const byGroup = (id: string) => data.places.filter((p) => p.groupId === id)
    // No empty groups, except Other, the fallback group the app always needs.
    expect(data.groups.map((g) => g.id)).toEqual(['job', 'wish-list', 'wonders', 'other'])
    expect(byGroup('wonders')).toHaveLength(7)
    expect(byGroup('job')).toHaveLength(9)
    expect(byGroup('wish-list')).toHaveLength(17)
    expect(byGroup('wish-list').every((p) => p.imageUrl)).toBe(true)
    expect(data.places).toHaveLength(7 + 9 + 17)
  })
})
