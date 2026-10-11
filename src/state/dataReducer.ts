import { deleteGroup } from '../domain/groups'
import type { Group, MapData, Place } from '../domain/types'

export type DataAction =
  /** Adds the place, or replaces the one with the same id. */
  | { type: 'savePlace'; place: Place }
  | { type: 'deletePlace'; id: string }
  /** Undo of deletePlace: puts the place back at its old position in the list. */
  | { type: 'restorePlace'; place: Place; index: number }
  /** Adds the group, or replaces the one with the same id. */
  | { type: 'saveGroup'; group: Group }
  | { type: 'deleteGroup'; id: string; moveToGroupId: string }
  | { type: 'replace'; data: MapData }

function upsert<T extends { id: string }>(items: readonly T[], item: T): T[] {
  const index = items.findIndex((i) => i.id === item.id)
  if (index === -1) return [...items, item]
  return items.map((i, n) => (n === index ? item : i))
}

export function dataReducer(state: MapData, action: DataAction): MapData {
  switch (action.type) {
    case 'savePlace':
      return { ...state, places: upsert(state.places, action.place) }
    case 'deletePlace':
      return { ...state, places: state.places.filter((p) => p.id !== action.id) }
    case 'restorePlace': {
      if (state.places.some((p) => p.id === action.place.id)) return state
      const places = [...state.places]
      places.splice(Math.min(action.index, places.length), 0, action.place)
      return { ...state, places }
    }
    case 'saveGroup':
      return { ...state, groups: upsert(state.groups, action.group) }
    case 'deleteGroup':
      return deleteGroup(state, action.id, action.moveToGroupId)
    case 'replace':
      return action.data
  }
}
