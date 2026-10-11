import { Pencil, Trash2 } from 'lucide-react'
import { useLayoutEffect, useState } from 'react'
import { formatDateRange } from '../domain/partialDate'
import { resolvePinStyle } from '../domain/style'
import type { Group, Place } from '../domain/types'
import { Note } from './Note'
import { PinBadge } from './PinBadge'

interface PlacePopupProps {
  place: Place
  group?: Group
  onEdit(): void
  onDelete(): void
  /** Called once the content is in the popup, so the map can size the popup to fit. */
  onShown?(): void
}

export function PlacePopup({ place, group, onEdit, onDelete, onShown }: PlacePopupProps) {
  const [imageFailed, setImageFailed] = useState(false)
  const [imagePortrait, setImagePortrait] = useState(false)
  // Content mounts each time the popup opens; only the first layout matters.
  useLayoutEffect(() => onShown?.(), [])
  const style = resolvePinStyle(place, group)
  const dates = formatDateRange(place.dateFrom, place.dateTo)
  return (
    <div className="popup">
      {place.imageUrl && !imageFailed && (
        <img
          className={imagePortrait ? 'popup-image is-portrait' : 'popup-image'}
          src={place.imageUrl}
          alt=""
          loading="lazy"
          onLoad={(e) => setImagePortrait(e.currentTarget.naturalHeight > e.currentTarget.naturalWidth)}
          onError={() => setImageFailed(true)}
        />
      )}
      <h3 className="popup-title">{place.title}</h3>
      <div className="popup-meta">
        <PinBadge color={style.color} icon={style.icon} size={18} />
        <span>{group?.name ?? 'No group'}</span>
        {dates && (
          <>
            <span aria-hidden="true">·</span>
            <span>{dates}</span>
          </>
        )}
      </div>
      {place.address && <div className="popup-address">{place.address}</div>}
      {place.note && <Note text={place.note} className="popup-note" />}
      <div className="popup-actions">
        <button type="button" className="btn btn-small" onClick={onEdit}>
          <Pencil size={14} /> Edit
        </button>
        <button type="button" className="btn btn-small btn-danger-ghost" onClick={onDelete}>
          <Trash2 size={14} /> Delete
        </button>
      </div>
    </div>
  )
}
