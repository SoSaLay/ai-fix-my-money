import type { Metadata } from 'next'
import { LegalDocumentView } from '@/components/legal/legal-document-view'
import { PRIVACY, LEGAL_ROOT } from '@/lib/legal/documents'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: PRIVACY.tagline,
}

export default function PrivacyPage() {
  return (
    <LegalDocumentView doc={PRIVACY} back={{ href: LEGAL_ROOT, label: 'Disclosures' }} />
  )
}
