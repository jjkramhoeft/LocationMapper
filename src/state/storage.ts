import { createInitialData } from '../domain/defaultGroups'
import { SORT_MODES, type SortMode } from '../domain/places'
import type { MapData } from '../domain/types'
import { validateMapData } from '../domain/validate'
import { BASEMAPS, DEFAULT_BASEMAP_ID } from '../map/basemaps'

// All <user>.github.io projects share one origin, so every key is prefixed.
const DATA_KEY = 'ltm:data'
const SETTINGS_KEY = 'ltm:settings'
const CORRUPT_BACKUP_KEY = 'ltm:data-unreadable'

export interface MapView {
  lat: number
  lng: number
  zoom: number
}

/** Per-device preferences. Never part of the exported JSON. */
export interface Settings {
  basemapId: string
  view?: MapView
  googleApiKey?: string
  hiddenGroupIds: string[]
  sortMode: SortMode
}

const DEFAULT_SETTINGS: Settings = { basemapId: DEFAULT_BASEMAP_ID, hiddenGroupIds: [], sortMode: 'date' }

function read(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Storage blocked or full: the app keeps working for this session.
  }
}

export function loadData(): MapData {
  const text = read(DATA_KEY)
  if (text === null) return createInitialData()
  try {
    const result = validateMapData(JSON.parse(text))
    if (result.ok) return result.data
  } catch {
    // fall through
  }
  // Keep the unreadable copy rather than overwriting it on the next save.
  write(CORRUPT_BACKUP_KEY, text)
  return createInitialData()
}

export function saveData(data: MapData): void {
  write(DATA_KEY, JSON.stringify(data))
}

export function loadSettings(): Settings {
  const text = read(SETTINGS_KEY)
  if (text === null) return DEFAULT_SETTINGS
  try {
    const raw = JSON.parse(text) as Partial<Settings>
    const isGoogle = raw.basemapId?.startsWith('google-')
    return {
      basemapId:
        raw.basemapId && (isGoogle || BASEMAPS.some((b) => b.id === raw.basemapId)) ? raw.basemapId : DEFAULT_BASEMAP_ID,
      view: isView(raw.view) ? raw.view : undefined,
      googleApiKey: typeof raw.googleApiKey === 'string' && raw.googleApiKey ? raw.googleApiKey : undefined,
      hiddenGroupIds: Array.isArray(raw.hiddenGroupIds) ? raw.hiddenGroupIds.filter((id) => typeof id === 'string') : [],
      sortMode: raw.sortMode && SORT_MODES.includes(raw.sortMode) ? raw.sortMode : 'date',
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}

function isView(v: unknown): v is MapView {
  if (typeof v !== 'object' || v === null) return false
  const { lat, lng, zoom } = v as Record<string, unknown>
  return [lat, lng, zoom].every((n) => typeof n === 'number' && Number.isFinite(n))
}

export function saveSettings(settings: Settings): void {
  write(SETTINGS_KEY, JSON.stringify(settings))
}
