import L from 'leaflet'
import { useCallback, useEffect, useImperativeHandle, useRef, type Ref } from 'react'
import { MapContainer, Marker, Popup, TileLayer, Tooltip, useMap, useMapEvents, type MarkerProps } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import { resolvePinStyle } from '../domain/style'
import type { Group, Place } from '../domain/types'
import type { MapView as SavedView } from '../state/storage'
import { PlacePopup } from '../ui/PlacePopup'
import type { Basemap } from './basemaps'
import { clusterIcon, pinIcon, searchHitIcon, type PinMarkerOptions } from './pinIcon'

/** First-run view: the whole world. */
const WORLD_CENTER: [number, number] = [20, 0]
const WORLD_ZOOM = 2

/** Space kept between an opened popup and the top of the map; more than PopupEdgeCloser's margin. */
const POPUP_MARGIN = 16
/** A popup is never squeezed below this height (px) to fit; it scrolls instead. */
const MIN_POPUP_HEIGHT = 120

/** Map center that puts `latlng` in the middle of the area not covered by the bottom sheet (`inset`). */
function centerFor(map: L.Map, latlng: L.LatLngExpression, zoom: number, inset: number): L.LatLng {
  return map.unproject(map.project(latlng, zoom).add([0, inset / 2]), zoom)
}

/** Leaflet's (private) handler that opens a bound popup on click or Enter. */
interface PopupHandler {
  _openPopup(e: L.LeafletEvent): void
}

export interface MapApi {
  /** Zooms to a place (uncluttering its cluster) and opens its popup. */
  focusPlace(id: string): void
  /** Zooms to fit all visible places. */
  fitAll(): void
  /** Shows a search result: its bounds if known, else the point. */
  showLocation(lat: number, lng: number, bounds?: [number, number, number, number]): void
  /** Pans (without zooming) so the point is visible, if it isn't already. */
  reveal(lat: number, lng: number): void
}

/** Where an address search landed; marked on the map until the search is cleared. */
export interface SearchHit {
  lat: number
  lng: number
  label: string
}

interface MapViewProps {
  ref?: Ref<MapApi>
  basemap: Basemap
  /** Pixels at the bottom of the map covered by other UI (the phone bottom sheet). */
  bottomInset: number
  /** Places in visible groups. */
  places: readonly Place[]
  groupsById: ReadonlyMap<string, Group>
  /** The place being edited (new or existing); shown as a draggable pin. */
  draft?: Place
  searchHit?: SearchHit
  adding: boolean
  initialView?: SavedView
  onMapClick(lat: number, lng: number): void
  onDraftMove(lat: number, lng: number): void
  onViewChange(view: SavedView): void
  onEdit(id: string): void
  onDelete(id: string): void
}

