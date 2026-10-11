import { comparePartialDates, isPartialDate } from './partialDate'
import type { Place } from './types'
import { isHttpUrl } from './url'

export type PlaceField = 'title' | 'dateFrom' | 'dateTo' | 'imageUrl'
export type PlaceErrors = Partial<Record<PlaceField, string>>

const DATE_HINT = 'Use YYYY, YYYY-MM or YYYY-MM-DD'

/** Problems that stop a place being saved from the edit form. Empty optional fields are fine. */
export function placeErrors(draft: Place): PlaceErrors {
  const errors: PlaceErrors = {}
  if (!draft.title.trim()) errors.title = 'A title is required'
  const from = draft.dateFrom?.trim()
  const to = draft.dateTo?.trim()
  if (from && !isPartialDate(from)) errors.dateFrom = DATE_HINT
  if (to && !isPartialDate(to)) errors.dateTo = DATE_HINT
  if (from && to && !errors.dateFrom && !errors.dateTo && comparePartialDates(from, to) > 0) {
    errors.dateTo = 'The end is before the start'
  }
  const url = draft.imageUrl?.trim()
  if (url && !isHttpUrl(url)) errors.imageUrl = 'Must be an http(s) URL'
  return errors
}

/** Trims text and drops empty optional fields, ready to store. */
export function cleanPlace(draft: Place): Place {
  const { note, imageUrl, dateFrom, dateTo, color, icon, ...required } = draft
  const place: Place = { ...required, title: draft.title.trim(), address: draft.address.trim() }
  const trimmedNote = note?.trim()
  if (trimmedNote) place.note = trimmedNote
  if (imageUrl?.trim()) place.imageUrl = imageUrl.trim()
  if (dateFrom?.trim()) place.dateFrom = dateFrom.trim()
  if (dateTo?.trim()) place.dateTo = dateTo.trim()
  if (color) place.color = color
  if (icon) place.icon = icon
  return place
}
