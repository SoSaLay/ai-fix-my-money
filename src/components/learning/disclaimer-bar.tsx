import { Info } from 'lucide-react'
import { DISCLAIMER_SHORT } from '@/lib/learning/disclaimer'

/** The standing line that sits on every learning screen. */
export function DisclaimerBar({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-start gap-2 ${className}`}>
      <Info size={13} className="text-on-surface-variant mt-0.5 shrink-0" />
      <p className="text-label-sm text-on-surface-variant">{DISCLAIMER_SHORT}</p>
    </div>
  )
}
