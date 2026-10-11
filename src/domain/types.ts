/** "YYYY", "YYYY-MM" or "YYYY-MM-DD" — only as precise as the user entered. */
export type PartialDate = string

/** Kebab-case Lucide icon name, e.g. "house", "plane". */
export type IconName = string

export interface Group {
  id: string
  name: string
  color: string
  icon: IconName
}

/**
 * A saved location on the map. Named Place rather than Location so it can't be
 * confused with the DOM's global `Location` type when an import is forgotten.
 */
export interface Place {
  id: string
  groupId: string
  title: string
  /** Coordinates are the source of truth; `address` is an editable label. */
  lat: number
  lng: number
  address: string
  note?: string
  imageUrl?: string
  dateFrom?: PartialDate
  dateTo?: PartialDate
  /** Overrides the group's color. */
  color?: string
  /** Overrides the group's icon. */
  icon?: IconName
}

export const DATA_VERSION = 1

/** The shape of an exported JSON file. */
export interface MapData {
  version: typeof DATA_VERSION
  groups: Group[]
  places: Place[]
}
