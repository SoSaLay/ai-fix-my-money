import { type NextRequest, NextResponse } from 'next/server'
import { parsePerplexityData } from '@/lib/perplexity/parser'
import { writeFileSync, readFileSync, mkdirSync } from 'fs'
import { join } from 'path'

// ── Auth ──────────────────────────────────────────────────────────────────────

function authenticate(request: NextRequest): boolean {
  const secret = process.env.MCP_SECRET
  if (!secret) return false
  const auth = request.headers.get('authorization') ?? ''
  return auth === `Bearer ${secret}`
}

// ── Local snapshot file ───────────────────────────────────────────────────────

const SNAPSHOT_DIR = join(process.cwd(), '.mcp-snapshots')
const SNAPSHOT_FILE = join(SNAPSHOT_DIR, 'latest.json')

function writeSnapshot(data: unknown): { id: string; updated_at: string } {
  mkdirSync(SNAPSHOT_DIR, { recursive: true })
  const updated_at = new Date().toISOString()
  const id = `snap_${Date.now()}`
  writeFileSync(SNAPSHOT_FILE, JSON.stringify({ id, data, updated_at }), 'utf-8')
  return { id, updated_at }
}

// ── MCP tool: save_finance_snapshot ──────────────────────────────────────────

async function saveFinanceSnapshot(args: Record<string, unknown>): Promise<{
  success: boolean
  snapshot_id?: string
  updated_at?: string
  message: string
  warnings?: string[]
}> {
  const financeJson = args.finance_json ?? args
  const result = parsePerplexityData(financeJson)

  if (!result.success || !result.data) {
    return {
      success: false,
      message: `Finance JSON validation failed: ${result.errors.join(', ')}`,
    }
  }

  try {
    const { id, updated_at } = writeSnapshot(result.data)
    return {
      success: true,
      snapshot_id: id,
      updated_at,
      message: 'Finance dashboard updated successfully.',
      warnings: result.warnings,
    }
  } catch (err) {
    console.error('[MCP] Failed to write snapshot:', err)
    return { success: false, message: 'Failed to write snapshot to disk.' }
  }
}

// ── MCP tool registry ─────────────────────────────────────────────────────────

const TOOLS = [
  {
    name: 'save_finance_snapshot',
    description:
      'Save a structured finance snapshot to the AI Fix My Money dashboard. ' +
      'The dashboard will automatically update within seconds. ' +
      'Pass the normalized finance JSON as the finance_json argument.',
    inputSchema: {
      type: 'object',
      properties: {
        finance_json: {
          type: 'object',
          description:
            'Normalized finance JSON with keys: income, expenses_fixed, expenses_variable, subscriptions, accounts, summary.',
        },
      },
      required: ['finance_json'],
    },
  },
]

// ── JSON-RPC helpers ──────────────────────────────────────────────────────────

function rpcOk(id: unknown, result: unknown) {
  return NextResponse.json({ jsonrpc: '2.0', id, result })
}

function rpcError(id: unknown, code: number, message: string) {
  return NextResponse.json({ jsonrpc: '2.0', id, error: { code, message } })
}

// ── GET — open SSE channel for Streamable HTTP transport ─────────────────────

export async function GET(request: NextRequest) {
  if (!authenticate(request)) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const encoder = new TextEncoder()
  let intervalId: ReturnType<typeof setInterval>

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(': connected\n\n'))
      intervalId = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': ping\n\n'))
        } catch {
          clearInterval(intervalId)
        }
      }, 15_000)
    },
    cancel() {
      clearInterval(intervalId)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}

// ── DELETE — session termination ──────────────────────────────────────────────

export async function DELETE() {
  return new NextResponse(null, { status: 200 })
}

// ── POST — MCP JSON-RPC handler ───────────────────────────────────────────────

export async function POST(request: NextRequest) {
  if (!authenticate(request)) {
    return NextResponse.json(
      { jsonrpc: '2.0', id: null, error: { code: -32001, message: 'Unauthorized' } },
      { status: 401 },
    )
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return rpcError(null, -32700, 'Parse error')
  }

  const { id, method, params } = body as {
    id: unknown
    method: string
    params?: Record<string, unknown>
  }

  if (method === 'initialize') {
    return rpcOk(id, {
      protocolVersion: '2024-11-05',
      capabilities: { tools: {} },
      serverInfo: { name: 'ai-fix-my-money', version: '1.0.0' },
    })
  }

  if (method === 'tools/list') {
    return rpcOk(id, { tools: TOOLS })
  }

  if (method === 'tools/call') {
    const name = (params as Record<string, unknown>)?.name as string
    const args = ((params as Record<string, unknown>)?.arguments ?? {}) as Record<string, unknown>

    if (name === 'save_finance_snapshot') {
      const toolResult = await saveFinanceSnapshot(args)
      return rpcOk(id, {
        content: [{ type: 'text', text: JSON.stringify(toolResult, null, 2) }],
        isError: !toolResult.success,
      })
    }

    return rpcError(id, -32601, `Unknown tool: ${name}`)
  }

  if (typeof method === 'string' && method.startsWith('notifications/')) {
    return new NextResponse(null, { status: 204 })
  }

  return rpcError(id, -32601, `Method not found: ${method}`)
}
