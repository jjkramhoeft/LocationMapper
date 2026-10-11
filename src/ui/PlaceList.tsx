import { Filter } from 'lucide-react'
import { formatDateRange } from '../domain/partialDate'
import type { SortMode } from '../domain/places'
import { resolvePinStyle } from '../domain/style'
import type { Group, Place } from '../domain/types'
import { PinBadge } from './PinBadge'

interface PlaceListProps {
  places: readonly Place[]
  totalCount: number
  groupsById: ReadonlyMap<string, Group>
  query: string
  sortMode: SortMode
  onQueryChange(query: string): void
  onSortChange(mode: SortMode): void
  onSelect(id: string): void
  onLoadSample(): void
}

export function PlaceList({
  places,
  totalCount,
  groupsById,
  query,
  sortMode,
  onQueryChange,
  onSortChange,
  onSelect,
  onLoadSample,
}: PlaceListProps) {
  return (
    <section className="section">
      <div className="section-heading">
        <h2>Places</h2>
        <span className="muted small">
          {places.length === totalCount ? totalCount : `${places.length} of ${totalCount}`}
        </span>
        <span className="spacer" />
        <select
          className="sort-select"
          value={sortMode}
          onChange={(e) => onSortChange(e.target.value as SortMode)}
          aria-label="Sort places"
        >
          <option value="date">Newest first</option>
          <option value="group">By group</option>
          <option value="title">By title</option>
        </select>
      </div>

      {totalCount > 0 && (
        <div className="search-box">
          <Filter size={15} className="search-icon" aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Filter by title, address or note"
            aria-label="Filter places"
            type="search"
          />
        </div>
      )}

      {totalCount === 0 ? (
        <div className="empty">
          <p>No places yet.</p>
          <p className="muted small">
            Press <strong>Add</strong> and click the map, or search for an address on the map.
          </p>
          <button type="button" className="btn btn-small" onClick={onLoadSample}>
            Load sample data
          </button>
        </div>
      ) : places.length === 0 ? (
        <p className="empty muted small">No places match. Check the filter and hidden groups.</p>
      ) : (
        <ul className="place-list">
          {places.map((p) => {
            const style = resolvePinStyle(p, groupsById.get(p.groupId))
            const dates = formatDateRange(p.dateFrom, p.dateTo)
            return (
              <li key={p.id}>
                <button type="button" className="place-row" onClick={() => onSelect(p.id)}>
                  <PinBadge color={style.color} icon={style.icon} size={28} />
                  <span className="place-text">
                    <span className="place-title">{p.title}</span>
                    <span className="place-sub">{[p.address, dates].filter(Boolean).join(' · ')}</span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
