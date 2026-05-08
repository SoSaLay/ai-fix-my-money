'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-6">
      <div className="max-w-md w-full bg-surface-container-lowest rounded-xl p-8 text-center">
        <h2 className="text-headline-md text-on-surface mb-4">Something went wrong!</h2>
        <p className="text-body-md text-on-surface-variant mb-6">
          {error.message || 'An unexpected error occurred'}
        </p>
        <button
          onClick={() => reset()}
          className="bg-secondary text-on-secondary px-6 py-3 rounded-xl text-label-lg font-medium hover:bg-secondary/90 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
