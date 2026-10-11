import { ArrowLeft, ListX, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { canDeleteGroup } from '../domain/groups'
import type { Group } from '../domain/types'
import { ColorPicker, IconPicker } from './pickers'
import { PinBadge } from './PinBadge'

interface GroupFormProps {
  group: Group
  isNew: boolean
  placeCount: number
  onSave(group: Group): void
  onCancel(): void
  onDelete(): void
  /** Deletes the group's places, keeping the group. */
  onDeletePlaces(): void
}

export function GroupForm({ group, isNew, placeCount, onSave, onCancel, onDelete, onDeletePlaces }: GroupFormProps) {
  const [draft, setDraft] = useState(group)
  const [submitted, setSubmitted] = useState(false)
  const nameError = submitted && !draft.name.trim() ? 'A name is required' : undefined

  function submit(e: FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    if (draft.name.trim()) onSave({ ...draft, name: draft.name.trim() })
  }

  return (
    <form className="panel form" onSubmit={submit} noValidate>
      <div className="panel-heading">
        <button type="button" className="icon-btn" aria-label="Cancel" onClick={onCancel}>
          <ArrowLeft size={18} />
        </button>
        <h2>{isNew ? 'New group' : 'Edit group'}</h2>
        <PinBadge color={draft.color} icon={draft.icon} size={26} />
      </div>

      <label className={nameError ? 'field has-error' : 'field'}>
        <span className="field-label">Name</span>
        <input value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} autoFocus />
        {nameError && <span className="field-error">{nameError}</span>}
      </label>

      <div className="field">
        <span className="field-label">Color</span>
        <ColorPicker value={draft.color} onChange={(color) => color && setDraft((d) => ({ ...d, color }))} />
      </div>

      <div className="field">
        <span className="field-label">Icon</span>
        <IconPicker value={draft.icon} onChange={(icon) => icon && setDraft((d) => ({ ...d, icon }))} />
      </div>

      {!isNew && (
        <p className="muted small">
          {placeCount === 1 ? '1 place' : `${placeCount} places`} in this group. Places can override the color and icon.
        </p>
      )}

      {!isNew && placeCount > 0 && (
        <div>
          <button type="button" className="btn btn-small btn-danger-ghost" onClick={onDeletePlaces}>
            <ListX size={16} /> Delete all {placeCount === 1 ? '1 place' : `${placeCount} places`}
          </button>
        </div>
      )}

      <div className="form-actions">
        {!isNew &&
          (canDeleteGroup(group.id) ? (
            <button type="button" className="btn btn-danger-ghost" onClick={onDelete}>
              <Trash2 size={16} /> Delete
            </button>
          ) : (
            <span className="muted small">The fallback group can't be deleted.</span>
          ))}
        <span className="spacer" />
        <button type="button" className="btn" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          Save
        </button>
      </div>
    </form>
  )
}
