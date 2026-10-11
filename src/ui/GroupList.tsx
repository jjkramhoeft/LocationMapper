import { Eye, EyeOff, Pencil, Plus } from 'lucide-react'
import type { Group } from '../domain/types'
import { PinBadge } from './PinBadge'

interface GroupListProps {
  groups: readonly Group[]
  counts: ReadonlyMap<string, number>
  hiddenGroupIds: ReadonlySet<string>
  onToggle(id: string): void
  onShowAll(): void
  onEdit(id: string): void
  onAdd(): void
}

export function GroupList({ groups, counts, hiddenGroupIds, onToggle, onShowAll, onEdit, onAdd }: GroupListProps) {
  return (
    <section className="section">
      <div className="section-heading">
        <h2>Groups</h2>
        {hiddenGroupIds.size > 0 && (
          <button type="button" className="link-btn" onClick={onShowAll}>
            Show all
          </button>
        )}
        <span className="spacer" />
        <button type="button" className="icon-btn" title="New group" aria-label="New group" onClick={onAdd}>
          <Plus size={18} />
        </button>
      </div>
      <ul className="group-list">
        {groups.map((g) => {
          const hidden = hiddenGroupIds.has(g.id)
          return (
            <li key={g.id} className={hidden ? 'group-row is-hidden' : 'group-row'}>
              <button
                type="button"
                className="group-toggle"
                aria-pressed={!hidden}
                title={hidden ? 'Show on map' : 'Hide from map'}
                onClick={() => onToggle(g.id)}
              >
                <PinBadge color={g.color} icon={g.icon} size={22} />
                <span className="group-name">{g.name}</span>
                <span className="group-count">{counts.get(g.id) ?? 0}</span>
                {hidden ? <EyeOff size={16} className="group-eye" /> : <Eye size={16} className="group-eye" />}
              </button>
              <button type="button" className="icon-btn" aria-label={`Edit ${g.name}`} onClick={() => onEdit(g.id)}>
                <Pencil size={15} />
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
