import { FALLBACK_COLOR } from './defaultGroups'
import { FALLBACK_ICON, type IconName } from './icons'
import type { Group, Place } from './types'

export interface PinStyle {
  color: string
  icon: IconName
}

/** A place's own color/icon win; otherwise it inherits its group's. */
export function resolvePinStyle(place: Pick<Place, 'color' | 'icon'>, group: Group | undefined): PinStyle {
  return {
    color: place.color ?? group?.color ?? FALLBACK_COLOR,
    icon: place.icon ?? group?.icon ?? FALLBACK_ICON,
  }
}

const HEX_COLOR = /^#[0-9a-f]{6}$/i

export function isHexColor(value: unknown): value is string {
  return typeof value === 'string' && HEX_COLOR.test(value)
}
