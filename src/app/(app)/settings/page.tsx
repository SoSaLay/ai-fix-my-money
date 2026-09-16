'use client'

import { useCallback, useState } from 'react'
import { HardDrive, RotateCcw } from 'lucide-react'

import { TopNav } from '@/components/layout/top-nav'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { resetAnalytics } from '@/lib/analytics/posthog'
import { clearAllLocal } from '@/lib/storage/local'

export default function SettingsPage() {
  const [confirming, setConfirming] = useState(false)

  const reset = useCallback(() => {
    clearAllLocal()
    resetAnalytics()
    // A full load, not a client navigation: the providers still hold the old
    // values in memory, and only a fresh page reads the now-empty storage.
    window.location.assign('/learning')
  }, [])

  return (
    <div className="flex flex-col min-h-full">
      <TopNav title="Settings" />

      <div className="flex-1 px-4 sm:px-8 pb-10 flex flex-col gap-4 max-w-3xl">
        <section className="bg-surface-container-lowest rounded-3xl border border-on-surface/[0.06] p-6 sm:p-8 flex gap-5">
          <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
            <HardDrive size={22} aria-hidden />
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-headline-md text-on-surface">Your data</h2>
            <p className="text-body-lg text-on-surface-variant">
              There’s no account. Your progress and the figures you enter are saved in this
              browser only, never on our servers.
            </p>
            <p className="text-body-lg text-on-surface-variant">
              Clearing your browser data erases it, and a different browser or device starts
              fresh.
            </p>
          </div>
        </section>

        <section className="bg-surface-container-lowest rounded-3xl border border-error/20 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="flex gap-5 flex-1">
            <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center text-error shrink-0">
              <RotateCcw size={22} aria-hidden />
            </div>
            <div className="flex flex-col gap-2">
              <h2 className="text-headline-md text-on-surface">Reset everything</h2>
              <p className="text-body-lg text-on-surface-variant">
                Erase all your progress and figures from this browser and start over.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="h-11 px-5 rounded-full bg-error text-white text-label-lg shrink-0 hover:bg-error/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-error"
          >
            Reset everything
          </button>
        </section>
      </div>

      <ConfirmDialog
        open={confirming}
        title="Reset everything?"
        body="This permanently erases your progress, rank, review queue and every figure you’ve entered from this browser. It can’t be undone."
        confirmLabel="Reset everything"
        onConfirm={reset}
        onCancel={() => setConfirming(false)}
      />
    </div>
  )
}
