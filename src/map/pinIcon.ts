import L from 'leaflet'
import type { IconName } from '../domain/icons'
import { iconSymbolId } from '../ui/IconSprite'

/** References the icon in <IconSprite>, which must be rendered on the page. */
function iconSvg(name: IconName): string {
  return `<svg viewBox="0 0 24 24" width="15" height="15"><use href="#${iconSymbolId(name)}"/></svg>`
}

const TEARDROP =
  'M16 1C7.7 1 1 7.6 1 15.8c0 10.6 12.9 23.6 14 24.6a1.4 1.4 0 0 0 2 0c1.1-1 14-14 14-24.6C31 7.6 24.3 1 16 1z'

const iconCache = new Map<string, L.DivIcon>()

/** Teardrop marker in `color` with a white Lucide icon inside. `editing` adds a pulsing halo. */
export function pinIcon(color: string, icon: IconName, editing = false): L.DivIcon {
  const key = `${color}|${icon}|${editing}`
  let divIcon = iconCache.get(key)
  if (!divIcon) {
    divIcon = L.divIcon({
      className: editing ? 'pin pin-editing' : 'pin',
      html:
        `<svg class="pin-shape" viewBox="0 0 32 42" width="32" height="42" aria-hidden="true">` +
        `<path d="${TEARDROP}" fill="${color}" stroke="white" stroke-width="2"/></svg>` +
        `<span class="pin-glyph">${iconSvg(icon)}</span>`,
      iconSize: [32, 42],
      iconAnchor: [16, 41],
      popupAnchor: [0, -38],
    })
    iconCache.set(key, divIcon)
  }
  return divIcon
}

/** Target marker for an address search result: a ring around a dot, unlike any place pin. */
export const searchHitIcon = L.divIcon({
  className: 'search-hit',
  html: '<span class="search-hit-ring"></span><span class="search-hit-dot"></span>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
})

/** Marker option carrying the pin color, so cluster icons can show the mix of colors inside. */
export interface PinMarkerOptions extends L.MarkerOptions {
  pinColor?: string
}

/** Cluster bubble with a ring split by the colors of the pins it contains. */
export function clusterIcon(cluster: L.MarkerCluster): L.DivIcon {
  const markers = cluster.getAllChildMarkers()
  const counts = new Map<string, number>()
  for (const m of markers) {
    const color = (m.options as PinMarkerOptions).pinColor ?? '#6b7280'
    counts.set(color, (counts.get(color) ?? 0) + 1)
  }
  let start = 0
  const stops = [...counts].map(([color, n]) => {
    const end = start + (n / markers.length) * 360
    const stop = `${color} ${start}deg ${end}deg`
    start = end
    return stop
  })
  const size = markers.length < 10 ? 36 : markers.length < 100 ? 42 : 48
  return L.divIcon({
    className: 'cluster',
    html: `<div class="cluster-ring" style="background: conic-gradient(${stops.join(', ')})"><span>${markers.length}</span></div>`,
    iconSize: [size, size],
  })
}
