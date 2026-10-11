/** The subset of Nominatim's `address` object we use. */
export interface NominatimAddress {
  city?: string
  town?: string
  village?: string
  hamlet?: string
  municipality?: string
  county?: string
  state?: string
  country?: string
}

/** The most specific settlement name available, e.g. "Copenhagen". */
export function localityName(address: NominatimAddress): string | undefined {
  return (
    address.city ??
    address.town ??
    address.village ??
    address.hamlet ??
    address.municipality ??
    address.county ??
    address.state
  )
}

/** "City, Country", or whichever of the two is known. */
export function shortAddress(address: NominatimAddress): string {
  return [localityName(address), address.country].filter(Boolean).join(', ')
}
