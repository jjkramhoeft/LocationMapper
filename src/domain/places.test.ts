import { describe, expect, it } from 'vitest'
import { filterPlaces, sortPlaces } from './places'
import type { Group, Place } from './types'

const groups: Group[] = [
  { id: 'a', name: 'A', color: '#000000', icon: 'house' },
  { id: 'b', name: 'B', color: '#000000', icon: 'plane' },
]

function place(id: string, extra: Partial<Place> = {}): Place {
  return { id, groupId: 'a', title: id, lat: 0, lng: 0, address: '', ...extra }
}

const ids = (places: Place[]) => places.map((p) => p.id)

describe('sortPlaces', () => {
  it('sorts by date, newest first, undated last', () => {
    const places = [
      place('undated'),
      place('old', { dateFrom: '2005', dateTo: '2010' }),
      place('new', { dateFrom: '2021-03' }),
      place('only-to', { dateTo: '2015' }),
    ]
    expect(ids(sortPlaces(places, groups, 'date'))).toEqual(['new', 'only-to', 'old', 'undated'])
  })

  it('sorts by group order, then title', () => {
    const places = [place('z', { groupId: 'b' }), place('y'), place('x', { groupId: 'b' }), place('w', { groupId: 'gone' })]
    expect(ids(sortPlaces(places, groups, 'group'))).toEqual(['y', 'x', 'z', 'w'])
  })

  it('sorts by title', () => {
    expect(ids(sortPlaces([place('b'), place('a'), place('c')], groups, 'title'))).toEqual(['a', 'b', 'c'])
  })

  it('does not mutate the input', () => {
    const places = [place('b'), place('a')]
    sortPlaces(places, groups, 'title')
    expect(ids(places)).toEqual(['b', 'a'])
  })
})

describe('filterPlaces', () => {
  const places = [
    place('1', { title: 'First flat', address: 'Copenhagen' }),
    place('2', { title: 'Ramen', address: 'Kyoto', note: 'Best TONKOTSU ever', groupId: 'b' }),
  ]

  it('matches title, address and note case-insensitively', () => {
    expect(ids(filterPlaces(places, 'flat', new Set()))).toEqual(['1'])
    expect(ids(filterPlaces(places, 'kyoto', new Set()))).toEqual(['2'])
    expect(ids(filterPlaces(places, 'tonkotsu', new Set()))).toEqual(['2'])
  })

  it('hides places in hidden groups', () => {
    expect(ids(filterPlaces(places, '', new Set(['b'])))).toEqual(['1'])
  })
})
