import { type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { ok, serverError } from '@/lib/api/response'
import { recordUsage } from '@/lib/api/usage'

function getServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

// Manual shape types to avoid generated-type conflicts on joined queries
interface BudgetCategoryShape {
  id: string
  name: string
  color: string | null
  icon: string | null
}

interface BudgetLimitShape {
  id: string
  monthly_limit: number
  category_id: string
  budget_categories: BudgetCategoryShape | BudgetCategoryShape[] | null
}

export async function GET(request: NextRequest) {
  const start     = Date.now()
  const apiKeyId  = request.headers.get('x-api-key-id')!
  const userId    = request.headers.get('x-api-user-id')

  const ip        = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? undefined
  const userAgent = request.headers.get('user-agent') ?? undefined

  if (!userId) {
    await recordUsage({ apiKeyId, endpoint: '/api/v1/budget', method: 'GET', statusCode: 403, responseTimeMs: Date.now() - start, ipAddress: ip, userAgent })
    return serverError('API key is not associated with a user account.')
  }

  try {
    const supabase = getServiceClient()

    // Current month
    const now        = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

    // Fetch budget limits with category names via join
    const { data: limitsRaw, error: limitsError } = await supabase
      .from('budget_limits')
      .select('id, monthly_limit, category_id, budget_categories ( id, name, color, icon )')
      .eq('user_id', userId)

    if (limitsError) throw limitsError

    const limits = (limitsRaw ?? []) as unknown as BudgetLimitShape[]

    // Fetch current month transactions to aggregate spend per category
    const { data: transactionsRaw, error: txError } = await supabase
      .from('transactions')
      .select('plaid_category, amount')
      .eq('user_id', userId)
      .eq('pending', false)
      .gte('transaction_date', monthStart)
      .lte('transaction_date', monthEnd)
      .gt('amount', 0) // expenses only

    if (txError) throw txError

    // Aggregate spend by category name (first element of plaid_category array)
    const spendByCategory: Record<string, number> = {}
    for (const tx of (transactionsRaw ?? []) as Array<{ plaid_category: string[] | null; amount: number }>) {
      const cat = tx.plaid_category && tx.plaid_category.length > 0
        ? tx.plaid_category[0]
        : 'Other'
      spendByCategory[cat] = (spendByCategory[cat] ?? 0) + tx.amount
    }

    // Merge limits + actual spend
    const budgetData = limits.map((limit) => {
      const category = Array.isArray(limit.budget_categories)
        ? limit.budget_categories[0]
        : limit.budget_categories
      const categoryName = category?.name ?? 'Unknown'
      const spent         = spendByCategory[categoryName] ?? 0
      const monthlyLimit  = limit.monthly_limit

      return {
        category:        categoryName,
        color:           category?.color ?? '#acadb1',
        icon:            category?.icon  ?? null,
        monthly_limit:   Math.round(monthlyLimit  * 100) / 100,
        spent:           Math.round(spent         * 100) / 100,
        remaining:       Math.round((monthlyLimit - spent) * 100) / 100,
        utilization_pct: monthlyLimit > 0 ? Math.round((spent / monthlyLimit) * 100) : 0,
      }
    })

    await recordUsage({
      apiKeyId,
      endpoint:       '/api/v1/budget',
      method:         'GET',
      statusCode:     200,
      responseTimeMs: Date.now() - start,
      ipAddress:      ip,
      userAgent,
    })

    return ok(budgetData, { month: monthStart.slice(0, 7) })
  } catch (err) {
    console.error('/api/v1/budget error:', err)

    await recordUsage({
      apiKeyId,
      endpoint:       '/api/v1/budget',
      method:         'GET',
      statusCode:     500,
      responseTimeMs: Date.now() - start,
      ipAddress:      ip,
      userAgent,
    })

    return serverError('Failed to fetch budget data.')
  }
}
