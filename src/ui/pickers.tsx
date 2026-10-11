import { Check } from 'lucide-react'
import { ICON_NAMES, type IconName } from '../domain/icons'
import { ICON_COMPONENTS } from './iconComponents'

export const PALETTE = [
  '#2563eb', '#0891b2', '#16a34a', '#65a30d', '#ca8a04',
  '#ea580c', '#dc2626', '#db2777', '#9333ea', '#475569',
] as const

interface ColorPickerProps {
  value: string | undefined
  onChange(color: string | undefined): void
  /** When set, offers an "inherit" option showing this color; `undefined` value selects it. */
  inheritColor?: string
}

export function ColorPicker({ value, onChange, inheritColor }: ColorPickerProps) {
  const isCustom = value !== undefined && !(PALETTE as readonly string[]).includes(value)
  return (
    <div className="swatches" role="radiogroup" aria-label="Color">
      {inheritColor !== undefined && (
        <button
          type="button"
          role="radio"
          aria-checked={value === undefined}
          className="swatch swatch-inherit"
          style={{ background: inheritColor }}
          title="Use the group's color"
          onClick={() => onChange(undefined)}
        >
          {value === undefined ? <Check size={14} color="white" /> : <span>G</span>}
        </button>
      )}
      {PALETTE.map((color) => (
        <button
          key={color}
          type="button"
          role="radio"
          aria-checked={value === color}
          aria-label={color}
          className="swatch"
          style={{ background: color }}
          onClick={() => onChange(color)}
        >
          {value === color && <Check size={14} color="white" />}
        </button>
      ))}
      <label className={isCustom ? 'swatch swatch-custom selected' : 'swatch swatch-custom'} title="Custom color">
        <input
          type="color"
          value={value ?? inheritColor ?? PALETTE[0]}
          onChange={(e) => onChange(e.target.value)}
          aria-label="Custom color"
        />
      </label>
    </div>
  )
}

interface IconPickerProps {
  value: IconName | undefined
  onChange(icon: IconName | undefined): void
  /** When set, offers an "inherit" option showing this icon; `undefined` value selects it. */
  inheritIcon?: IconName
}

export function IconPicker({ value, onChange, inheritIcon }: IconPickerProps) {
  const InheritIcon = inheritIcon ? ICON_COMPONENTS[inheritIcon] : undefined
  return (
    <div className="icon-grid" role="radiogroup" aria-label="Icon">
      {InheritIcon && (
        <button
          type="button"
          role="radio"
          aria-checked={value === undefined}
          className="icon-choice icon-choice-inherit"
          title="Use the group's icon"
          onClick={() => onChange(undefined)}
        >
          <InheritIcon size={18} />
          <span className="icon-choice-tag">G</span>
        </button>
      )}
      {ICON_NAMES.map((name) => {
        const Icon = ICON_COMPONENTS[name]
        return (
          <button
            key={name}
            type="button"
            role="radio"
            aria-checked={value === name}
            className="icon-choice"
            title={name}
            aria-label={name}
            onClick={() => onChange(name)}
          >
            <Icon size={18} />
          </button>
        )
      })}
    </div>
  )
}
