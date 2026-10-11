import { describe, expect, it } from 'vitest'
import { mainBounds, type Bounds, type Geometry } from './bounds'

/** A rectangular polygon (outer ring only) covering the given bounds. */
const box = ([s, n, w, e]: Bounds): [number, number][][] => [
  [
    [w, s],
    [e, s],
    [e, n],
    [w, n],
    [w, s],
  ],
]

describe('mainBounds', () => {
  it('keeps ordinary boxes as they are', () => {
    const bounds: Bounds = [54.5, 57.8, 8, 15.2]
    expect(mainBounds(bounds, undefined, 56, 10)).toBe(bounds)
  })

  it('picks the part around the point when overseas parts make the box huge', () => {
    const mainland: Bounds = [42.3, 51.1, -4.8, 8.2]
    const geometry: Geometry = {
      type: 'MultiPolygon',
      coordinates: [box([-14.6, -14, -178.4, -177.8]), box(mainland), box([2.1, 5.8, -54.6, -51.6])],
    }
    expect(mainBounds([-50.2, 51.3, -178.4, 172.3], geometry, 46.6, 1.9)).toEqual(mainland)
  })

  it('prefers the largest containing part, else the largest part', () => {
    const big: Bounds = [24, 49, -125, -66]
    const small: Bounds = [38, 40, -101, -99]
    const geometry: Geometry = { type: 'MultiPolygon', coordinates: [box(small), box(big), box([51, 71, -180, -130])] }
    expect(mainBounds([-14.8, 71.6, -180, 180], geometry, 39, -100)).toEqual(big)
    expect(mainBounds([-14.8, 71.6, -180, 180], geometry, 0, 0)).toEqual(big)
  })

  it('falls back to the box without usable geometry', () => {
    const bounds: Bounds = [-50, 50, -170, 170]
    expect(mainBounds(bounds, { type: 'Polygon' }, 0, 0)).toBe(bounds)
    expect(mainBounds(bounds, { type: 'MultiPolygon', coordinates: [] }, 0, 0)).toBe(bounds)
  })
})
