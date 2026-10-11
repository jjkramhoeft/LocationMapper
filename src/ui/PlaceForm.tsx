import { ArrowLeft, LocateFixed, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { placeErrors } from '../domain/placeDraft'
import { resolvePinStyle } from '../domain/style'
import type { Group, Place } from '../domain/types'
import { ColorPicker, IconPicker } from './pickers'
import { PinBadge } from './PinBadge'

interface PlaceFormProps {
  draft: Place
  isNew: boolean
  groups: readonly Group[]
  lookingUpAddress: boolean
  /** Merged into the current draft by the parent, so quick successive edits can't overwrite each other. */
  onChange(patch: Partial<Place>): void
  onSave(): void
  onCancel(): void
  onDelete(): void
  onLookupAddress(): void
}

export function PlaceForm({
  draft,
  isNew,
  groups,
  lookingUpAddress,
  onChange,
  onSave,
  onCancel,
  onDelete,
  onLookupAddress,
}: PlaceFormProps) {
  const [submitted, setSubmitted] = useState(false)
  const errors = placeErrors(draft)
  const group = groups.find((g) => g.id === draft.groupId)
  const style = resolvePinStyle(draft, group)
  const set = onChange

  // Title errors wait for a save attempt; format errors show while typing.
  const visibleError = (field: keyof typeof errors) => (field === 'title' && !submitted ? undefined : errors[field])

  function submit(e: FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    if (Object.keys(errors).length === 0) onSave()
  }

  return (
    <form className="panel form" onSubmit={submit} noValidate>
      <div className="panel-heading">
        <button type="button" className="icon-btn" aria-label="Cancel" onClick={onCancel}>
          <ArrowLeft size={18} />
        </button>
        <h2>{isNew ? 'New place' : 'Edit place'}</h2>
      </div>

      <Field label="Title" error={visibleError('title')}>
        <input
          value={draft.title}
          onChange={(e) => set({ title: e.target.value })}
          placeholder={lookingUpAddress ? 'Looking up…' : 'e.g. First flat'}
          autoFocus={!isNew}
        />
      </Field>

      <Field label="Group">
        <select value={draft.groupId} onChange={(e) => set({ groupId: e.target.value })}>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Address" hint={`${draft.lat.toFixed(5)}, ${draft.lng.toFixed(5)} · drag the pin to move it`}>
        <div className="input-with-button">
          <input
            value={draft.address}
            onChange={(e) => set({ address: e.target.value })}
            placeholder={lookingUpAddress ? 'Looking up…' : 'City, Country'}
          />
          <button
            type="button"
            className="btn btn-small"
            onClick={onLookupAddress}
            disabled={lookingUpAddress}
            title="Look up the address at the pin's position"
          >
            <LocateFixed size={14} /> {lookingUpAddress ? 'Looking up…' : 'From pin'}
          </button>
        </div>
      </Field>

      <div className="field-row">
        <Field label="From" error={visibleError('dateFrom')}>
          <input
            value={draft.dateFrom ?? ''}
            onChange={(e) => set({ dateFrom: e.target.value })}
            placeholder="YYYY-MM-DD"
            inputMode="numeric"
          />
        </Field>
        <Field label="To" error={visibleError('dateTo')}>
          <input
            value={draft.dateTo ?? ''}
            onChange={(e) => set({ dateTo: e.target.value })}
            placeholder="YYYY-MM-DD"
            inputMode="numeric"
          />
        </Field>
      </div>
      <p className="field-hint field-hint-block">Year, month or day: 2019, 2019-06 or 2019-06-14. Both are optional.</p>

      <Field label="Note">
        <textarea value={draft.note ?? ''} onChange={(e) => set({ note: e.target.value })} rows={4} />
      </Field>

      <Field label="Image URL" error={visibleError('imageUrl')}>
        <input
          value={draft.imageUrl ?? ''}
          onChange={(e) => set({ imageUrl: e.target.value })}
          placeholder="https://…"
          type="url"
        />
      </Field>

      <details className="appearance">
        <summary>
          <span>Appearance</span>
          <PinBadge color={style.color} icon={style.icon} size={22} />
          <span className="muted">{draft.color || draft.icon ? 'Custom' : 'From group'}</span>
        </summary>
        <div className="field">
          <span className="field-label">Color</span>
          <ColorPicker value={draft.color} inheritColor={group?.color} onChange={(color) => set({ color })} />
        </div>
        <div className="field">
          <span className="field-label">Icon</span>
          <IconPicker value={draft.icon} inheritIcon={group?.icon} onChange={(icon) => set({ icon })} />
        </div>
      </details>

      <div className="form-actions">
        {!isNew && (
          <button type="button" className="btn btn-danger-ghost" onClick={onDelete}>
            <Trash2 size={16} /> Delete
          </button>
        )}
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

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string
  hint?: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <label className={error ? 'field has-error' : 'field'}>
      <span className="field-label">{label}</span>
      {children}
      {error ? <span className="field-error">{error}</span> : hint && <span className="field-hint">{hint}</span>}
    </label>
  )
}
