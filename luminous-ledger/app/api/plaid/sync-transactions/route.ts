import { type NextRequest } from 'next/server'
import { plaidClient } from '@/lib/plaid/client'
import { mapPlaidCategory } from '@/lib/plaid/helpers'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { ok, unauthorized, serverError } from '@/lib/api/response'

export async function POST(_request: NextRequest) {
  // Use regular client for auth
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return unauthorized('Authentication required.')
  }

  // Use service client for database operations (bypasses RLS)
  const serviceSupabase = await createServiceClient()

  try {
    // Fetch all active plaid_items for this user
    const { data: plaidItems, error: itemsError } = await serviceSupabase
      .from('plaid_items')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')

    if (itemsError) {
      console.error('Failed to fetch plaid items:', itemsError)
      return serverError('Failed to retrieve bank connections.')
    }

    if (!plaidItems || plaidItems.length === 0) {
      return ok({ synced: 0, message: 'No active bank connections found.' })
    }

    let totalSynced = 0

    // First, fetch all accounts for this user to create a mapping
    const { data: userAccounts, error: accountsError } = await serviceSupabase
      .from('accounts')
      .select('id, plaid_account_id')
      .eq('user_id', user.id)

    if (accountsError) {
      console.error('Failed to fetch user accounts:', accountsError)
      return serverError('Failed to retrieve accounts for transaction sync.')
    }

    // Create a map: plaid_account_id -> database account UUID
    const accountIdMap = new Map<string, string>()
    for (const account of userAccounts || []) {
      accountIdMap.set(account.plaid_account_id, account.id)
    }

    for (const item of plaidItems) {
      let cursor = item.cursor ?? undefined
      let hasMore = true

      while (hasMore) {
        const syncResponse = await plaidClient.transactionsSync({
          access_token: item.access_token,
          cursor,
        })

        const { added, modified, removed, next_cursor, has_more } = syncResponse.data

        // Build category array for mapped category
        const toUpsertRows = [...added, ...modified]
          .map((tx) => {
            // Map Plaid account_id to our database UUID
            const dbAccountId = accountIdMap.get(tx.account_id)
            if (!dbAccountId) {
              console.warn(`Account ID not found for transaction ${tx.transaction_id}`)
              return null
            }

            // Improve category mapping
            let rawCategories: string[] = []
            let mappedCategory = 'Other'

            if (tx.personal_finance_category?.primary) {
              // Use personal_finance_category when available
              rawCategories = [tx.personal_finance_category.primary]
              if (tx.personal_finance_category.detailed) {
                rawCategories.push(tx.personal_finance_category.detailed)
              }
              mappedCategory = mapPlaidCategory([tx.personal_finance_category.primary])
            } else if (tx.category && tx.category.length > 0) {
              // Fall back to category array
              rawCategories = tx.category
              mappedCategory = mapPlaidCategory(tx.category)
            }

            // Detect recurring transactions
            const isRecurring = !!tx.personal_finance_category?.primary?.toLowerCase().includes('recurring')

            return {
              user_id:              user.id,
              account_id:           dbAccountId, // Fixed: now using DB UUID
              plaid_transaction_id: tx.transaction_id,
              name:                 tx.name,
              merchant_name:        tx.merchant_name ?? null,
              amount:               tx.amount,
              currency_code:        tx.iso_currency_code ?? 'USD',
              transaction_date:     tx.date,
              authorized_date:      tx.authorized_date ?? null,
              // Store the first category from the array
              plaid_category:       rawCategories.length > 0 ? [rawCategories[0]] : [mappedCategory],
              pending:              tx.pending,
              is_recurring:         isRecurring,
              recurring_stream_id:  null, // Can be enhanced with actual stream detection
              notes:                null,
            }
          })
          .filter((row): row is NonNullable<typeof row> => row !== null)

        if (toUpsertRows.length > 0) {
          // Use type assertion since Supabase generated types may not match exactly
          const { error: upsertError } = await (serviceSupabase
            .from('transactions') as ReturnType<typeof serviceSupabase.from>)
            .upsert(toUpsertRows as never, { onConflict: 'plaid_transaction_id' })

          if (upsertError) {
            console.error('Transaction upsert error:', upsertError)
          } else {
            totalSynced += toUpsertRows.length
          }
        }

        // Remove deleted transactions
        if (removed.length > 0) {
          const removedIds = removed.map((r) => r.transaction_id)
          await serviceSupabase
            .from('transactions')
            .delete()
            .in('plaid_transaction_id', removedIds)
        }

        cursor  = next_cursor
        hasMore = has_more
      }

      // Update cursor and last_synced_at
      await serviceSupabase
        .from('plaid_items')
        .update({
          cursor:         cursor ?? null,
          last_synced_at: new Date().toISOString(),
        })
        .eq('id', item.id)
    }

    return ok({ synced: totalSynced })
  } catch (error) {
    console.error('Transaction sync error:', error)
    return serverError('Transaction sync failed.')
  }
}
