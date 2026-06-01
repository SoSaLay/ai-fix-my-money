'use client'

import { useRouter } from 'next/navigation'
import { TopNav } from '@/components/layout/top-nav'
import { AccountSelector } from '@/components/onboarding/account-selector'
import type { SelectableAccount } from '@/components/onboarding/account-selector'

// MOCK: Replace with accounts fetched after Plaid token exchange
const MOCK_ACCOUNTS: SelectableAccount[] = [
  {
    id: 'acc_mock_1',
    name: 'Total Checking',
    type: 'depository',
    subtype: 'checking',
    mask: '4521',
    institution_name: 'Chase Bank',
    current_balance: 12_450.00,
  },
  {
    id: 'acc_mock_2',
    name: 'Premier Savings',
    type: 'depository',
    subtype: 'savings',
    mask: '8834',
    institution_name: 'Chase Bank',
    current_balance: 28_900.00,
  },
  {
    id: 'acc_mock_3',
    name: 'Freedom Unlimited',
    type: 'credit',
    subtype: 'credit card',
    mask: '1294',
    institution_name: 'Chase Bank',
    current_balance: -1_842.50,
  },
]

export default function OnboardingAccountsPage() {
  const router = useRouter()

  const handleSubmit = async (selectedIds: string[]) => {
    try {
      // TODO: POST selected account IDs to save user's account selection
      console.log('Selected accounts:', selectedIds)
      router.push('/onboarding/processing')
    } catch (err) {
      console.error('Account selection error:', err)
    }
  }

  return (
    <div className="flex flex-col min-h-full">
      <TopNav title="Select Accounts" />

      <div className="flex-1 px-8 pb-10 flex flex-col items-center justify-start pt-4">
        <div className="w-full max-w-lg flex flex-col gap-6">
          {/* Step indicator */}
          <div className="flex items-center gap-2 justify-center">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-label-sm font-semibold transition-all duration-200"
                  style={{
                    backgroundColor: step <= 2 ? '#4c49c9' : '#e7e8ee',
                    color: step <= 2 ? '#ffffff' : '#5a5b60',
                  }}
                >
                  {step}
                </div>
                {step < 3 && (
                  <div className="w-8 h-px bg-surface-container" />
                )}
              </div>
            ))}
          </div>

          {/* Heading */}
          <div className="text-center">
            <h2 className="text-headline-lg text-on-surface font-bold">
              Choose Accounts to Track
            </h2>
            <p className="text-body-md text-on-surface-variant mt-2">
              Select which accounts you&apos;d like Luminous Ledger to analyze. You can change this later.
            </p>
          </div>

          {/* Account selector */}
          <AccountSelector accounts={MOCK_ACCOUNTS} onSubmit={handleSubmit} />
        </div>
      </div>
    </div>
  )
}
