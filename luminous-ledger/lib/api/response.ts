import { NextResponse } from 'next/server'

export function ok<T>(data: T, meta?: Record<string, unknown>) {
  return NextResponse.json({ data, ...(meta ? { meta } : {}) }, { status: 200 })
}

export function created<T>(data: T) {
  return NextResponse.json({ data }, { status: 201 })
}

export function err(message: string, status: number, code?: string) {
  return NextResponse.json({ error: message, ...(code ? { code } : {}) }, { status })
}

export const unauthorized  = (msg = 'Unauthorized')       => err(msg, 401)
export const forbidden     = (msg = 'Forbidden')           => err(msg, 403)
export const notFound      = (msg = 'Not found')           => err(msg, 404)
export const rateLimited   = (used: number, limit: number) =>
  NextResponse.json({ error: 'Rate limit exceeded', used, limit }, { status: 429 })
export const serverError   = (msg = 'Internal server error') => err(msg, 500)
