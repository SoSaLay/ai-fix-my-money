import { type NextRequest } from 'next/server'
import { plaidClient } from '@/lib/plaid/client'
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

    let totalAccountsUpdated = 0
    const errors: string[] = []

    for (const item of plaidItems) {
      try {
        // Fetch current account balances from Plaid
        const accountsResponse = await plaidClient.accountsBalanceGet({
          access_token: item.access_token
        })

        const accounts = accountsResponse.data.accounts

        // Update each account's balance in the database
        for (const account of accounts) {
          const { error: updateError } = await serviceSupabase
            .from('accounts')
            .update({
              current_balance: account.balances.current ?? null,
              available_balance: account.balances.available ?? null,
              updated_at: new Date().toISOString(),
            })
            .eq('plaid_account_id', account.account_id)
            .eq('user_id', user.id)

          if (updateError) {
            console.error(`Failed to update account ${account.account_id}:`, updateError)
            errors.push(`Account ${account.name}: ${updateError.message}`)
          } else {
            totalAccountsUpdated++
          }
        }

        // Update last_synced_at for the plaid_item
        await serviceSupabase
          .from('plaid_items')
          .update({ last_synced_at: new Date().toISOString() })
          .eq('id', item.id)

      } catch (itemError) {
        console.error(`Failed to sync accounts for item ${item.id}:`, itemError)
        errors.push(`${item.institution_name}: Failed to sync`)
      }
    }

    return ok({
      synced: totalAccountsUpdated,
      errors: errors.length > 0 ? errors : undefined,
      message: errors.length > 0
        ? `Synced ${totalAccountsUpdated} accounts with ${errors.length} errors.`
        : `Successfully synced ${totalAccountsUpdated} accounts.`
    })
  } catch (error) {
    console.error('Account sync error:', error)
    return serverError('Account sync failed.')
  }
}
