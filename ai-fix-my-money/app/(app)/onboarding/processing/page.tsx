'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function OnboardingProcessingPage() {
  const router = useRouter()

  useEffect(() => {
    // In the local-first architecture, data is already loaded from
    // financial-data.json. Just redirect to the dashboard after a brief pause.
    const timer = setTimeout(() => {
      router.push('/dashboard')
    }, 2000)
    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="flex flex-col min-h-full items-center justify-center px-8 pb-10">
      <div className="bg-surface-container-lowest rounded-2xl shadow-card p-12 flex flex-col items-center gap-8 max-w-md w-full text-center">
        <div className="relative w-24 h-24">
          <div
            className="absolute inset-0 rounded-full animate-spin"
            style={{
              background: 'linear-gradient(135deg, #4c49c9 0%, #ff9817 100%)',
              padding: '4px',
            }}
          >
            <div className="w-full h-full rounded-full bg-surface-container-lowest" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-4 h-4 rounded-full bg-sunset" />
          </div>
        </div>

        <div>
          <h2 className="text-headline-lg text-on-surface font-bold">
            Loading Your Dashboard
          </h2>
          <p className="text-body-md text-on-surface-variant mt-3 leading-relaxed">
            Setting up your financial overview. You&apos;ll be redirected in a moment.
          </p>
        </div>
      </div>
    </div>
  )
}
