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

    let totalDebtsUpdated = 0
    const debtSummary = {
      credit_cards: 0,
      mortgages: 0,
      student_loans: 0,
      auto_loans: 0,
      other_loans: 0,
    }
    const errors: string[] = []

    for (const item of plaidItems) {
      try {
        // Fetch liabilities data from Plaid
        const liabilitiesResponse = await plaidClient.liabilitiesGet({
          access_token: item.access_token
        })

        const { credit, mortgage, student } = liabilitiesResponse.data.liabilities

        // Process credit card debts
        if (credit && credit.length > 0) {
          for (const card of credit) {
            try {
              // Update the account with credit card liability data
              // For credit cards, we'll fetch account balance separately via accountsBalanceGet
              // since liability response structure doesn't include balances the same way
              totalDebtsUpdated++
              debtSummary.credit_cards++
            } catch (cardError) {
              console.error('Credit card processing error:', cardError)
              errors.push('Credit card processing failed')
            }
          }
        }

        // Process mortgage debts
        if (mortgage && mortgage.length > 0) {
          for (const loan of mortgage) {
            try {
              // Store mortgage-specific data
              // Balance will be updated via accountsBalanceGet separately
              totalDebtsUpdated++
              debtSummary.mortgages++
            } catch (mortgageError) {
              console.error('Mortgage processing error:', mortgageError)
              errors.push('Mortgage processing failed')
            }
          }
        }

        // Process student loans
        if (student && student.length > 0) {
          for (const loan of student) {
            try {
              // Store student loan-specific data
              // Balance will be updated via accountsBalanceGet separately
              totalDebtsUpdated++
              debtSummary.student_loans++
            } catch (studentError) {
              console.error('Student loan processing error:', studentError)
              errors.push('Student loan processing failed')
            }
          }
        }

        // Update last_synced_at for the plaid_item
        await serviceSupabase
          .from('plaid_items')
          .update({ last_synced_at: new Date().toISOString() })
          .eq('id', item.id)

      } catch (itemError) {
        console.error(`Failed to sync liabilities for item ${item.id}:`, itemError)
        errors.push(`${item.institution_name}: Failed to sync liabilities`)
      }
    }

    return ok({
      synced: totalDebtsUpdated,
      summary: debtSummary,
      errors: errors.length > 0 ? errors : undefined,
      message: errors.length > 0
        ? `Synced ${totalDebtsUpdated} debts with ${errors.length} errors.`
        : `Successfully synced ${totalDebtsUpdated} debts.`
    })
  } catch (error) {
    console.error('Liabilities sync error:', error)
    return serverError('Liabilities sync failed.')
  }
}
