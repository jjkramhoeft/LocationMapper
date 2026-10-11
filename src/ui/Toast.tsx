import { X } from 'lucide-react'
import { useEffect } from 'react'

export interface ToastState {
  /** Changes for every toast, so a new one restarts the timer. */
  id: number
  message: string
  action?: { label: string; run(): void }
  tone?: 'info' | 'error'
}

const DURATION_MS = 6000

export function Toast({ toast, onDismiss }: { toast: ToastState; onDismiss(): void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, toast.tone === 'error' ? DURATION_MS * 2 : DURATION_MS)
    return () => clearTimeout(timer)
  }, [toast.id, toast.tone, onDismiss])

  return (
    <div className={toast.tone === 'error' ? 'toast toast-error' : 'toast'} role="status" aria-live="polite">
      <span className="toast-message">{toast.message}</span>
      {toast.action && (
        <button
          type="button"
          className="toast-action"
          onClick={() => {
            toast.action!.run()
            onDismiss()
          }}
        >
          {toast.action.label}
        </button>
      )}
      <button type="button" className="icon-btn icon-btn-on-dark" aria-label="Dismiss" onClick={onDismiss}>
        <X size={16} />
      </button>
    </div>
  )
}
