import { readFileSync } from 'fs'
import { join } from 'path'
import { NextResponse } from 'next/server'

// Serves the local financial-data.json file to the browser.
// The file lives at ai-fix-my-money/data/financial-data.json and is written
// directly by Perplexity Computer — see data/DATA_GUIDE.md for instructions.

export const dynamic = 'force-dynamic'

export async function GET() {
  const filePath = join(process.cwd(), 'data', 'financial-data.json')
  try {
    const raw = readFileSync(filePath, 'utf-8')
    const data = JSON.parse(raw)
    // Return the absolute file path so the UI can embed it in the Perplexity prompt
    return NextResponse.json({ ok: true, data, filePath })
  } catch {
    return NextResponse.json(
      { ok: false, error: 'financial-data.json not found or invalid. See data/DATA_GUIDE.md.', filePath },
      { status: 404 },
    )
  }
}
