import { ChevronDown, ChevronUp, MapPinned, Plus, Settings as SettingsIcon, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useReducer, useRef, useState, type RefObject } from 'react'
import { OTHER_GROUP_ID } from './domain/defaultGroups'
import { canDeleteGroup } from './domain/groups'
import { filterPlaces, sortPlaces } from './domain/places'
import { cleanPlace } from './domain/placeDraft'
import type { Group, MapData, Place } from './domain/types'
import { parseMapDataJson, type ImportResult } from './domain/validate'
import { reverseGeocode, type SearchResult } from './geo/nominatim'
import { BASEMAPS, DEFAULT_BASEMAP_ID, GOOGLE_BASEMAPS, type Basemap } from './map/basemaps'
import { useGoogleTiles } from './map/google'
import { MapView, type MapApi, type SearchHit } from './map/MapView'
import { dataReducer } from './state/dataReducer'
import { loadData, loadSettings, saveData, saveSettings, type Settings } from './state/storage'
import { AddressSearch } from './ui/AddressSearch'
import { DataMenu } from './ui/DataMenu'
import { DisplayExit } from './ui/DisplayExit'
import { GroupForm } from './ui/GroupForm'
import { GroupList } from './ui/GroupList'
import { IconSprite } from './ui/IconSprite'
import { MapControls } from './ui/MapControls'
import { Modal } from './ui/Modal'
import { PlaceForm } from './ui/PlaceForm'
import { PlaceList } from './ui/PlaceList'
import { SettingsDialog } from './ui/SettingsDialog'
import { Toast, type ToastState } from './ui/Toast'

type Panel =
  | { kind: 'browse' }
  | { kind: 'adding' }
  | { kind: 'editPlace'; draft: Place; isNew: boolean; lookingUpAddress: boolean }
  | { kind: 'editGroup'; group: Group; isNew: boolean }

type Dialog =
  | { kind: 'confirmImport'; result: Extract<ImportResult, { ok: true }>; source: string }
  | { kind: 'importError'; message: string; source: string }
  | { kind: 'deleteGroup'; group: Group }
  | { kind: 'settings' }

const MAX_WARNINGS_SHOWN = 8

/** Matches the CSS breakpoint where the sidebar becomes a bottom sheet. */
const PHONE_QUERY = '(max-width: 720px)'

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const onChange = () => setMatches(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [query])
  return matches
}

function useElementHeight(ref: RefObject<HTMLElement | null>): number {
  const [height, setHeight] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver(() => setHeight(el.offsetHeight))
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref])
  return height
}

/** "1 place", "3 places" */
const count = (n: number, noun: string) => `${n} ${noun}${n === 1 ? '' : 's'}`

