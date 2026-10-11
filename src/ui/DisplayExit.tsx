import { Minimize2 } from 'lucide-react'
import { useEffect, useState } from 'react'

const IDLE_MS = 2500

/**
 * The only control shown in display mode. It appears while the pointer moves and fades
 * out (with the cursor) when idle, so a wall display shows nothing but the map.
 */
export function DisplayExit({ onExit }: { onExit(): void }) {
  const [active, setActive] = useState(true)

  useEffect(() => {
    let timer = setTimeout(() => setActive(false), IDLE_MS)
    const wake = () => {
      setActive(true)
      clearTimeout(timer)
      timer = setTimeout(() => setActive(false), IDLE_MS)
    }
    window.addEventListener('pointermove', wake)
    window.addEventListener('pointerdown', wake)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('pointermove', wake)
      window.removeEventListener('pointerdown', wake)
    }
  }, [])

  useEffect(() => {
    document.body.classList.toggle('display-idle', !active)
    return () => document.body.classList.remove('display-idle')
  }, [active])

  return (
    <button type="button" className={active ? 'display-exit is-active' : 'display-exit'} onClick={onExit}>
      <Minimize2 size={16} aria-hidden="true" /> Exit display <kbd>Esc</kbd>
    </button>
  )
}
