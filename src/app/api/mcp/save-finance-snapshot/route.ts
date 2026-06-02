import { type NextRequest } from 'next/server'
import { parsePerplexityData } from '@/lib/perplexity/parser'
import { ok, unauthorized, serverError, err } from '@/lib/api/response'
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

function authenticate(request: NextRequest): boolean {
  const secret = process.env.MCP_SECRET
  if (!secret) return false
  const auth = request.headers.get('authorization') ?? ''
  return auth === `Bearer ${secret}`
}

const SNAPSHOT_DIR = join(process.cwd(), '.mcp-snapshots')
const SNAPSHOT_FILE = join(SNAPSHOT_DIR, 'latest.json')

export async function POST(request: NextRequest) {
  if (!authenticate(request)) return unauthorized()

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return err('Invalid JSON body', 400)
  }

  const result = parsePerplexityData(body)
  if (!result.success || !result.data) {
    return err(`Validation failed: ${result.errors.join(', ')}`, 422)
  }

  const now = new Date().toISOString()
  const id = `snap_${Date.now()}`

  try {
    mkdirSync(SNAPSHOT_DIR, { recursive: true })
    writeFileSync(SNAPSHOT_FILE, JSON.stringify({ id, data: result.data, updated_at: now }), 'utf-8')
  } catch (writeErr) {
    console.error('[save-finance-snapshot]', writeErr)
    return serverError('Failed to write snapshot to disk.')
  }

  return ok({
    success: true,
    snapshot_id: id,
    updated_at: now,
    message: 'Finance dashboard updated successfully.',
    warnings: result.warnings,
  })
}
