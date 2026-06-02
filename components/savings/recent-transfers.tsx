import Link from 'next/link'
import { ArrowUp, Plus, Circle } from 'lucide-react'
import { clsx } from 'clsx'

export interface Transfer {
  type: 'auto_allocation' | 'interest' | 'manual' | 'investment'
  amount: number
  description: string | null
  created_at: string
}

interface RecentTransfersProps {
  transfers: Transfer[]
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatAmount(amount: number): { str: string; isNegative: boolean } {
  const isNegative = amount < 0
  const abs = Math.abs(amount)
  return {
    str: `${isNegative ? '-' : '+'}$${abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    isNegative,
  }
}

function TransferIcon({ type }: { type: Transfer['type'] }) {
  if (type === 'auto_allocation' || type === 'investment') {
    return (
      <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant flex-shrink-0">
        <ArrowUp size={18} />
      </div>
    )
  }
  if (type === 'interest') {
    return (
      <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant flex-shrink-0">
        <Plus size={18} />
      </div>
    )
  }
  return (
    <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant flex-shrink-0">
      <Circle size={18} />
    </div>
  )
}

export function RecentTransfers({ transfers }: RecentTransfersProps) {
  return (
    <div className="bg-surface-container-lowest rounded-2xl shadow-card p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-headline-sm text-on-surface">Recent Transfers</h3>
        <Link
          href="/accounts"
          className="text-label-md text-secondary font-medium hover:opacity-75 transition-opacity duration-150"
        >
          View Ledger
        </Link>
      </div>

      {/* Horizontal scroll row */}
      <div className="flex gap-4 overflow-x-auto scrollbar-thin pb-1">
        {transfers.map((transfer, i) => {
          const { str: amountStr, isNegative } = formatAmount(transfer.amount)

          return (
            <div
              key={i}
              className="flex-shrink-0 bg-surface-container-low rounded-2xl p-4 flex flex-col gap-3 min-w-[180px]"
            >
              <TransferIcon type={transfer.type} />

              <div>
                <p className="text-label-lg font-medium text-on-surface line-clamp-2">
                  {transfer.description ?? transfer.type}
                </p>
                <p className="text-label-sm text-on-surface-variant mt-0.5">
                  {formatDate(transfer.created_at)}
                </p>
              </div>

              <p
                className={clsx(
                  'text-label-lg font-semibold',
                  isNegative ? 'text-error' : 'text-success',
                )}
              >
                {amountStr}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
