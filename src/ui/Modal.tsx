import { useEffect, useRef, type ReactNode } from 'react'

interface ModalProps {
  title: string
  children: ReactNode
  /** Buttons, right-aligned in the footer. */
  actions: ReactNode
  /** Called on Escape. */
  onClose(): void
}

export function Modal({ title, children, actions, onClose }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])
  return (
    <dialog
      ref={ref}
      className="modal"
      aria-labelledby="modal-title"
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
    >
      <h2 id="modal-title" className="modal-title">
        {title}
      </h2>
      <div className="modal-body">{children}</div>
      <div className="modal-actions">{actions}</div>
    </dialog>
  )
}
