import { localityName, shortAddress, type NominatimAddress } from './address'
import { mainBounds, type Bounds, type Geometry } from './bounds'

const BASE_URL = 'https://nominatim.openstreetmap.org'

// Nominatim usage policy: at most 1 request per second, no search-as-you-type.
const MIN_INTERVAL_MS = 1100
let nextSlot = 0

async function throttledFetch(url: string): Promise<Response> {
  const now = Date.now()
  const wait = Math.max(0, nextSlot - now)
  nextSlot = Math.max(now, nextSlot) + MIN_INTERVAL_MS
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait))
  const response = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error(`Address lookup failed (${response.status})`)
  return response
}

function params(extra: Record<string, string>): string {
  return new URLSearchParams({
    format: 'jsonv2',
    addressdetails: '1',
    'accept-language': navigator.language,
    ...extra,
  }).toString()
}

export interface AddressLookup {
  /** "City, Country" */
  address: string
  /** Best guess at a short name for the place, e.g. the city. */
  name?: string
}

interface ReverseResponse {
  error?: string
  address?: NominatimAddress
}

/** Returns null where there is no address, e.g. in the middle of the ocean. */
export async function reverseGeocode(lat: number, lng: number): Promise<AddressLookup | null> {
  const response = await throttledFetch(`${BASE_URL}/reverse?${params({ lat: String(lat), lon: String(lng), zoom: '14' })}`)
  const body = (await response.json()) as ReverseResponse
  if (body.error || !body.address) return null
  return { address: shortAddress(body.address), name: localityName(body.address) ?? body.address.country }
}

export interface SearchResult extends AddressLookup {
  id: number
  /** Nominatim's full description, shown in the result list. */
  displayName: string
  lat: number
  lng: number
  /** The area to zoom to; for countries with overseas parts, just the main part. */
  bounds?: Bounds
}

interface SearchResponseItem {
  place_id: number
  lat: string
  lon: string
  name?: string
  display_name: string
  boundingbox?: [string, string, string, string]
  address?: NominatimAddress
  geojson?: Geometry
}

export async function searchAddress(query: string): Promise<SearchResult[]> {
  // Outlines, coarsely simplified (~10 km), only to find a country's main part; see mainBounds.
  const search = params({ q: query, limit: '5', polygon_geojson: '1', polygon_threshold: '0.1' })
  const response = await throttledFetch(`${BASE_URL}/search?${search}`)
  const items = (await response.json()) as SearchResponseItem[]
  return items.map((item) => {
    const lat = Number(item.lat)
    const lng = Number(item.lon)
    const box = item.boundingbox?.map(Number) as Bounds | undefined
    return {
      id: item.place_id,
      displayName: item.display_name,
      lat,
      lng,
      address: item.address ? shortAddress(item.address) || item.display_name : item.display_name,
      name: item.name || (item.address ? localityName(item.address) : undefined),
      bounds: box && mainBounds(box, item.geojson, lat, lng),
    }
  })
}
