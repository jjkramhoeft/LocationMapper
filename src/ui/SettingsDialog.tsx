import { useState } from 'react'
import { createGoogleSession } from '../map/google'
import { Modal } from './Modal'

interface SettingsDialogProps {
  googleApiKey?: string
  onSave(googleApiKey: string | undefined): void
  onClose(): void
}

export function SettingsDialog({ googleApiKey, onSave, onClose }: SettingsDialogProps) {
  const [key, setKey] = useState(googleApiKey ?? '')
  const [status, setStatus] = useState<{ checking: boolean; error?: string }>({ checking: false })

  async function save() {
    const trimmed = key.trim()
    if (!trimmed) {
      onSave(undefined)
      return
    }
    setStatus({ checking: true })
    try {
      await createGoogleSession(trimmed, 'roadmap')
      onSave(trimmed)
    } catch (e) {
      setStatus({ checking: false, error: e instanceof Error ? e.message : String(e) })
    }
  }

  return (
    <Modal
      title="Settings"
      onClose={onClose}
      actions={
        <>
          {googleApiKey && (
            <button type="button" className="btn btn-danger-ghost" onClick={() => onSave(undefined)}>
              Remove key
            </button>
          )}
          <span className="spacer" />
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={save} disabled={status.checking}>
            {status.checking ? 'Checking…' : 'Save'}
          </button>
        </>
      }
    >
      <label className={status.error ? 'field has-error' : 'field'}>
        <span className="field-label">Google Maps API key (optional)</span>
        <input
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="AIza…"
          autoComplete="off"
          spellCheck={false}
        />
        {status.error && <span className="field-error">{status.error}</span>}
      </label>
      <p className="muted small">
        Adds Google and Google satellite to the background maps. The key needs the <strong>Map Tiles API</strong>{' '}
        enabled and a billing account. It is stored only in this browser, never in exported files.
      </p>
      <p className="muted small">
        Other pages on the same <code>github.io</code> address can read this browser's storage, so restrict the key in
        Google Cloud to this site's URL and to the Map Tiles API.
      </p>
    </Modal>
  )
}
