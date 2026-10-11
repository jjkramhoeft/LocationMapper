import { describe, expect, it } from 'vitest'
import { DEFAULT_GROUPS, OTHER_GROUP_ID } from './defaultGroups'

describe('DEFAULT_GROUPS', () => {
  it('includes the undeletable Other group', () => {
    expect(DEFAULT_GROUPS.some((g) => g.id === OTHER_GROUP_ID)).toBe(true)
  })

  it('has unique ids', () => {
    const ids = DEFAULT_GROUPS.map((g) => g.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
