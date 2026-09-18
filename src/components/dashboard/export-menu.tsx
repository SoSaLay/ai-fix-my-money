'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Download, FileText, Lock, Printer } from 'lucide-react'
import { reportFilename, type FinancialReport } from '@/lib/export/report'
import { reportToHtml } from '@/lib/export/report-html'
import { reportToText } from '@/lib/export/report-text'

/**
 * Export the dashboard.
 *
 * The button stays dead until every track is finished: before that the numbers
 * on the screen are half-recorded, and a file of half-recorded numbers is worse
 * than no file. Once the last final quiz is passed it lights up for good.
 *
 * PDF goes through the browser's print dialog ("Save as PDF"), which is what
 * makes it a real PDF with selectable text and no library to ship. The text
 * file is the copy that pastes into an email.
 */
export function ExportMenu({
  unlocked,
  buildReport,
}: {
  unlocked: boolean
  /** Built on click, so the file always holds the numbers as they are now. */
  buildReport: () => FinancialReport
}) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  // Close on an outside click or Escape — the menu is a small overlay, not a
  // mode the learner should have to hunt their way out of.
  useEffect(() => {
    if (!open) return
    const onPointer = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const exportPdf = useCallback(() => {
    setOpen(false)
    const report = buildReport()

    // A hidden frame keeps the app's own layout out of the printout, and
    // srcdoc keeps it same-origin so `print()` is allowed.
    const frame = document.createElement('iframe')
    frame.setAttribute('aria-hidden', 'true')
    frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden'
    frame.srcdoc = reportToHtml(report)

    frame.onload = () => {
      const win = frame.contentWindow
      if (!win) { frame.remove(); return }
      // The frame has to outlive the print dialog, which is modal in some
      // browsers and returns immediately in others.
      const cleanup = () => { setTimeout(() => frame.remove(), 500) }
      win.addEventListener('afterprint', cleanup)
      try {
        win.focus()
        win.print()
      } catch {
        frame.remove()
        return
      }
      // Safari never fires afterprint from a hidden frame.
      setTimeout(cleanup, 60_000)
    }

    document.body.appendChild(frame)
  }, [buildReport])

  const exportText = useCallback(() => {
    setOpen(false)
    const report = buildReport()
    const blob = new Blob([reportToText(report)], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = reportFilename(report.generatedAt, 'txt')
    document.body.appendChild(link)
    link.click()
    link.remove()
    // Revoking straight away cancels the download in some browsers.
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }, [buildReport])

  if (!unlocked) {
    return (
      <button
        type="button"
        disabled
        title="Finish the Investing final quiz to unlock exporting."
        className="inline-flex items-center gap-1.5 rounded-full px-4 h-10 text-label-md font-medium text-on-surface-variant bg-surface-container opacity-50 cursor-not-allowed"
      >
        <Lock size={15} aria-hidden />
        Export
      </button>
    )
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="btn-action items-center gap-1.5"
      >
        <Download size={15} aria-hidden />
        Export
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-2 w-60 rounded-2xl bg-surface-container-lowest shadow-card border border-outline-variant/40 p-1.5"
        >
          <button
            type="button"
            role="menuitem"
            onClick={exportPdf}
            className="flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-surface-container transition-colors"
          >
            <Printer size={16} className="text-on-surface-variant mt-0.5 shrink-0" aria-hidden />
            <span className="min-w-0">
              <span className="block text-body-md text-on-surface">PDF</span>
              <span className="block text-label-sm text-on-surface-variant">
                Opens print — choose “Save as PDF”.
              </span>
            </span>
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={exportText}
            className="flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-surface-container transition-colors"
          >
            <FileText size={16} className="text-on-surface-variant mt-0.5 shrink-0" aria-hidden />
            <span className="min-w-0">
              <span className="block text-body-md text-on-surface">Plain text</span>
              <span className="block text-label-sm text-on-surface-variant">
                A .txt file you can paste anywhere.
              </span>
            </span>
          </button>
        </div>
      )}
    </div>
  )
}
