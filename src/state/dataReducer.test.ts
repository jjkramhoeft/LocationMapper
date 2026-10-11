import { describe, expect, it } from 'vitest'
import { createInitialData } from '../domain/defaultGroups'
import type { MapData, Place } from '../domain/types'
import { dataReducer } from './dataReducer'

const place = (id: string, title = id): Place => ({ id, groupId: 'lived', title, lat: 0, lng: 0, address: '' })

function withPlaces(...places: Place[]): MapData {
  return { ...createInitialData(), places }
}

describe('dataReducer', () => {
  it('adds new places and updates existing ones in place', () => {
    let state = dataReducer(withPlaces(place('a'), place('b')), { type: 'savePlace', place: place('c') })
    state = dataReducer(state, { type: 'savePlace', place: place('a', 'renamed') })
    expect(state.places.map((p) => p.title)).toEqual(['renamed', 'b', 'c'])
  })

  it('restores a deleted place at its old position', () => {
    const initial = withPlaces(place('a'), place('b'), place('c'))
    const deleted = dataReducer(initial, { type: 'deletePlace', id: 'b' })
    expect(deleted.places.map((p) => p.id)).toEqual(['a', 'c'])
    const restored = dataReducer(deleted, { type: 'restorePlace', place: place('b'), index: 1 })
    expect(restored.places.map((p) => p.id)).toEqual(['a', 'b', 'c'])
  })

  it('does not restore a place twice', () => {
    const state = withPlaces(place('a'))
    expect(dataReducer(state, { type: 'restorePlace', place: place('a'), index: 0 })).toBe(state)
  })

  it('deletes a group by moving its places', () => {
    const state = dataReducer(withPlaces(place('a')), { type: 'deleteGroup', id: 'lived', moveToGroupId: 'other' })
    expect(state.places[0]!.groupId).toBe('other')
    expect(state.groups.some((g) => g.id === 'lived')).toBe(false)
  })
})
