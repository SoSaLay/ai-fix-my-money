import { type NextRequest } from 'next/server'
import { CountryCode, Products } from 'plaid'
import { plaidClient } from '@/lib/plaid/client'
import { createClient } from '@/lib/supabase/server'
import { ok, unauthorized, serverError } from '@/lib/api/response'

export async function POST(_request: NextRequest) {
  // Get authenticated user from Supabase session
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return unauthorized('You must be logged in to connect a bank account.')
  }

  try {
    const response = await plaidClient.linkTokenCreate({
      user: { client_user_id: user.id },
      client_name: 'Luminous Ledger',
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: 'en',
    })

    return ok({ link_token: response.data.link_token })
  } catch (err) {
    console.error('Plaid linkTokenCreate error:', err)
    return serverError('Failed to create Plaid link token.')
  }
}
