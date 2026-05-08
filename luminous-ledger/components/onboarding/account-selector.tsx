'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export interface SelectableAccount {
  id: string
  name: string
  type: string
  subtype: string | null
  mask: string | null
  institution_name: string
  current_balance: number | null
}

interface AccountSelectorProps {
  accounts: SelectableAccount[]
  onSubmit: (selectedIds: string[]) => void
}

function formatBalance(balance: number | null): string {
  if (balance === null) return 'N/A'
  return `$${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function AccountSelector({ accounts, onSubmit }: AccountSelectorProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(accounts.map((a) => a.id)),
  )

  const toggleAccount = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleSubmit = () => {
    onSubmit(Array.from(selectedIds))
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        {accounts.map((account) => {
          const isSelected = selectedIds.has(account.id)

          return (
            <label
              key={account.id}
              className="flex items-center gap-4 bg-surface-container-lowest rounded-2xl shadow-card p-4 cursor-pointer hover:bg-surface-container-low/50 transition-colors duration-150"
            >
              {/* Checkbox */}
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleAccount(account.id)}
                className="w-5 h-5 rounded accent-secondary cursor-pointer flex-shrink-0"
              />

              {/* Account icon */}
              <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-label-md font-semibold text-on-surface-variant flex-shrink-0">
                {account.institution_name.charAt(0).toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-label-sm text-on-surface-variant">{account.institution_name}</p>
                <p className="text-label-lg font-medium text-on-surface">
                  {account.name}{account.mask ? ` ···${account.mask}` : ''}
                </p>
                <p className="text-label-sm text-on-surface-variant capitalize">
                  {account.subtype ?? account.type}
                </p>
              </div>

              {/* Balance */}
              <p className="text-label-lg font-semibold text-on-surface flex-shrink-0">
                {formatBalance(account.current_balance)}
              </p>
            </label>
          )
        })}
      </div>

      <Button
        variant="primary"
        onClick={handleSubmit}
        disabled={selectedIds.size === 0}
        className="w-full justify-center text-center"
      >
        Continue with {selectedIds.size} account{selectedIds.size !== 1 ? 's' : ''}
      </Button>
    </div>
  )
}
