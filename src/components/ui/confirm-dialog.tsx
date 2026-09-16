'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle } from 'lucide-react'

/**
 * The app's own confirmation, in place of the browser's `confirm()` bar. Used
 * anywhere a click cannot be undone — deleting a goal, removing a project.
 *
 * Rendered on the body so no card's own stacking or overflow can clip it.
 * Escape cancels, and the destructive button never takes focus on open.
 */
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  tone = 'danger',
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  body?: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'danger' | 'neutral'
  onConfirm: () => void
  onCancel: () => void
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center px-5 bg-black/40 animate-fade-in"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-sm bg-surface-container-lowest rounded-3xl border border-on-surface/[0.06] shadow-[0_20px_60px_rgba(0,0,0,0.18)] p-6 flex flex-col gap-4"
      >
        <div className="flex items-start gap-3">
          {tone === 'danger' && (
            <span className="w-9 h-9 rounded-full bg-error/[0.1] flex items-center justify-center shrink-0">
              <AlertTriangle size={17} className="text-error" aria-hidden />
            </span>
          )}
          <div className="flex flex-col gap-1.5 min-w-0">
            <p className="text-title-md text-on-surface">{title}</p>
            {body && (
              <p className="text-body-md text-on-surface-variant leading-relaxed">{body}</p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 flex-wrap">
          <button
            autoFocus
            onClick={onCancel}
            className="px-4 py-2.5 rounded-full text-label-lg text-on-surface-variant hover:text-on-surface hover:bg-on-surface/[0.06] transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-5 py-2.5 rounded-full text-label-lg text-white transition-colors ${
              tone === 'danger' ? 'bg-error hover:brightness-90' : 'bg-[#17171c] hover:bg-black'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
