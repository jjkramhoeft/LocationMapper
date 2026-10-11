import { ICON_NAMES, type IconName } from '../domain/icons'
import { ICON_COMPONENTS } from './iconComponents'

export const iconSymbolId = (name: IconName) => `icon-${name}`

/**
 * Hidden SVG symbols for every pin icon. Leaflet markers are plain HTML strings, so they
 * reference these with <use> instead of rendering React components.
 */
export function IconSprite() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      <defs>
        {ICON_NAMES.map((name) => {
          const Icon = ICON_COMPONENTS[name]
          return (
            <symbol key={name} id={iconSymbolId(name)} viewBox="0 0 24 24">
              <Icon size={24} strokeWidth={2.25} />
            </symbol>
          )
        })}
      </defs>
    </svg>
  )
}
