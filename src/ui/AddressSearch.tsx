import { MapPinPlus, Search, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { searchAddress, type SearchResult } from '../geo/nominatim'

interface AddressSearchProps {
  onShow(result: SearchResult): void
  onAddHere(result: SearchResult): void
}

type State =
  | { status: 'idle' }
  | { status: 'searching' }
  | { status: 'done'; results: SearchResult[] }
  | { status: 'error'; message: string }

/** Address search via Nominatim. Runs on Enter only, per Nominatim's usage policy. */
export function AddressSearch({ onShow, onAddHere }: AddressSearchProps) {
  const [query, setQuery] = useState('')
  const [state, setState] = useState<State>({ status: 'idle' })

  async function submit(e: FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    setState({ status: 'searching' })
    try {
      setState({ status: 'done', results: await searchAddress(q) })
    } catch (err) {
      setState({ status: 'error', message: err instanceof Error ? err.message : 'Search failed' })
    }
  }

  function clear() {
    setQuery('')
    setState({ status: 'idle' })
  }

  return (
    <div className="address-search">
      <form className="search-box" onSubmit={submit} role="search">
        <Search size={16} className="search-icon" aria-hidden="true" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Find an address… (Enter)"
          aria-label="Find an address"
          enterKeyHint="search"
        />
        {(query || state.status !== 'idle') && (
          <button type="button" className="icon-btn" aria-label="Clear search" onClick={clear}>
            <X size={16} />
          </button>
        )}
      </form>
      {state.status === 'searching' && <p className="muted small search-status">Searching…</p>}
      {state.status === 'error' && <p className="error small search-status">{state.message}</p>}
      {state.status === 'done' &&
        (state.results.length === 0 ? (
          <p className="muted small search-status">No results.</p>
        ) : (
          <ul className="search-results">
            {state.results.map((r) => (
              <li key={r.id}>
                <button type="button" className="search-result" onClick={() => onShow(r)} title="Show on map">
                  <span className="search-result-name">{r.name || r.address}</span>
                  <span className="search-result-detail">{r.displayName}</span>
                </button>
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
              </li>
            ))}
          </ul>
        ))}
    </div>
  )
}
