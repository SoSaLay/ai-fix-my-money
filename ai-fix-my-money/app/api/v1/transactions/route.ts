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

type TxSelectRow = Pick<
  TransactionRow,
  'id' | 'name' | 'merchant_name' | 'amount' | 'currency_code' | 'transaction_date' | 'plaid_category' | 'pending'
>

export async function GET(request: NextRequest) {
  const start     = Date.now()
  const apiKeyId  = request.headers.get('x-api-key-id')!
  const userId    = request.headers.get('x-api-user-id')

  const ip        = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? undefined
  const userAgent = request.headers.get('user-agent') ?? undefined

  if (!userId) {
    await recordUsage({ apiKeyId, endpoint: '/api/v1/transactions', method: 'GET', statusCode: 403, responseTimeMs: Date.now() - start, ipAddress: ip, userAgent })
    return serverError('API key is not associated with a user account.')
  }

  const { searchParams } = new URL(request.url)
  const limit  = Math.min(parseInt(searchParams.get('limit')  ?? '20', 10), 100)
  const offset = Math.max(parseInt(searchParams.get('offset') ?? '0',  10), 0)

  try {
    const supabase = getServiceClient()

    const { data: rawData, error, count } = await supabase
      .from('transactions')
      .select(
        'id, name, merchant_name, amount, currency_code, transaction_date, plaid_category, pending',
        { count: 'exact' },
      )
      .eq('user_id', userId)
      .order('transaction_date', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    // Cast to known shape and normalize plaid_category from string[] | null → string | null
    const transactions = (rawData ?? []) as unknown as TxSelectRow[]
    const normalized = transactions.map((tx) => ({
      id:              tx.id,
      name:            tx.name,
      merchant_name:   tx.merchant_name,
      amount:          tx.amount,
      currency_code:   tx.currency_code,
      transaction_date: tx.transaction_date,
      plaid_category:  tx.plaid_category && tx.plaid_category.length > 0
        ? tx.plaid_category[0]
        : null,
      pending: tx.pending,
    }))

    await recordUsage({
      apiKeyId,
      endpoint:       '/api/v1/transactions',
      method:         'GET',
      statusCode:     200,
      responseTimeMs: Date.now() - start,
      ipAddress:      ip,
      userAgent,
    })

    return ok(normalized, { total: count ?? 0, limit, offset })
  } catch (err) {
    console.error('/api/v1/transactions error:', err)

    await recordUsage({
      apiKeyId,
      endpoint:       '/api/v1/transactions',
      method:         'GET',
      statusCode:     500,
      responseTimeMs: Date.now() - start,
      ipAddress:      ip,
      userAgent,
    })

    return serverError('Failed to fetch transactions.')
  }
}
