import { DEFAULT_GROUPS, FALLBACK_COLOR, OTHER_GROUP_ID } from './defaultGroups'
import { FALLBACK_ICON, isIconName } from './icons'
import { comparePartialDates, isPartialDate } from './partialDate'
import { isHexColor } from './style'
import { DATA_VERSION, type Group, type MapData, type Place } from './types'
import { isHttpUrl } from './url'

export type ImportResult =
  | { ok: true; data: MapData; warnings: string[] }
  | { ok: false; error: string }

/** Thrown for problems that make the whole file unusable. */
class FatalImportError extends Error {}

type Raw = Record<string, unknown>

/** Returns `value` if valid; otherwise records `warning` and returns the fallback. */
function orFix<T>(value: unknown, isValid: (v: unknown) => v is T, fallback: () => T, warnings: string[], warning: string): T {
  if (isValid(value)) return value
  warnings.push(warning)
  return fallback()
}

const isObject = (v: unknown): v is Raw => typeof v === 'object' && v !== null && !Array.isArray(v)
const nonEmptyString = (v: unknown): v is string => typeof v === 'string' && v.trim() !== ''

export function parseMapDataJson(text: string): ImportResult {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return { ok: false, error: 'The file is not valid JSON.' }
  }
  return validateMapData(raw)
}

/**
 * Checks the whole file before anything is used. Fatal problems reject it; minor
 * ones are fixed and reported as warnings. Never returns half a file.
 */
export function validateMapData(raw: unknown): ImportResult {
  try {
    const warnings: string[] = []
    const root = migrate(raw)
    const groups = validateGroups(root.groups, warnings)
    const places = validatePlaces(root.places, new Set(groups.map((g) => g.id)), warnings)
    return { ok: true, data: { version: DATA_VERSION, groups, places }, warnings }
  } catch (e) {
    if (e instanceof FatalImportError) return { ok: false, error: e.message }
    throw e
  }
}

/** Brings older file versions up to the current one. Only version 1 exists so far. */
function migrate(raw: unknown): Raw {
  if (!isObject(raw)) throw new FatalImportError('The file does not contain a map data object.')
  const version = raw.version
  if (version === undefined) throw new FatalImportError('The file has no "version" field.')
  if (version !== DATA_VERSION) {
    const newer = typeof version === 'number' && version > DATA_VERSION
    throw new FatalImportError(
      newer
        ? `The file is version ${version}, made by a newer version of this app.`
        : `Unknown file version: ${JSON.stringify(version)}.`,
    )
  }
  return raw
}

function validateGroups(value: unknown, warnings: string[]): Group[] {
  if (!Array.isArray(value)) throw new FatalImportError('The file has no "groups" list.')
  const groups: Group[] = []
  const seen = new Set<string>()
  value.forEach((g, i) => {
    if (!isObject(g)) throw new FatalImportError(`Group #${i + 1} is not an object.`)
    const label = nonEmptyString(g.name) ? `"${g.name}"` : `#${i + 1}`
    const id = orFix(g.id, nonEmptyString, () => crypto.randomUUID(), warnings, `Group ${label} had no id; one was generated.`)
    if (seen.has(id)) {
      warnings.push(`Group ${label} duplicates the id "${id}" and was skipped.`)
      return
    }
    seen.add(id)
    groups.push({
      id,
      name: orFix(g.name, nonEmptyString, () => 'Unnamed group', warnings, `Group #${i + 1} had no name; it is now called "Unnamed group".`),
      color: orFix(g.color, isHexColor, () => FALLBACK_COLOR, warnings, `Group ${label} had an invalid color; it is now gray.`),
      icon: orFix(g.icon, isIconName, () => FALLBACK_ICON, warnings, `Group ${label} had an unknown icon; it now uses the map pin.`),
    })
  })
  if (!seen.has(OTHER_GROUP_ID)) {
    groups.push({ ...DEFAULT_GROUPS.find((g) => g.id === OTHER_GROUP_ID)! })
    warnings.push('The "Other" group was missing and has been added.')
  }
  return groups
}

const isLatitude = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= -90 && v <= 90
const isLongitude = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= -180 && v <= 180

function validatePlaces(value: unknown, groupIds: ReadonlySet<string>, warnings: string[]): Place[] {
  if (!Array.isArray(value)) throw new FatalImportError('The file has no "places" list.')
  const places: Place[] = []
  const seen = new Set<string>()
  value.forEach((p, i) => {
    if (!isObject(p)) throw new FatalImportError(`Place #${i + 1} is not an object.`)
    const label = nonEmptyString(p.title) ? `"${p.title}"` : `#${i + 1}`
    if (!isLatitude(p.lat) || !isLongitude(p.lng)) {
      throw new FatalImportError(`Place ${label} has invalid coordinates.`)
    }

    const isUnseenId = (v: unknown): v is string => nonEmptyString(v) && !seen.has(v)
    const id = orFix(p.id, isUnseenId, () => crypto.randomUUID(), warnings,
      `Place ${label} had a ${nonEmptyString(p.id) ? 'duplicate' : 'missing'} id; a new one was generated.`)
    seen.add(id)

    const address =
      p.address === undefined
        ? ''
        : orFix(p.address, (v) => typeof v === 'string', () => '', warnings, `Place ${label} had an invalid address, which was removed.`)

    const fallbackTitle = address.trim() || 'Untitled place'
    const title = orFix(p.title, nonEmptyString, () => fallbackTitle, warnings,
      `Place #${i + 1} had no title; it is now called "${fallbackTitle}".`)

    const isKnownGroup = (v: unknown): v is string => typeof v === 'string' && groupIds.has(v)
    const groupId = orFix(p.groupId, isKnownGroup, () => OTHER_GROUP_ID, warnings,
      `Place ${label} referred to an unknown group and was moved to Other.`)

    const place: Place = { id, groupId, title, lat: p.lat, lng: p.lng, address }

    if (typeof p.note === 'string') {
      if (p.note !== '') place.note = p.note
    } else if (p.note !== undefined) warnings.push(`Place ${label} had an invalid note, which was removed.`)

    if (typeof p.imageUrl === 'string' && isHttpUrl(p.imageUrl)) place.imageUrl = p.imageUrl
    else if (p.imageUrl !== undefined && p.imageUrl !== '') {
      warnings.push(`Place ${label} had an invalid image URL, which was removed.`)
    }

    for (const [key, name] of [['dateFrom', 'start date'], ['dateTo', 'end date']] as const) {
      const d = p[key]
      if (isPartialDate(d)) place[key] = d
      else if (d !== undefined && d !== '') warnings.push(`Place ${label} had an invalid ${name}, which was removed.`)
    }
    if (place.dateFrom && place.dateTo && comparePartialDates(place.dateFrom, place.dateTo) > 0) {
      ;[place.dateFrom, place.dateTo] = [place.dateTo, place.dateFrom]
      warnings.push(`Place ${label} had its dates in the wrong order; they were swapped.`)
    }

    if (isHexColor(p.color)) place.color = p.color
    else if (p.color !== undefined) warnings.push(`Place ${label} had an invalid color override, which was removed.`)

    if (isIconName(p.icon)) place.icon = p.icon
    else if (p.icon !== undefined) warnings.push(`Place ${label} had an unknown icon override, which was removed.`)

    places.push(place)
  })
  return places
}
