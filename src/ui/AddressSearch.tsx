import { MapPinPlus, Search, X } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { searchAddress, type SearchResult } from '../geo/nominatim'

interface AddressSearchProps {
  /** Zooms and pans the map to a result. */
  onShow(result: SearchResult): void
  /** The search was cleared; remove any result marker. */
  onClear(): void
  /** Omitted while a form is open, where starting a new place would discard it. */
  onAddHere?(result: SearchResult): void
}

type State =
  | { status: 'idle' }
  | { status: 'searching' }
  | { status: 'done'; results: SearchResult[]; activeId?: number }
  | { status: 'error'; message: string }

/**
 * "Go to" search on the map. Enter flies to the best match; other matches are listed so a
 * different one can be picked. Runs on Enter only, per Nominatim's usage policy.
 */
export function AddressSearch({ onShow, onClear, onAddHere }: AddressSearchProps) {
  const [query, setQuery] = useState('')
  const [state, setState] = useState<State>({ status: 'idle' })
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  // Close the result list when the user turns to the map or anything else.
  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  async function submit(e: FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    setState({ status: 'searching' })
    setOpen(true)
    try {
      const results = await searchAddress(q)
      const best = results[0]
      setState({ status: 'done', results, activeId: best?.id })
      if (best) onShow(best)
    } catch (err) {
      setState({ status: 'error', message: err instanceof Error ? err.message : 'Search failed' })
    }
  }

  function show(result: SearchResult) {
    if (state.status === 'done') setState({ ...state, activeId: result.id })
    setOpen(false)
    onShow(result)
  }

  function clear() {
    setQuery('')
    setState({ status: 'idle' })
    setOpen(false)
    onClear()
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key !== 'Escape') return
    // Keep Esc from also cancelling "Add" mode behind the search.
    e.stopPropagation()
    if (open) setOpen(false)
    else if (query) clear()
  }

  const hasPanel = open && state.status !== 'idle'

  return (
    <div className="map-search" ref={rootRef} onKeyDown={onKeyDown}>
      <form className="search-box" onSubmit={submit} role="search">
        <Search size={16} className="search-icon" aria-hidden="true" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          placeholder="Go to address or city… (Enter)"
          aria-label="Go to an address, city or place"
          aria-expanded={hasPanel}
          enterKeyHint="search"
        />
        {(query || state.status !== 'idle') && (
          <button type="button" className="icon-btn" aria-label="Clear search" onClick={clear}>
            <X size={16} />
          </button>
        )}
      </form>
      {hasPanel && (
        <div className="map-search-panel">
          {state.status === 'searching' && <p className="muted small search-status">Searching…</p>}
          {state.status === 'error' && <p className="error small search-status">{state.message}</p>}
          {state.status === 'done' &&
            (state.results.length === 0 ? (
              <p className="muted small search-status">No results.</p>
            ) : (
              <ul className="search-results">
                {state.results.map((r) => (
                  <li key={r.id} className={r.id === state.activeId ? 'is-active' : undefined}>
                    <button
                      type="button"
                      className="search-result"
                      onClick={() => show(r)}
                      title="Show on map"
                      aria-current={r.id === state.activeId ? 'location' : undefined}
                    >
                      <span className="search-result-name">{r.name || r.address}</span>
                      <span className="search-result-detail">{r.displayName}</span>
                    </button>
                    {onAddHere && (
                      <button
                        type="button"
                        className="icon-btn"
                        title="Add a place here"
                        aria-label={`Add a place at ${r.displayName}`}
                        onClick={() => {
                          onAddHere(r)
                          clear()
                        }}
                      >
                        <MapPinPlus size={18} />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            ))}
        </div>
      )}
    </div>
  )
}
