import { createClient } from '@supabase/supabase-js'
import type { Database, UsageLogRow } from '@/types/database'

function getServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function recordUsage({
  apiKeyId,
  endpoint,
  method,
  statusCode,
  responseTimeMs,
  ipAddress,
  userAgent,
}: {
  apiKeyId: string
  endpoint: string
  method: string
  statusCode: number
  responseTimeMs?: number
  ipAddress?: string
  userAgent?: string
}) {
  const supabase = getServiceClient()

  // Insert usage log
  await (supabase.from('usage_logs').insert as any)({
    api_key_id:       apiKeyId,
    endpoint,
    method,
    status_code:      statusCode,
    response_time_ms: responseTimeMs ?? null,
    ip_address:       ipAddress ?? null,
    user_agent:       userAgent ?? null,
  })

  // Increment API key usage counter
  const { data } = await supabase
    .from('api_keys')
    .select('requests_used')
    .eq('id', apiKeyId)
    .single()

  if (data) {
    await (supabase
      .from('api_keys')
      .update as any)({ requests_used: (data as any).requests_used + 1 })
      .eq('id', apiKeyId)
  }
}
