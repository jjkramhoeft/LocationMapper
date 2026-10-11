export interface Basemap {
  id: string
  name: string
  url: string
  attribution: string
  maxZoom: number
  subdomains?: string
}

const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

/** Keyless basemaps. Google is added separately, only when the user supplies an API key. */
export const BASEMAPS: readonly Basemap[] = [
  {
    id: 'osm',
    name: 'OpenStreetMap',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: OSM_ATTRIBUTION,
    maxZoom: 19,
  },
  // CARTO's light/dark basemaps now require an API key, so Esri's keyless canvas maps fill that role.
  {
    id: 'esri-light-gray',
    name: 'Light gray (Esri)',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Esri, HERE, Garmin, &copy; OpenStreetMap contributors, and the GIS User Community',
    maxZoom: 16,
  },
  {
    id: 'esri-dark-gray',
    name: 'Dark gray (Esri)',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Esri, HERE, Garmin, &copy; OpenStreetMap contributors, and the GIS User Community',
    maxZoom: 16,
  },
  {
    id: 'esri-imagery',
    name: 'Satellite (Esri)',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution:
      'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    maxZoom: 19,
  },
  {
    id: 'opentopomap',
    name: 'OpenTopoMap',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: `${OSM_ATTRIBUTION}, SRTM | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)`,
    subdomains: 'abc',
    maxZoom: 17,
  },
]

export const DEFAULT_BASEMAP_ID = 'osm'

export type GoogleMapType = 'roadmap' | 'satellite'

/** Google layers via the Map Tiles API; only offered when an API key is set. */
export const GOOGLE_BASEMAPS: readonly { id: string; name: string; mapType: GoogleMapType }[] = [
  { id: 'google-roadmap', name: 'Google', mapType: 'roadmap' },
  { id: 'google-satellite', name: 'Google satellite', mapType: 'satellite' },
]
