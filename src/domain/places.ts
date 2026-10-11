import { comparePartialDates } from './partialDate'
import type { Group, Place } from './types'

export type SortMode = 'date' | 'group' | 'title'

export const SORT_MODES: readonly SortMode[] = ['date', 'group', 'title']

/** The date a place is sorted by: when it started, or its only known date. */
function sortDate(place: Place): string | undefined {
  return place.dateFrom ?? place.dateTo
}

const byTitle = (a: Place, b: Place) => a.title.localeCompare(b.title)

export function sortPlaces(places: readonly Place[], groups: readonly Group[], mode: SortMode): Place[] {
  const sorted = [...places]
  switch (mode) {
    case 'date':
      // Newest first; undated places last.
      return sorted.sort((a, b) => {
        const da = sortDate(a)
        const db = sortDate(b)
        if (da && db) return comparePartialDates(db, da) || byTitle(a, b)
        if (da) return -1
        if (db) return 1
        return byTitle(a, b)
      })
    case 'group': {
      const order = new Map(groups.map((g, i) => [g.id, i]))
      const rank = (p: Place) => order.get(p.groupId) ?? groups.length
      return sorted.sort((a, b) => rank(a) - rank(b) || byTitle(a, b))
    }
    case 'title':
      return sorted.sort(byTitle)
  }
}

/** Places in visible groups whose title, address or note contains the query (case-insensitive). */
export function filterPlaces(places: readonly Place[], query: string, hiddenGroupIds: ReadonlySet<string>): Place[] {
  const q = query.trim().toLocaleLowerCase()
  return places.filter((p) => {
    if (hiddenGroupIds.has(p.groupId)) return false
    if (!q) return true
    return [p.title, p.address, p.note ?? ''].some((text) => text.toLocaleLowerCase().includes(q))
  })
}
