import type { Metadata } from 'next'
import { LegalDocumentView } from '@/components/legal/legal-document-view'
import { TERMS, LEGAL_ROOT } from '@/lib/legal/documents'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: TERMS.tagline,
}

export default function TermsPage() {
  return (
    <LegalDocumentView doc={TERMS} back={{ href: LEGAL_ROOT, label: 'Disclosures' }} />
  )
}
