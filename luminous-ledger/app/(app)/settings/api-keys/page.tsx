'use client'

import { useState } from 'react'
import { Copy, Check, Plus, Key } from 'lucide-react'
import { TopNav } from '@/components/layout/top-nav'
import { Button } from '@/components/ui/button'

// MOCK: Replace with real API keys from Supabase
const MOCK_API_KEYS = [
  {
    id: 'key_mock_1',
    name: 'Production Key',
    key_prefix: 'll_abc123',
    requests_used: 0,
    requests_limit: 10000,
    is_active: true,
    created_at: '2026-03-01T00:00:00Z',
    last_used_at: null as string | null,
  },
]

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function ApiKeyRow({ apiKey }: { apiKey: (typeof MOCK_API_KEYS)[0] }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(apiKey.key_prefix + '••••••••••••••••')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const usagePct = Math.round((apiKey.requests_used / apiKey.requests_limit) * 100)

  return (
    <div className="bg-surface-container-lowest rounded-2xl shadow-card p-6 flex flex-col gap-4">
      {/* Top row */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary flex-shrink-0">
            <Key size={18} />
          </div>
          <div>
            <p className="text-label-lg font-semibold text-on-surface">
              {apiKey.name ?? 'API Key'}
            </p>
            <p className="text-label-sm text-on-surface-variant mt-0.5">
              Created {formatDate(apiKey.created_at)}
              {apiKey.last_used_at && ` · Last used ${formatDate(apiKey.last_used_at)}`}
            </p>
          </div>
        </div>

        {/* Status */}
        <span
          className="rounded-full px-3 py-1 text-label-sm font-medium flex-shrink-0"
          style={{
            backgroundColor: apiKey.is_active ? 'rgba(26,107,58,0.12)' : 'rgba(172,173,177,0.15)',
            color: apiKey.is_active ? '#1a6b3a' : '#5a5b60',
          }}
        >
          {apiKey.is_active ? 'Active' : 'Inactive'}
        </span>
      </div>

      {/* Key display + copy */}
      <div className="flex items-center gap-3 bg-surface-container-low rounded-xl px-4 py-3">
        <code className="text-body-md font-mono text-on-surface flex-1 tracking-wider">
          {apiKey.key_prefix}
          <span className="text-on-surface-variant">••••••••••••••••</span>
        </code>
        <button
          type="button"
          onClick={handleCopy}
          className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all duration-150"
          aria-label="Copy API key prefix"
        >
          {copied ? <Check size={16} className="text-success" /> : <Copy size={16} />}
        </button>
      </div>

      {/* Usage */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="text-label-sm text-on-surface-variant">
            {apiKey.requests_used.toLocaleString()} / {apiKey.requests_limit.toLocaleString()} requests
          </p>
          <p className="text-label-sm text-on-surface-variant">{usagePct}%</p>
        </div>
        <div className="h-1.5 bg-surface-container-low rounded-full overflow-hidden">
          <div
            className="h-full bg-secondary rounded-full transition-all duration-500"
            style={{ width: `${usagePct}%` }}
          />
        </div>
      </div>
    </div>
  )
}

export default function ApiKeysPage() {
  const [showCreate, setShowCreate] = useState(false)

  return (
    <div className="flex flex-col min-h-full">
      <TopNav title="API Keys" />

      <div className="flex-1 px-8 pb-10 flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-body-md text-on-surface-variant">
            Use API keys to authenticate requests to the AI Fix My Money API.
          </p>
          <Button
            variant="primary"
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2"
          >
            <Plus size={16} />
            Create New Key
          </Button>
        </div>

        {/* Keys list */}
        <div className="flex flex-col gap-4">
          {MOCK_API_KEYS.map((key) => (
            <ApiKeyRow key={key.id} apiKey={key} />
          ))}
        </div>

        {/* Usage docs hint */}
        <div className="bg-secondary/5 rounded-2xl p-6">
          <p className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-2">
            How to use your API key
          </p>
          <pre className="text-sm font-mono text-on-surface bg-surface-container-lowest rounded-xl p-4 overflow-x-auto">
            <code>{`curl https://api.aifixmymoney.com/api/v1/summary \\
  -H "x-api-key: afmm_your_key_here"`}</code>
          </pre>
        </div>
      </div>
    </div>
  )
}