export function App() {
  const [data, dispatch] = useReducer(dataReducer, undefined, loadData)
  const [settings, setSettings] = useState(loadSettings)
  const [panel, setPanel] = useState<Panel>({ kind: 'browse' })
  const [dialog, setDialog] = useState<Dialog | null>(null)
  const [toast, setToast] = useState<ToastState | null>(null)
  const [query, setQuery] = useState('')
  const [sheetOpen, setSheetOpen] = useState(true)
  const [searchHit, setSearchHit] = useState<SearchHit>()
  // `?display` in the URL starts in display mode, e.g. for a bookmarked wall display.
  const [displayMode, setDisplayMode] = useState(() => new URLSearchParams(window.location.search).has('display'))
  const mapApi = useRef<MapApi>(null)
  const isPhone = useMediaQuery(PHONE_QUERY)
  const sidebarRef = useRef<HTMLElement>(null)
  const sheetHeight = useElementHeight(sidebarRef)
  // Initial view is read once; later view changes are only saved, not fed back into the map.
  const [initialView] = useState(settings.view)

  useEffect(() => saveData(data), [data])
  useEffect(() => saveSettings(settings), [settings])

  const updateSettings = useCallback((patch: Partial<Settings>) => setSettings((s) => ({ ...s, ...patch })), [])
  const showToast = useCallback((t: Omit<ToastState, 'id'>) => setToast({ ...t, id: Date.now() }), [])
  const dismissToast = useCallback(() => setToast(null), [])

  const groupsById = useMemo(() => new Map(data.groups.map((g) => [g.id, g])), [data.groups])
  const hiddenGroupIds = useMemo(() => new Set(settings.hiddenGroupIds), [settings.hiddenGroupIds])
  const counts = useMemo(() => {
    const m = new Map<string, number>()
    for (const p of data.places) m.set(p.groupId, (m.get(p.groupId) ?? 0) + 1)
    return m
  }, [data.places])
  const mapPlaces = useMemo(() => filterPlaces(data.places, '', hiddenGroupIds), [data.places, hiddenGroupIds])
  const listPlaces = useMemo(
    () => sortPlaces(filterPlaces(data.places, query, hiddenGroupIds), data.groups, settings.sortMode),
    [data.places, data.groups, query, hiddenGroupIds, settings.sortMode],
  )

  // --- Background map ---------------------------------------------------------
  const googleChoice = GOOGLE_BASEMAPS.find((b) => b.id === settings.basemapId)
  const googleTiles = useGoogleTiles(settings.googleApiKey, googleChoice?.mapType)
  const fallbackBasemap = BASEMAPS.find((b) => b.id === DEFAULT_BASEMAP_ID)!
  let basemap: Basemap = BASEMAPS.find((b) => b.id === settings.basemapId) ?? fallbackBasemap
  let basemapNotice: string | undefined
  if (googleChoice) {
    if (!settings.googleApiKey) basemapNotice = 'Google needs an API key (Settings)'
    else if (googleTiles?.status === 'ready') {
      basemap = {
        id: googleChoice.id,
        name: googleChoice.name,
        url: googleTiles.url,
        attribution: `Map data &copy;${new Date().getFullYear()} Google`,
        maxZoom: 21,
      }
    } else if (googleTiles?.status === 'error') basemapNotice = `Google: ${googleTiles.message}`
  }

  // --- Places -----------------------------------------------------------------
  /** Opens the form for a new place at the given position; looks up the address unless it's known. */
  function startDraft(lat: number, lng: number, known?: { address: string; name?: string }) {
    const draft: Place = {
      id: crypto.randomUUID(),
      groupId: data.groups[0]?.id ?? OTHER_GROUP_ID,
      title: known?.name ?? '',
      lat,
      lng,
      address: known?.address ?? '',
    }
    setPanel({ kind: 'editPlace', draft, isNew: true, lookingUpAddress: !known })
    setSheetOpen(true)
    if (!known) lookupAddress(draft.id, lat, lng, false)
    // On phones the form opens over the map; keep the new pin in view once the sheet has expanded.
    setTimeout(() => mapApi.current?.reveal(lat, lng), 250)
  }

  /** Fills address (and, for new places, an empty title) from the pin position. */
  function lookupAddress(draftId: string, lat: number, lng: number, overwriteAddress: boolean) {
    setPanel((p) => (p.kind === 'editPlace' && p.draft.id === draftId ? { ...p, lookingUpAddress: true } : p))
    reverseGeocode(lat, lng)
      .then((found) => {
        setPanel((p) => {
          if (p.kind !== 'editPlace' || p.draft.id !== draftId) return p
          const draft = { ...p.draft }
          if (found && (overwriteAddress || !draft.address.trim())) draft.address = found.address
          if (!draft.title.trim()) draft.title = found?.name ?? 'New place'
          return { ...p, draft, lookingUpAddress: false }
        })
        if (!found && overwriteAddress) showToast({ message: 'No address found at this position.' })
      })
      .catch((e: unknown) => {
        setPanel((p) => (p.kind === 'editPlace' && p.draft.id === draftId ? { ...p, lookingUpAddress: false } : p))
        showToast({ message: e instanceof Error ? e.message : 'Address lookup failed', tone: 'error' })
      })
  }

  function editPlace(id: string) {
    const place = data.places.find((p) => p.id === id)
    if (!place) return
    setPanel({ kind: 'editPlace', draft: { ...place }, isNew: false, lookingUpAddress: false })
    setSheetOpen(true)
  }

  function deletePlace(id: string) {
    const index = data.places.findIndex((p) => p.id === id)
    const place = data.places[index]
    if (!place) return
    dispatch({ type: 'deletePlace', id })
    setPanel((p) => (p.kind === 'editPlace' && p.draft.id === id ? { kind: 'browse' } : p))
    showToast({
      message: `Deleted “${place.title}”`,
      action: { label: 'Undo', run: () => dispatch({ type: 'restorePlace', place, index }) },
    })
  }

  function savePlace(draft: Place) {
    dispatch({ type: 'savePlace', place: cleanPlace(draft) })
    // A place saved into a hidden group would vanish; show its group again.
    if (hiddenGroupIds.has(draft.groupId)) {
      updateSettings({ hiddenGroupIds: settings.hiddenGroupIds.filter((g) => g !== draft.groupId) })
    }
    setPanel({ kind: 'browse' })
  }

  /**
   * On phones the sheet is collapsed first: Mercator can't shift a world-wide view far enough
   * to fit it above an open sheet. The delay also lets newly imported markers render.
   */
  function fitAll() {
    const collapse = isPhone && sheetOpen
    if (collapse) setSheetOpen(false)
    setTimeout(() => mapApi.current?.fitAll(), collapse ? 250 : 50)
  }

  function selectPlace(id: string) {
    mapApi.current?.focusPlace(id)
    if (isPhone) setSheetOpen(false)
  }

  // --- Address search ---------------------------------------------------------
  /** On phones the sheet is collapsed first, so the result isn't squeezed above it. */
  function showSearchResult(r: SearchResult) {
    setSearchHit({ lat: r.lat, lng: r.lng, label: r.name || r.address })
    const collapse = isPhone && sheetOpen
    if (collapse) setSheetOpen(false)
    setTimeout(() => mapApi.current?.showLocation(r.lat, r.lng, r.bounds), collapse ? 250 : 0)
  }

  function addPlaceAtSearchResult(r: SearchResult) {
    mapApi.current?.showLocation(r.lat, r.lng)
    startDraft(r.lat, r.lng, { address: r.address, name: r.name })
  }

  // --- Groups -----------------------------------------------------------------
  function saveGroup(group: Group) {
    dispatch({ type: 'saveGroup', group })
    setPanel({ kind: 'browse' })
  }

  function confirmDeleteGroup(group: Group, moveToGroupId: string) {
    dispatch({ type: 'deleteGroup', id: group.id, moveToGroupId })
    updateSettings({ hiddenGroupIds: settings.hiddenGroupIds.filter((g) => g !== group.id) })
    setDialog(null)
    setPanel({ kind: 'browse' })
    showToast({ message: `Deleted group “${group.name}”` })
  }

  function toggleGroup(id: string) {
    const hidden = new Set(settings.hiddenGroupIds)
    if (hidden.has(id)) hidden.delete(id)
    else hidden.add(id)
    updateSettings({ hiddenGroupIds: [...hidden] })
  }

  // --- Import / export ----------------------------------------------------------
  function exportData() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `places-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function offerImport(text: string, source: string) {
    const result = parseMapDataJson(text)
    if (result.ok) setDialog({ kind: 'confirmImport', result, source })
    else setDialog({ kind: 'importError', message: result.error, source })
  }

  async function importFile(file: File) {
    offerImport(await file.text(), file.name)
  }

  async function loadSample() {
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}sample-data.json`)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      offerImport(await response.text(), 'sample data')
    } catch (e) {
      showToast({ message: `Could not load sample data: ${e instanceof Error ? e.message : e}`, tone: 'error' })
    }
  }

  function applyImport(imported: MapData, warningCount: number) {
    dispatch({ type: 'replace', data: imported })
    updateSettings({ hiddenGroupIds: [] })
    setPanel({ kind: 'browse' })
    setDialog(null)
    setQuery('')
    showToast({
      message: `Imported ${count(imported.places.length, 'place')}${warningCount ? ` (${count(warningCount, 'problem')} fixed)` : ''}.`,
    })
    fitAll()
  }

  // --- Display mode ----------------------------------------------------------------
  /** Hides everything but the map and pins, and goes fullscreen where the browser allows it. */
  function enterDisplayMode() {
    setPanel({ kind: 'browse' })
    setDialog(null)
    setToast(null)
    setDisplayMode(true)
    document.documentElement.requestFullscreen?.().catch(() => {
      // Not allowed or not supported: display mode still works in the window.
    })
  }

  const exitDisplayMode = useCallback(() => {
    setDisplayMode(false)
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
    const url = new URL(window.location.href)
    if (url.searchParams.has('display')) {
      url.searchParams.delete('display')
      window.history.replaceState(null, '', url)
    }
  }, [])

  useEffect(() => {
    if (!displayMode) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && exitDisplayMode()
    // In fullscreen the browser handles Esc itself and only reports leaving fullscreen.
    const onFullscreenChange = () => !document.fullscreenElement && exitDisplayMode()
    window.addEventListener('keydown', onKey)
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('fullscreenchange', onFullscreenChange)
    }
  }, [displayMode, exitDisplayMode])

  // --- Keyboard -------------------------------------------------------------------
  useEffect(() => {
    if (panel.kind !== 'adding') return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setPanel({ kind: 'browse' })
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [panel.kind])

  const draft = panel.kind === 'editPlace' ? panel.draft : undefined
  const adding = panel.kind === 'adding'

  return (
    <div className={displayMode ? 'app is-display' : 'app'}>
      <IconSprite />
      <aside ref={sidebarRef} className={sheetOpen ? 'sidebar' : 'sidebar is-collapsed'}>
        <header className="sidebar-header">
          <MapPinned size={22} className="brand-icon" aria-hidden="true" />
          <h1 className="brand">Location Tracker Map</h1>
          <span className="spacer" />
          <button
            type="button"
            className={adding ? 'btn btn-primary is-active' : 'btn btn-primary'}
            onClick={() => {
              if (adding) setPanel({ kind: 'browse' })
              else {
                setPanel({ kind: 'adding' })
                if (isPhone) setSheetOpen(false)
              }
            }}
            aria-pressed={adding}
          >
            {adding ? <X size={16} /> : <Plus size={16} />} {adding ? 'Cancel' : 'Add'}
          </button>
          <DataMenu onExport={exportData} onImportFile={importFile} onLoadSample={loadSample} />
          <button
            type="button"
            className="icon-btn"
            title="Settings"
            aria-label="Settings"
            onClick={() => setDialog({ kind: 'settings' })}
          >
            <SettingsIcon size={18} />
          </button>
          <button
            type="button"
            className="icon-btn sheet-toggle"
            aria-label={sheetOpen ? 'Collapse panel' : 'Expand panel'}
            onClick={() => setSheetOpen(!sheetOpen)}
          >
            {sheetOpen ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
          </button>
        </header>

        <div className="sidebar-body">
          {panel.kind === 'editPlace' ? (
            <PlaceForm
              key={panel.draft.id}
              draft={panel.draft}
              isNew={panel.isNew}
              groups={data.groups}
              lookingUpAddress={panel.lookingUpAddress}
              onChange={(patch) =>
                setPanel((p) => (p.kind === 'editPlace' ? { ...p, draft: { ...p.draft, ...patch } } : p))
              }
              onSave={() => savePlace(panel.draft)}
              onCancel={() => setPanel({ kind: 'browse' })}
              onDelete={() => deletePlace(panel.draft.id)}
              onLookupAddress={() => lookupAddress(panel.draft.id, panel.draft.lat, panel.draft.lng, true)}
            />
          ) : panel.kind === 'editGroup' ? (
            <GroupForm
              key={panel.group.id}
              group={panel.group}
              isNew={panel.isNew}
              placeCount={counts.get(panel.group.id) ?? 0}
              onSave={saveGroup}
              onCancel={() => setPanel({ kind: 'browse' })}
              onDelete={() => setDialog({ kind: 'deleteGroup', group: panel.group })}
            />
          ) : (
            <>
              <GroupList
                groups={data.groups}
                counts={counts}
                hiddenGroupIds={hiddenGroupIds}
                onToggle={toggleGroup}
                onShowAll={() => updateSettings({ hiddenGroupIds: [] })}
                onEdit={(id) => {
                  const group = groupsById.get(id)
                  if (group) setPanel({ kind: 'editGroup', group, isNew: false })
                }}
                onAdd={() =>
                  setPanel({
                    kind: 'editGroup',
                    group: { id: crypto.randomUUID(), name: '', color: '#0891b2', icon: 'flag' },
                    isNew: true,
                  })
                }
              />
              <PlaceList
                places={listPlaces}
                totalCount={data.places.length}
                groupsById={groupsById}
                query={query}
                sortMode={settings.sortMode}
                onQueryChange={setQuery}
                onSortChange={(sortMode) => updateSettings({ sortMode })}
                onSelect={selectPlace}
                onLoadSample={loadSample}
              />
            </>
          )}
        </div>
      </aside>

      <main className="map-wrap">
        <MapView
          ref={mapApi}
          basemap={basemap}
          bottomInset={isPhone && !displayMode ? sheetHeight : 0}
          places={mapPlaces}
          groupsById={groupsById}
          draft={draft}
          searchHit={searchHit}
          adding={adding}
          initialView={initialView}
          onMapClick={(lat, lng) => startDraft(lat, lng)}
          onDraftMove={(lat, lng) => setPanel((p) => (p.kind === 'editPlace' ? { ...p, draft: { ...p.draft, lat, lng } } : p))}
          onViewChange={(view) => updateSettings({ view })}
          onEdit={editPlace}
          onDelete={deletePlace}
        />
        <AddressSearch
          onShow={showSearchResult}
          onClear={() => setSearchHit(undefined)}
          onAddHere={panel.kind === 'browse' || panel.kind === 'adding' ? addPlaceAtSearchResult : undefined}
        />
        <MapControls
          basemapId={settings.basemapId}
          showGoogle={Boolean(settings.googleApiKey) || Boolean(googleChoice)}
          basemapNotice={basemapNotice}
          onBasemapChange={(basemapId) => updateSettings({ basemapId })}
          onFitAll={fitAll}
          onDisplayMode={enterDisplayMode}
        />
        {adding && (
          <div className="map-banner" role="status">
            Click the map to place a pin
            <button type="button" className="link-btn" onClick={() => setPanel({ kind: 'browse' })}>
              Cancel (Esc)
            </button>
          </div>
        )}
        {toast && <Toast toast={toast} onDismiss={dismissToast} />}
        {displayMode && <DisplayExit onExit={exitDisplayMode} />}
      </main>

      {dialog?.kind === 'confirmImport' && (
        <Modal
          title="Replace your data?"
          onClose={() => setDialog(null)}
          actions={
            <>
              <span className="spacer" />
              <button type="button" className="btn" onClick={() => setDialog(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => applyImport(dialog.result.data, dialog.result.warnings.length)}
              >
                Replace
              </button>
            </>
          }
        >
          <p>
            Importing <strong>{dialog.source}</strong> will replace your {count(data.places.length, 'place')} and{' '}
            {count(data.groups.length, 'group')} with {count(dialog.result.data.places.length, 'place')} and{' '}
            {count(dialog.result.data.groups.length, 'group')}. Export first if you want a backup.
          </p>
          {dialog.result.warnings.length > 0 && (
            <>
              <p className="small">These problems in the file will be fixed:</p>
              <ul className="warning-list small">
                {dialog.result.warnings.slice(0, MAX_WARNINGS_SHOWN).map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
                {dialog.result.warnings.length > MAX_WARNINGS_SHOWN && (
                  <li>…and {dialog.result.warnings.length - MAX_WARNINGS_SHOWN} more.</li>
                )}
              </ul>
            </>
          )}
        </Modal>
      )}

      {dialog?.kind === 'importError' && (
        <Modal
          title="Can't import this file"
          onClose={() => setDialog(null)}
          actions={
            <>
              <span className="spacer" />
              <button type="button" className="btn btn-primary" onClick={() => setDialog(null)}>
                OK
              </button>
            </>
          }
        >
          <p>
            <strong>{dialog.source}</strong>: {dialog.message}
          </p>
          <p className="muted small">Nothing was changed.</p>
        </Modal>
      )}

      {dialog?.kind === 'deleteGroup' && canDeleteGroup(dialog.group.id) && (
        <DeleteGroupDialog
          group={dialog.group}
          groups={data.groups}
          placeCount={counts.get(dialog.group.id) ?? 0}
          onConfirm={(moveTo) => confirmDeleteGroup(dialog.group, moveTo)}
          onClose={() => setDialog(null)}
        />
      )}

      {dialog?.kind === 'settings' && (
        <SettingsDialog
          googleApiKey={settings.googleApiKey}
          onClose={() => setDialog(null)}
          onSave={(googleApiKey) => {
            const patch: Partial<Settings> = { googleApiKey }
            if (!googleApiKey && settings.basemapId.startsWith('google-')) patch.basemapId = DEFAULT_BASEMAP_ID
            updateSettings(patch)
            setDialog(null)
          }}
        />
      )}
    </div>
  )
}

function DeleteGroupDialog({
  group,
  groups,
  placeCount,
  onConfirm,
  onClose,
}: {
  group: Group
  groups: readonly Group[]
  placeCount: number
  onConfirm(moveToGroupId: string): void
  onClose(): void
}) {
  const [moveTo, setMoveTo] = useState(OTHER_GROUP_ID)
  return (
    <Modal
      title={`Delete “${group.name}”?`}
      onClose={onClose}
      actions={
        <>
          <span className="spacer" />
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn-danger" onClick={() => onConfirm(moveTo)}>
            Delete group
          </button>
        </>
      }
    >
      {placeCount === 0 ? (
        <p>The group has no places.</p>
      ) : (
        <label className="field">
          <span>
            Move its {placeCount === 1 ? 'place' : count(placeCount, 'place')} to:
          </span>
          <select value={moveTo} onChange={(e) => setMoveTo(e.target.value)}>
            {groups
              .filter((g) => g.id !== group.id)
              .map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
          </select>
        </label>
      )}
    </Modal>
  )
}
