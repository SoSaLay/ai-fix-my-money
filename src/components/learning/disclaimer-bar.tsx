import Link from 'next/link'
import { Info } from 'lucide-react'
import { DISCLAIMER_SHORT } from '@/lib/learning/disclaimer'
import { LEGAL_ROOT } from '@/lib/legal/documents'

/**
 * The standing line that sits on every learning screen. The whole bar is the
 * control — the icon alone was too small a target and read as decoration — and
 * it opens the disclosures page, where the short line is set out in full.
 */
export function DisclaimerBar({ className = '' }: { className?: string }) {
  return (
    <Link
      href={LEGAL_ROOT}
      aria-label="Read the full disclosures, terms, and privacy policy"
      className={`group inline-flex items-start gap-2 rounded-xl -mx-2 px-2 py-1.5 hover:bg-surface-container-low transition-colors ${className}`}
    >
      <span
        className="mt-px shrink-0 w-[18px] h-[18px] rounded-full bg-surface-container flex items-center justify-center group-hover:bg-secondary-fixed/60 transition-colors"
        aria-hidden
      >
        <Info size={11} className="text-on-surface-variant group-hover:text-secondary transition-colors" />
      </span>
      <span className="text-label-sm text-on-surface-variant group-hover:text-on-surface transition-colors">
        {DISCLAIMER_SHORT}{' '}
        <span className="underline underline-offset-2 decoration-outline-variant group-hover:decoration-secondary">
          Read the disclosures
        </span>
      </span>
    </Link>
  )
}
