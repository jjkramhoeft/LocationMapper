import { LayersControl, MapContainer, TileLayer } from 'react-leaflet'
import { BASEMAPS, DEFAULT_BASEMAP_ID } from './basemaps'

/** First-run view: the whole world. */
const WORLD_CENTER: [number, number] = [20, 0]
const WORLD_ZOOM = 2

export function MapView() {
  return (
    <MapContainer
      center={WORLD_CENTER}
      zoom={WORLD_ZOOM}
      minZoom={2}
      worldCopyJump
      className="map"
    >
      <LayersControl position="topright">
        {BASEMAPS.map((b) => (
          <LayersControl.BaseLayer key={b.id} name={b.name} checked={b.id === DEFAULT_BASEMAP_ID}>
            <TileLayer
              url={b.url}
              attribution={b.attribution}
              maxZoom={b.maxZoom}
              {...(b.subdomains ? { subdomains: b.subdomains } : {})}
            />
          </LayersControl.BaseLayer>
        ))}
      </LayersControl>
    </MapContainer>
  )
}
