'use client'

import { useState, useCallback, useEffect } from 'react'
import { usePlaidLink, PlaidLinkOnSuccess, PlaidLinkOptions } from 'react-plaid-link'
import { Button } from '@/components/ui/button'
import { Plus, Loader2 } from 'lucide-react'

interface PlaidLinkButtonProps {
  onSuccess?: () => void
  className?: string
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'sunset'
}

export function PlaidLinkButton({ onSuccess, className, variant = 'primary' }: PlaidLinkButtonProps) {
  const [linkToken, setLinkToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch link token from the API
  useEffect(() => {
    async function fetchLinkToken() {
      try {
        const response = await fetch('/api/plaid/create-link-token', {
          method: 'POST',
        })

        if (!response.ok) {
          throw new Error('Failed to create link token')
        }

        const data = await response.json()
        setLinkToken(data.data.link_token)
      } catch (err) {
        console.error('Error fetching link token:', err)
        setError(err instanceof Error ? err.message : 'Failed to initialize Plaid Link')
      }
    }

    fetchLinkToken()
  }, [])

  // Handle successful account connection
  const onSuccessCallback: PlaidLinkOnSuccess = useCallback(async (public_token: string, metadata) => {
    try {
      setLoading(true)
      setError(null)

      console.log('Plaid Link success! Public token:', public_token)
      console.log('Metadata:', metadata)

      // Step 1: Exchange public token for access token
      const exchangeResponse = await fetch('/api/plaid/exchange-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ public_token }),
      })

      if (!exchangeResponse.ok) {
        const errorData = await exchangeResponse.json()
        console.error('Exchange token error response:', errorData)
        throw new Error(errorData.error || 'Failed to exchange token')
      }

      const exchangeData = await exchangeResponse.json()
      console.log('Token exchanged successfully:', exchangeData)

      // Step 2: Sync all data (accounts, transactions, liabilities)
      const syncResponse = await fetch('/api/plaid/sync-all', {
        method: 'POST',
      })

      if (!syncResponse.ok) {
        console.warn('Sync failed, but token was exchanged')
      } else {
        const syncData = await syncResponse.json()
        console.log('Data synced successfully:', syncData)
      }

      // Step 3: Call the success callback to refresh the UI
      if (onSuccess) {
        onSuccess()
      }

      // Show success message
      alert('Bank account connected successfully! Your data is now syncing.')
    } catch (err) {
      console.error('Error in Plaid Link success handler:', err)
      setError(err instanceof Error ? err.message : 'Failed to connect account')
      alert(`Error: ${err instanceof Error ? err.message : 'Failed to connect account'}`)
    } finally {
      setLoading(false)
    }
  }, [onSuccess])

  // Configure Plaid Link
  const config: PlaidLinkOptions = {
    token: linkToken,
    onSuccess: onSuccessCallback,
    onExit: (err, metadata) => {
      if (err) {
        console.error('Plaid Link exited with error:', err)
        setError(err.error_message || 'Connection cancelled')
      } else {
        console.log('Plaid Link exited:', metadata)
      }
    },
    onEvent: (eventName, metadata) => {
      console.log('Plaid Link event:', eventName, metadata)
    },
  }

  const { open, ready } = usePlaidLink(config)

  // Show loading state while fetching link token
  if (!linkToken && !error) {
    return (
      <Button variant={variant} className={className} disabled>
        <Loader2 size={16} className="animate-spin" />
        <span className="ml-2">Initializing...</span>
      </Button>
    )
  }

  // Show error state
  if (error && !linkToken) {
    return (
      <Button
        variant={variant}
        className={className}
        onClick={() => window.location.reload()}
      >
        Retry Connection
      </Button>
    )
  }

  // Show the connect button
  return (
    <Button
      variant={variant}
      className={className}
      onClick={() => open()}
      disabled={!ready || loading}
    >
      {loading ? (
        <>
          <Loader2 size={16} className="animate-spin" />
          <span className="ml-2">Connecting...</span>
        </>
      ) : (
        <>
          <Plus size={16} />
          <span className="ml-2">Add Account</span>
        </>
      )}
    </Button>
  )
}
