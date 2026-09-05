import type { Metadata } from 'next'
import { LegalDocumentView } from '@/components/legal/legal-document-view'
import { DISCLOSURES, LEGAL_SUBPAGES } from '@/lib/legal/documents'

export const metadata: Metadata = {
  title: 'Disclosures',
  description: DISCLOSURES.tagline,
}

/**
 * The page behind the ⓘ on every learning screen. It carries the full version
 * of the standing line, and it is the way in to the terms and the privacy
 * policy — deliberately reachable without acknowledging anything first.
 */
export default function DisclosuresPage() {
  return (
    <LegalDocumentView
      doc={DISCLOSURES}
      back={{ href: '/learning', label: 'Learning' }}
      related={LEGAL_SUBPAGES}
    />
  )
}
