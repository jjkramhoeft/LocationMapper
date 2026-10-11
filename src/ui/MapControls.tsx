import { Layers, Maximize } from 'lucide-react'
import { BASEMAPS, GOOGLE_BASEMAPS } from '../map/basemaps'

interface MapControlsProps {
  basemapId: string
  showGoogle: boolean
  /** Shown when the chosen basemap can't be loaded and a fallback is in use. */
  basemapNotice?: string
  onBasemapChange(id: string): void
  onFitAll(): void
}

export function MapControls({ basemapId, showGoogle, basemapNotice, onBasemapChange, onFitAll }: MapControlsProps) {
  return (
    <div className="map-controls">
      <label className="map-control basemap-select" title="Background map">
        <Layers size={16} aria-hidden="true" />
        <select value={basemapId} onChange={(e) => onBasemapChange(e.target.value)} aria-label="Background map">
          {BASEMAPS.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
          {showGoogle &&
            GOOGLE_BASEMAPS.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
        </select>
      </label>
      {basemapNotice && <div className="map-control map-notice">{basemapNotice}</div>}
      <button type="button" className="map-control map-button" onClick={onFitAll} title="Zoom to all visible places">
        <Maximize size={16} aria-hidden="true" /> Fit all
      </button>
    </div>
  )
}
