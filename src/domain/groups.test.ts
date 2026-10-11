import { describe, expect, it } from 'vitest'
import { createInitialData, OTHER_GROUP_ID } from './defaultGroups'
import { canDeleteGroup, deleteGroup } from './groups'
import type { MapData } from './types'

function data(): MapData {
  return {
    ...createInitialData(),
    places: [
      { id: 'p1', groupId: 'job', title: 'Office', lat: 1, lng: 1, address: '' },
      { id: 'p2', groupId: 'lived', title: 'Home', lat: 2, lng: 2, address: '' },
    ],
  }
}

describe('deleteGroup', () => {
  it('moves the deleted group\'s places to the target group', () => {
    const result = deleteGroup(data(), 'job', OTHER_GROUP_ID)
    expect(result.groups.some((g) => g.id === 'job')).toBe(false)
    expect(result.places).toHaveLength(2)
    expect(result.places.find((p) => p.id === 'p1')?.groupId).toBe(OTHER_GROUP_ID)
    expect(result.places.find((p) => p.id === 'p2')?.groupId).toBe('lived')
  })

  it('can move places to any other existing group', () => {
    expect(deleteGroup(data(), 'job', 'friends').places.find((p) => p.id === 'p1')?.groupId).toBe('friends')
  })

  it('refuses to delete Other', () => {
    expect(canDeleteGroup(OTHER_GROUP_ID)).toBe(false)
    expect(() => deleteGroup(data(), OTHER_GROUP_ID, 'lived')).toThrow()
  })

  it('refuses invalid targets', () => {
    expect(() => deleteGroup(data(), 'job', 'job')).toThrow()
    expect(() => deleteGroup(data(), 'job', 'nope')).toThrow()
  })
})
