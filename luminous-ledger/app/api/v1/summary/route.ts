import { type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database, TransactionRow } from '@/types/database'
import { ok, serverError } from '@/lib/api/response'
import { recordUsage } from '@/lib/api/usage'

function getServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

type TxRow = Pick<TransactionRow, 'amount' | 'plaid_category'>

export async function GET(request: NextRequest) {
  const start     = Date.now()
  const apiKeyId  = request.headers.get('x-api-key-id')!
  const userId    = request.headers.get('x-api-user-id')

  const ip        = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? undefined
  const userAgent = request.headers.get('user-agent') ?? undefined

  if (!userId) {
    await recordUsage({ apiKeyId, endpoint: '/api/v1/summary', method: 'GET', statusCode: 403, responseTimeMs: Date.now() - start, ipAddress: ip, userAgent })
    return serverError('API key is not associated with a user account.')
  }

  try {
    const supabase = getServiceClient()

    // Current month date range
    const now        = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

    // Fetch transactions for the current month
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('amount, plaid_category')
      .eq('user_id', userId)
      .gte('transaction_date', monthStart)
      .lte('transaction_date', monthEnd)
      .eq('pending', false)

    if (error) throw error

    const rows = (transactions ?? []) as TxRow[]

    // Plaid convention: positive amount = money out (expense), negative = money in (income)
    let income   = 0
    let spending = 0
    const categoryTotals: Record<string, number> = {}

    for (const tx of rows) {
      if (tx.amount < 0) {
        income += Math.abs(tx.amount)
      } else {
        spending += tx.amount
        // plaid_category is string[] | null
        const cat = (tx.plaid_category && tx.plaid_category.length > 0)
          ? tx.plaid_category[0]
          : 'Other'
        categoryTotals[cat] = (categoryTotals[cat] ?? 0) + tx.amount
      }
    }

    // Top 5 categories by spend
    const topCategories = Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, amount]) => ({ name, amount: Math.round(amount * 100) / 100 }))

    const netCashFlow = Math.round((income - spending) * 100) / 100

    const responseData = {
      income:        Math.round(income   * 100) / 100,
      spending:      Math.round(spending * 100) / 100,
      netCashFlow,
      topCategories,
    }

    await recordUsage({
      apiKeyId,
      endpoint:       '/api/v1/summary',
      method:         'GET',
      statusCode:     200,
      responseTimeMs: Date.now() - start,
      ipAddress:      ip,
      userAgent,
    })

    return ok(responseData)
  } catch (err) {
    console.error('/api/v1/summary error:', err)

    await recordUsage({
      apiKeyId,
      endpoint:       '/api/v1/summary',
      method:         'GET',
      statusCode:     500,
      responseTimeMs: Date.now() - start,
      ipAddress:      ip,
      userAgent,
    })

    return serverError('Failed to compute summary.')
  }
}
