/** [south, north, west, east], as Nominatim orders its bounding boxes. */
export type Bounds = [number, number, number, number]

/** GeoJSON position: [lng, lat]. */
type Position = [number, number]

/** GeoJSON geometry as Nominatim returns it; only multipolygons are looked into. */
export type Geometry = { type: 'MultiPolygon'; coordinates: Position[][][] } | { type: string }

/** Boxes wider or taller than this (degrees) are checked for far-flung parts. */
const WIDE = 20

/**
 * The part of a search result worth zooming to. A country's box can span the globe because
 * of overseas territories (France) or islands across the antimeridian (USA, New Zealand); then
 * this picks the part around Nominatim's point for the place, e.g. mainland France.
 */
export function mainBounds(bounds: Bounds, geometry: Geometry | undefined, lat: number, lng: number): Bounds {
  const [south, north, west, east] = bounds
  if (north - south <= WIDE && east - west <= WIDE) return bounds
  if (geometry?.type !== 'MultiPolygon' || !('coordinates' in geometry)) return bounds
  const parts = geometry.coordinates.map((polygon) => ringBounds(polygon[0] ?? [])).filter((b) => b !== undefined)
  const containing = parts.filter(([s, n, w, e]) => lat >= s && lat <= n && lng >= w && lng <= e)
  const candidates = containing.length > 0 ? containing : parts
  if (candidates.length === 0) return bounds
  return candidates.reduce((a, b) => (area(b) > area(a) ? b : a))
}

/** Bounds of a ring of [lng, lat] positions. */
function ringBounds(ring: Position[]): Bounds | undefined {
  if (ring.length === 0) return undefined
  let [south, north, west, east] = [Infinity, -Infinity, Infinity, -Infinity]
  for (const [lng, lat] of ring) {
    south = Math.min(south, lat)
    north = Math.max(north, lat)
    west = Math.min(west, lng)
    east = Math.max(east, lng)
  }
  return [south, north, west, east]
}

const area = ([s, n, w, e]: Bounds) => (n - s) * (e - w)
