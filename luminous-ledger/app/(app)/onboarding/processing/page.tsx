'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function OnboardingProcessingPage() {
  const router = useRouter()

  useEffect(() => {
    // Trigger transaction sync, then redirect to dashboard
    const runSync = async () => {
      try {
        await fetch('/api/plaid/sync-transactions', { method: 'POST' })
      } catch (err) {
        console.error('Sync error:', err)
      }
      // Redirect after a brief processing window
      setTimeout(() => {
        router.push('/dashboard')
      }, 4000)
    }

    runSync()
  }, [router])

  return (
    <div className="flex flex-col min-h-full items-center justify-center px-8 pb-10">
      <div className="bg-surface-container-lowest rounded-2xl shadow-card p-12 flex flex-col items-center gap-8 max-w-md w-full text-center">
        {/* Step indicator */}
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-label-sm font-semibold"
                style={{
                  backgroundColor: '#4c49c9',
                  color: '#ffffff',
                }}
              >
                {step}
              </div>
              {step < 3 && (
                <div className="w-8 h-px bg-secondary/40" />
              )}
            </div>
          ))}
        </div>

        {/* Animated spinner — sunset gradient rotating border */}
        <div className="relative w-24 h-24">
          {/* Outer gradient ring */}
          <div
            className="absolute inset-0 rounded-full animate-spin"
            style={{
              background: 'linear-gradient(135deg, #4c49c9 0%, #ff9817 100%)',
              padding: '4px',
            }}
          >
            {/* Inner white fill to create ring effect */}
            <div className="w-full h-full rounded-full bg-surface-container-lowest" />
          </div>

          {/* Center dot */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-4 h-4 rounded-full bg-sunset" />
          </div>
        </div>

        {/* Text */}
        <div>
          <h2 className="text-headline-lg text-on-surface font-bold">
            Analyzing Your Finances
          </h2>
          <p className="text-body-md text-on-surface-variant mt-3 leading-relaxed">
            We&apos;re syncing your transactions, categorizing your spending, and building
            your financial profile. This takes just a moment.
          </p>
        </div>

        {/* Progress steps */}
        <div className="w-full flex flex-col gap-3">
          {[
            { label: 'Fetching transactions',   done: true  },
            { label: 'Categorizing spending',    done: true  },
            { label: 'Building your dashboard', done: false },
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  backgroundColor: step.done ? '#1a6b3a' : '#e7e8ee',
                }}
              >
                {step.done && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <p
                className="text-label-md font-medium"
                style={{ color: step.done ? '#1a6b3a' : '#5a5b60' }}
              >
                {step.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
