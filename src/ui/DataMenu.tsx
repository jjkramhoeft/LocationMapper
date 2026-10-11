import { Database, Download, FileUp, Sparkles } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

interface DataMenuProps {
  onExport(): void
  onImportFile(file: File): void
  onLoadSample(): void
}

export function DataMenu({ onExport, onImportFile, onLoadSample }: DataMenuProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', close)
    }
  }, [open])

  const choose = (action: () => void) => () => {
    setOpen(false)
    action()
  }

  return (
    <div className="menu" ref={rootRef}>
      <button
        type="button"
        className="icon-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        title="Import / export"
        aria-label="Import / export"
        onClick={() => setOpen(!open)}
      >
        <Database size={18} />
      </button>
      {open && (
        <div className="menu-popover" role="menu">
          <button type="button" role="menuitem" onClick={choose(onExport)}>
            <Download size={16} /> Export JSON
          </button>
          <button type="button" role="menuitem" onClick={choose(() => fileRef.current?.click())}>
            <FileUp size={16} /> Import JSON…
          </button>
          <button type="button" role="menuitem" onClick={choose(onLoadSample)}>
            <Sparkles size={16} /> Load sample data
          </button>
        </div>
      )}
      <input
        ref={fileRef}
        type="file"
        accept=".json,application/json"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (file) onImportFile(file)
        }}
      />
    </div>
  )
}
