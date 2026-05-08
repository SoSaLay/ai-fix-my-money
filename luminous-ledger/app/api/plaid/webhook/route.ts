import { type NextRequest, NextResponse } from 'next/server'

/**
 * Plaid webhook handler.
 *
 * Plaid sends webhook events to notify us when new data is available.
 * We handle TRANSACTIONS_SYNC_UPDATES_AVAILABLE by kicking off a background sync.
 * All other events are acknowledged with 200 and logged.
 */
export async function POST(request: NextRequest) {
  let body: {
    webhook_type?: string
    webhook_code?: string
    item_id?: string
    [key: string]: unknown
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { webhook_type, webhook_code, item_id } = body

  console.log('[Plaid Webhook]', { webhook_type, webhook_code, item_id })

  // Handle transaction sync events
  if (
    webhook_type === 'TRANSACTIONS' &&
    webhook_code === 'SYNC_UPDATES_AVAILABLE'
  ) {
    // Fire-and-forget: trigger sync for this item
    // In production this should enqueue a background job (e.g. Vercel Cron, QStash)
    fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/plaid/sync-transactions`, {
      method: 'POST',
      headers: {
        // Pass a service secret to bypass user auth requirement in sync route
        // (or use a service-role Supabase session)
        'x-webhook-secret': process.env.PLAID_WEBHOOK_SECRET ?? '',
      },
    }).catch((err) => console.error('Webhook-triggered sync error:', err))
  }

  // Always return 200 to acknowledge receipt
  return NextResponse.json({ received: true }, { status: 200 })
}
