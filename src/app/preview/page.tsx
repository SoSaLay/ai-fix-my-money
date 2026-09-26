import type { Metadata } from 'next'
import { PreviewShowcase } from '@/components/preview/preview-showcase'

export const metadata: Metadata = {
  title: 'What can I unlock? · AI Fix My Money',
  description: 'Every tool in the app, filled in for an example person earning $100K a year.',
}

export default function PreviewPage() {
  return <PreviewShowcase />
}
