import { type NextRequest, NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'
import { ok, serverError } from '@/lib/api/response'

const SNAPSHOT_FILE = join(process.cwd(), '.mcp-snapshots', 'latest.json')

export async function GET(_request: NextRequest) {
  try {
    const raw = readFileSync(SNAPSHOT_FILE, 'utf-8')
    const row = JSON.parse(raw) as { id: string; data: unknown; updated_at: string }
    return ok({ snapshot_id: row.id, data: row.data, updated_at: row.updated_at })
  } catch {
    // File doesn't exist yet — no snapshot available
    return ok({ snapshot: null, updated_at: null })
  }
}
