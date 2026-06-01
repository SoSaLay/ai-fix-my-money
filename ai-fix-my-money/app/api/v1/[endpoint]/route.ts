import { type NextRequest } from 'next/server'
import { notFound } from '@/lib/api/response'
import { recordUsage } from '@/lib/api/usage'

/**
 * Catch-all for unmatched /api/v1/* routes.
 * Returns a 404 with a well-formed API error body and logs the attempt.
 */
async function handler(
  request: NextRequest,
  { params }: { params: Promise<{ endpoint: string }> },
) {
  const { endpoint } = await params
  const apiKeyId  = request.headers.get('x-api-key-id')
  const start     = Date.now()

  const ip        = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null
  const userAgent = request.headers.get('user-agent') ?? undefined

  if (apiKeyId) {
    await recordUsage({
      apiKeyId,
      endpoint:        `/api/v1/${endpoint}`,
      method:          request.method,
      statusCode:      404,
      responseTimeMs:  Date.now() - start,
      ipAddress:       ip ?? undefined,
      userAgent,
    })
  }

  return notFound(`The endpoint /api/v1/${endpoint} does not exist. Check the docs at /api/v1.`)
}

export const GET    = handler
export const POST   = handler
export const PUT    = handler
export const PATCH  = handler
export const DELETE = handler
