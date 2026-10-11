import { describe, expect, it } from 'vitest'
import { cleanPlace, placeErrors } from './placeDraft'
import type { Place } from './types'

const draft = (extra: Partial<Place> = {}): Place => ({
  id: 'x',
  groupId: 'other',
  title: 'Somewhere',
  lat: 1,
  lng: 2,
  address: '',
  ...extra,
})

describe('placeErrors', () => {
  it('accepts a minimal place', () => {
    expect(placeErrors(draft())).toEqual({})
  })

  it('requires a title', () => {
    expect(placeErrors(draft({ title: '   ' }))).toHaveProperty('title')
  })

  it('checks dates and their order', () => {
    expect(placeErrors(draft({ dateFrom: '2019-13' }))).toHaveProperty('dateFrom')
    expect(placeErrors(draft({ dateTo: 'soon' }))).toHaveProperty('dateTo')
    expect(placeErrors(draft({ dateFrom: '2020', dateTo: '2019-12' }))).toEqual({ dateTo: 'The end is before the start' })
    expect(placeErrors(draft({ dateFrom: '2019', dateTo: '2019-12' }))).toEqual({})
  })

  it('only allows http(s) image URLs', () => {
    expect(placeErrors(draft({ imageUrl: 'javascript:alert(1)' }))).toHaveProperty('imageUrl')
    expect(placeErrors(draft({ imageUrl: 'https://example.com/a.jpg' }))).toEqual({})
  })
})

describe('cleanPlace', () => {
  it('trims text and drops empty optional fields', () => {
    const cleaned = cleanPlace(draft({ title: ' Home ', address: ' Oslo ', note: '  ', imageUrl: '', dateFrom: ' 2019 ', dateTo: '' }))
    expect(cleaned).toEqual({ id: 'x', groupId: 'other', title: 'Home', lat: 1, lng: 2, address: 'Oslo', dateFrom: '2019' })
  })

  it('keeps overrides', () => {
    expect(cleanPlace(draft({ color: '#ff0000', icon: 'plane' }))).toMatchObject({ color: '#ff0000', icon: 'plane' })
  })
})