export function MapView({
  ref,
  basemap,
  bottomInset,
  places,
  groupsById,
  draft,
  searchHit,
  adding,
  initialView,
  onMapClick,
  onDraftMove,
  onViewChange,
  onEdit,
  onDelete,
}: MapViewProps) {
  const mapRef = useRef<L.Map>(null)
  const clusterRef = useRef<L.MarkerClusterGroup>(null)
  const markers = useRef(new Map<string, L.Marker>())
  // Read at call time, so callers right after a data change see the new places.
  const placesRef = useRef(places)
  placesRef.current = places
  const insetRef = useRef(bottomInset)
  insetRef.current = bottomInset
  /** The marker whose popup opens once the current pan ends. */
  const pendingOpen = useRef<L.Marker | null>(null)

  /** Pans the marker to the center of the map, then opens its popup. */
  const centerThenOpen = useCallback((marker: L.Marker) => {
    const map = mapRef.current
    if (!map) return
    map.closePopup()
    pendingOpen.current = marker
    const open = () => {
      if (pendingOpen.current !== marker) return
      pendingOpen.current = null
      marker.openPopup()
    }
    const target = centerFor(map, marker.getLatLng(), map.getZoom(), insetRef.current)
    if (map.latLngToContainerPoint(target).distanceTo(map.getSize().divideBy(2)) < 2) {
      open()
    } else {
      map.once('moveend', open)
      map.panTo(target, { duration: 0.35 })
    }
  }, [])

  /**
   * Fits an opened popup into the room above its pin by letting its content scroll, instead of
   * Leaflet's auto-pan moving the map again after the pin was centered.
   */
  const fitPopup = useCallback((popup: L.Popup | undefined) => {
    const map = mapRef.current
    const element = popup?.getElement()
    const content = element?.querySelector<HTMLElement>('.leaflet-popup-content')
    if (!map || !popup || !element || !content) return
    popup.options.maxHeight = undefined
    popup.update()
    const overflow = map.getContainer().getBoundingClientRect().top + POPUP_MARGIN - element.getBoundingClientRect().top
    if (overflow <= 0) return
    popup.options.maxHeight = Math.max(MIN_POPUP_HEIGHT, content.offsetHeight - overflow)
    popup.update()
  }, [])

  useImperativeHandle(ref, () => {
    const padding = (): L.FitBoundsOptions => ({
      paddingTopLeft: [48, 48],
      paddingBottomRight: [48, 48 + insetRef.current],
    })
    return {
      focusPlace(id) {
        const map = mapRef.current
        const marker = markers.current.get(id)
        if (!map || !marker) return
        const reveal = () => {
          if (clusterRef.current?.hasLayer(marker)) clusterRef.current.zoomToShowLayer(marker, () => marker.openPopup())
          else marker.openPopup()
        }
        map.closePopup()
        map.once('moveend', reveal)
        const zoom = Math.max(map.getZoom(), 10)
        map.flyTo(centerFor(map, marker.getLatLng(), zoom, insetRef.current), zoom, { duration: 0.8 })
      },
      fitAll() {
        const map = mapRef.current
        const current = placesRef.current
        if (!map) return
        if (current.length === 0) map.flyTo(WORLD_CENTER, WORLD_ZOOM)
        else map.flyToBounds(L.latLngBounds(current.map((p) => [p.lat, p.lng])), { ...padding(), maxZoom: 12 })
      },
      showLocation(lat, lng, bounds) {
        const map = mapRef.current
        if (!map) return
        // Leaflet scales flight time with distance; across the globe that's 10+ seconds.
        const duration = 1.5
        if (bounds) {
          const [south, north, west, east] = bounds
          map.flyToBounds([[south, west], [north, east]], { ...padding(), maxZoom: 15, duration })
        } else {
          map.flyTo(centerFor(map, [lat, lng], 14, insetRef.current), 14, { duration })
        }
      },
      reveal(lat, lng) {
        const map = mapRef.current
        if (!map) return
        const size = map.getSize()
        const point = map.latLngToContainerPoint([lat, lng])
        const visible = point.x > 24 && point.x < size.x - 24 && point.y > 48 && point.y < size.y - insetRef.current - 24
        if (!visible) map.panTo(centerFor(map, [lat, lng], map.getZoom(), insetRef.current))
      },
    }
  }, [])

  return (
    <MapContainer
      ref={mapRef}
      center={initialView ? [initialView.lat, initialView.lng] : WORLD_CENTER}
      zoom={initialView?.zoom ?? WORLD_ZOOM}
      // Zoom 0 lets "Fit all" show pins spread across the globe even on a phone.
      minZoom={0}
      worldCopyJump
      className={adding ? 'map adding' : 'map'}
    >
      <TileLayer
        key={basemap.id + basemap.url}
        url={basemap.url}
        attribution={basemap.attribution}
        maxZoom={basemap.maxZoom}
        {...(basemap.subdomains ? { subdomains: basemap.subdomains } : {})}
      />
      <MapEvents adding={adding} onMapClick={onMapClick} onViewChange={onViewChange} />
      <ResizeWatcher />
      <PopupEdgeCloser bottomInset={bottomInset} />
      <MarkerClusterGroup
        ref={clusterRef}
        iconCreateFunction={clusterIcon}
        showCoverageOnHover={false}
        maxClusterRadius={45}
        spiderfyOnMaxZoom
      >
        {places
          .filter((p) => p.id !== draft?.id)
          .map((place) => {
            const group = groupsById.get(place.groupId)
            const style = resolvePinStyle(place, group)
            const options: PinMarkerOptions = { pinColor: style.color }
            return (
              <Marker
                // Re-mount on color change so cluster rings pick up the new color.
                key={`${place.id}|${style.color}`}
                position={[place.lat, place.lng]}
                icon={pinIcon(style.color, style.icon)}
                title={place.title}
                {...(options as Partial<MarkerProps>)}
                ref={(marker) => {
                  if (!marker) {
                    markers.current.delete(place.id)
                    return
                  }
                  markers.current.set(place.id, marker)
                  // Replace Leaflet's open-on-click before <Popup> binds it (refs attach before effects),
                  // so a click centers the pin first. Same toggle as Leaflet: a second click closes.
                  if (!Object.hasOwn(marker, '_openPopup')) {
                    ;(marker as unknown as PopupHandler)._openPopup = (e) => {
                      L.DomEvent.stop(e as unknown as Event) // Don't let the click reach the map (Add mode).
                      if (marker.isPopupOpen()) marker.closePopup()
                      else centerThenOpen(marker)
                    }
                  }
                }}
              >
                <Popup minWidth={220} maxWidth={300} autoPan={false}>
                  <PlacePopup
                    place={place}
                    group={group}
                    onShown={() => fitPopup(markers.current.get(place.id)?.getPopup())}
                    onEdit={() => {
                      mapRef.current?.closePopup()
                      onEdit(place.id)
                    }}
                    onDelete={() => {
                      mapRef.current?.closePopup()
                      onDelete(place.id)
                    }}
                  />
                </Popup>
              </Marker>
            )
          })}
      </MarkerClusterGroup>
      {searchHit && (
        <Marker
          key={`${searchHit.lat},${searchHit.lng}`}
          position={[searchHit.lat, searchHit.lng]}
          icon={searchHitIcon}
          interactive={false}
          keyboard={false}
          zIndexOffset={500}
        >
          <Tooltip permanent direction="right" offset={[12, 0]} className="search-hit-label">
            {searchHit.label}
          </Tooltip>
        </Marker>
      )}
      {draft && <DraftMarker draft={draft} group={groupsById.get(draft.groupId)} onMove={onDraftMove} />}
    </MapContainer>
  )
}

