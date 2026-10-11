import { describe, expect, it } from 'vitest'
import { FALLBACK_COLOR } from './defaultGroups'
import { isHexColor, resolvePinStyle } from './style'
import type { Group } from './types'

const group: Group = { id: 'g', name: 'G', color: '#2563eb', icon: 'house' }

describe('resolvePinStyle', () => {
  it('inherits color and icon from the group', () => {
    expect(resolvePinStyle({}, group)).toEqual({ color: '#2563eb', icon: 'house' })
  })

  it('lets the place override each one independently', () => {
    expect(resolvePinStyle({ color: '#ff0000' }, group)).toEqual({ color: '#ff0000', icon: 'house' })
    expect(resolvePinStyle({ icon: 'plane' }, group)).toEqual({ color: '#2563eb', icon: 'plane' })
  })

  it('falls back when the group is missing', () => {
    expect(resolvePinStyle({}, undefined)).toEqual({ color: FALLBACK_COLOR, icon: 'map-pin' })
  })
})

describe('isHexColor', () => {
  it('accepts only #rrggbb', () => {
    expect(isHexColor('#A1b2C3')).toBe(true)
    expect(isHexColor('#abc')).toBe(false)
    expect(isHexColor('red')).toBe(false)
    expect(isHexColor(undefined)).toBe(false)
  })
})
