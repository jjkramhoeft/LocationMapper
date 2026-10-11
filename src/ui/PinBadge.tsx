import type { IconName } from '../domain/icons'
import { ICON_COMPONENTS } from './iconComponents'

/** Small round badge in a pin's color with its icon; used in lists and popups. */
export function PinBadge({ color, icon, size = 24 }: { color: string; icon: IconName; size?: number }) {
  const Icon = ICON_COMPONENTS[icon]
  return (
    <span className="pin-badge" style={{ background: color, width: size, height: size }} aria-hidden="true">
      <Icon size={Math.round(size * 0.58)} color="white" strokeWidth={2.25} />
    </span>
  )
}