function DraftMarker({ draft, group, onMove }: { draft: Place; group?: Group; onMove(lat: number, lng: number): void }) {
  const style = resolvePinStyle(draft, group)
  return (
    <Marker
      position={[draft.lat, draft.lng]}
      icon={pinIcon(style.color, style.icon, true)}
      draggable
      zIndexOffset={1000}
      title="Drag to move"
      eventHandlers={{
        dragend: (e) => {
          const { lat, lng } = (e.target as L.Marker).getLatLng().wrap()
          onMove(lat, lng)
        },
      }}
    />
  )
}

/** How close (px) an open popup may come to the map's edge while panning before it closes. */
const EDGE_MARGIN = 8

/**
 * While the map is panned, closes the open popup once it reaches the edge of the map, instead of
 * letting it slide out of view. A popup that doesn't fit when opened is left alone until it has fit.
 */
function PopupEdgeCloser({ bottomInset }: { bottomInset: number }) {
  const insetRef = useRef(bottomInset)
  insetRef.current = bottomInset
  const popupRef = useRef<L.Popup | null>(null)
  const hasFit = useRef(false)

  const check = () => {
    const box = popupRef.current?.getElement()?.getBoundingClientRect()
    if (!box) return
    const frame = map.getContainer().getBoundingClientRect()
    const inside =
      box.left >= frame.left + EDGE_MARGIN &&
      box.right <= frame.right - EDGE_MARGIN &&
      box.top >= frame.top + EDGE_MARGIN &&
      box.bottom <= frame.bottom - insetRef.current - EDGE_MARGIN
    if (inside) hasFit.current = true
    else if (hasFit.current) map.closePopup()
  }

  const map = useMapEvents({
    popupopen(e) {
      popupRef.current = e.popup
      hasFit.current = false
    },
    popupclose(e) {
      if (popupRef.current === e.popup) popupRef.current = null
    },
    move: check,
    moveend: check,
  })
  return null
}

/**
 * Leaflet only reacts to window resizes; this also catches layout changes such as the
 * sidebar being hidden in display mode.
 */
function ResizeWatcher() {
  const map = useMap()
  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize())
    observer.observe(map.getContainer())
    return () => observer.disconnect()
  }, [map])
  return null
}

function MapEvents({
  adding,
  onMapClick,
  onViewChange,
}: {
  adding: boolean
  onMapClick(lat: number, lng: number): void
  onViewChange(view: SavedView): void
}) {
  const map = useMapEvents({
    click(e) {
      if (!adding) return
      const { lat, lng } = e.latlng.wrap()
      onMapClick(lat, lng)
    },
    moveend() {
      const { lat, lng } = map.getCenter().wrap()
      onViewChange({ lat, lng, zoom: map.getZoom() })
    },
  })
  return null
}
