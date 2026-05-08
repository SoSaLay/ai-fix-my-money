import { type NextRequest } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { ok, unauthorized, serverError } from '@/lib/api/response'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return unauthorized('Authentication required.')
  }

  try {
    const results = {
      accounts: { synced: 0, success: false, error: null as string | null },
      transactions: { synced: 0, success: false, error: null as string | null },
      liabilities: { synced: 0, success: false, error: null as string | null },
    }

    // 1. Sync accounts (balances)
    try {
      const accountsResponse = await fetch(
        new URL('/api/plaid/sync-accounts', request.url),
        {
          method: 'POST',
          headers: request.headers,
        }
      )

      if (accountsResponse.ok) {
        const data = await accountsResponse.json()
        results.accounts.synced = data.synced || 0
        results.accounts.success = true
      } else {
        const errorData = await accountsResponse.json()
        results.accounts.error = errorData.error || 'Failed to sync accounts'
      }
    } catch (accountsError) {
      console.error('Accounts sync failed:', accountsError)
      results.accounts.error = 'Accounts sync request failed'
    }

    // 2. Sync transactions
    try {
      const transactionsResponse = await fetch(
        new URL('/api/plaid/sync-transactions', request.url),
        {
          method: 'POST',
          headers: request.headers,
        }
      )

      if (transactionsResponse.ok) {
        const data = await transactionsResponse.json()
        results.transactions.synced = data.synced || 0
        results.transactions.success = true
      } else {
        const errorData = await transactionsResponse.json()
        results.transactions.error = errorData.error || 'Failed to sync transactions'
      }
    } catch (transactionsError) {
      console.error('Transactions sync failed:', transactionsError)
      results.transactions.error = 'Transactions sync request failed'
    }

    // 3. Sync liabilities (debts)
    try {
      const liabilitiesResponse = await fetch(
        new URL('/api/plaid/sync-liabilities', request.url),
        {
          method: 'POST',
          headers: request.headers,
        }
      )

      if (liabilitiesResponse.ok) {
        const data = await liabilitiesResponse.json()
        results.liabilities.synced = data.synced || 0
        results.liabilities.success = true
      } else {
        const errorData = await liabilitiesResponse.json()
        results.liabilities.error = errorData.error || 'Failed to sync liabilities'
      }
    } catch (liabilitiesError) {
      console.error('Liabilities sync failed:', liabilitiesError)
      results.liabilities.error = 'Liabilities sync request failed'
    }

    // Determine overall success
    const allSuccessful = results.accounts.success &&
                          results.transactions.success &&
                          results.liabilities.success

    const totalSynced = results.accounts.synced +
                        results.transactions.synced +
                        results.liabilities.synced

    return ok({
      success: allSuccessful,
      total_synced: totalSynced,
      details: results,
      message: allSuccessful
        ? `Successfully synced all data: ${results.accounts.synced} accounts, ${results.transactions.synced} transactions, ${results.liabilities.synced} liabilities.`
        : `Partial sync completed. Check details for errors.`
    })
  } catch (error) {
    console.error('Sync-all error:', error)
    return serverError('Failed to complete sync operation.')
  }
}
