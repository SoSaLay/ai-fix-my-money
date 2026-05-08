import { type NextRequest } from 'next/server'
import { plaidClient } from '@/lib/plaid/client'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { ok, unauthorized, serverError, err } from '@/lib/api/response'

export async function POST(request: NextRequest) {
  // Get authenticated user (use regular client for auth check)
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return unauthorized('You must be logged in to connect a bank account.')
  }

  let public_token: string
  try {
    const body = await request.json()
    public_token = body.public_token
    if (!public_token) throw new Error('Missing public_token')
  } catch {
    return err('Request body must include public_token.', 400)
  }

  try {
    // Use service client for database operations (bypasses RLS)
    const serviceSupabase = await createServiceClient()

    // Ensure user exists in the users table (sometimes trigger doesn't fire)
    const { data: existingUser } = await serviceSupabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single()

    if (!existingUser) {
      // Create user record if it doesn't exist
      await serviceSupabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || null,
          avatar_url: user.user_metadata?.avatar_url || null,
        })
    }

    // Exchange public token for access token
    console.log('Exchanging public token with Plaid...')
    const exchangeResponse = await plaidClient.itemPublicTokenExchange({ public_token })
    const { access_token, item_id } = exchangeResponse.data
    console.log('Token exchanged successfully, item_id:', item_id)

    // Fetch institution info
    console.log('Fetching institution info...')
    const itemResponse = await plaidClient.itemGet({ access_token })
    const institutionId = itemResponse.data.item.institution_id
    console.log('Institution ID:', institutionId)

    let institutionName = 'Unknown Bank'
    if (institutionId) {
      try {
        const instResponse = await plaidClient.institutionsGetById({
          institution_id: institutionId,
          country_codes: ['US' as never],
        })
        institutionName = instResponse.data.institution.name
      } catch {
        // Non-fatal — institution name is cosmetic
      }
    }

    // Persist plaid_item to Supabase
    console.log('Inserting plaid_item into database...')
    console.log('Data to insert:', {
      user_id: user.id,
      plaid_item_id: item_id,
      institution_id: institutionId ?? 'unknown',
      institution_name: institutionName,
    })

    const { data: insertedItem, error: dbError } = await serviceSupabase
      .from('plaid_items')
      .insert({
        user_id:          user.id,
        plaid_item_id:    item_id,
        access_token,
        institution_id:   institutionId ?? 'unknown',
        institution_name: institutionName,
        status:           'active',
        cursor:           null,
      })
      .select()
      .single()

    if (dbError || !insertedItem) {
      console.error('❌ Supabase insert plaid_item error:', dbError)
      console.error('Error code:', dbError?.code)
      console.error('Error details:', dbError?.details)
      console.error('Error hint:', dbError?.hint)
      console.error('Full error:', JSON.stringify(dbError, null, 2))
      return serverError(`Failed to save bank connection: ${dbError?.message || 'Unknown error'}`)
    }

    console.log('✅ Plaid item inserted successfully:', insertedItem.id)

    // Fetch accounts from Plaid
    let accountCount = 0
    try {
      const accountsResponse = await plaidClient.accountsGet({ access_token })
      const accounts = accountsResponse.data.accounts

      // Store accounts in database
      const accountsToInsert = accounts.map(account => ({
        user_id:           user.id,
        plaid_item_id:     insertedItem.id,
        plaid_account_id:  account.account_id,
        name:              account.name,
        official_name:     account.official_name ?? null,
        type:              account.type,
        subtype:           account.subtype ?? null,
        mask:              account.mask ?? null,
        currency_code:     account.balances.iso_currency_code ?? 'USD',
        current_balance:   account.balances.current ?? null,
        available_balance: account.balances.available ?? null,
        is_selected:       true,
        is_active:         true,
      }))

      if (accountsToInsert.length > 0) {
        const { error: accountsError } = await serviceSupabase
          .from('accounts')
          .insert(accountsToInsert)

        if (accountsError) {
          console.error('Failed to insert accounts:', accountsError)
          // Don't fail the entire operation - item was saved successfully
        } else {
          accountCount = accountsToInsert.length
        }
      }
    } catch (accountError) {
      console.error('Failed to fetch accounts from Plaid:', accountError)
      // Don't fail - we can sync accounts later
    }

    return ok({
      success: true,
      institution_name: institutionName,
      accounts_synced: accountCount
    })
  } catch (error) {
    console.error('Plaid itemPublicTokenExchange error:', error)
    return serverError('Failed to exchange Plaid token.')
  }
}
