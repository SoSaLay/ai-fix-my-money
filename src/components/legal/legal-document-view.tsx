import Link from 'next/link'
import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import {
  OPERATOR, LEGAL_ROOT, legalHref,
  type LegalDocument,
} from '@/lib/legal/documents'

interface LegalDocumentViewProps {
  doc: LegalDocument
  /** Where the back link goes, and what it is called. */
  back: { href: string; label: string }
  /** Cards shown under the document — used by the hub to reach its subpages. */
  related?: LegalDocument[]
}

/**
 * One layout for every legal page, so the hub and its subpages read as one
 * document rather than three. Narrow measure on purpose: this is prose to be
 * read, not a dashboard.
 */
export function LegalDocumentView({ doc, back, related }: LegalDocumentViewProps) {
  return (
    <div className="flex flex-col gap-8 px-8 py-8 max-w-3xl w-full mx-auto">
      <Link
        href={back.href}
        className="flex items-center gap-2 text-label-lg text-on-surface-variant hover:text-on-surface transition-colors w-fit"
      >
        <ArrowLeft size={15} /> {back.label}
      </Link>

      {/* Title block */}
      <header className="flex flex-col gap-3">
        <h1 className="text-display-sm text-on-surface font-bold leading-tight">
          {doc.title}
        </h1>
        <p className="text-body-lg text-on-surface-variant leading-relaxed">
          {doc.tagline}
        </p>
        <p className="text-label-sm uppercase tracking-widest text-on-surface-variant">
          Last updated {OPERATOR.updated}
        </p>
      </header>

      {/* Contents — every heading, so a long document stays navigable */}
      {doc.sections.length > 4 && (
        <nav className="bg-surface-container-lowest rounded-3xl px-6 py-5 flex flex-col gap-2.5">
          <p className="text-label-sm uppercase tracking-widest text-on-surface-variant">
            On this page
          </p>
          <ul className="flex flex-col gap-1.5">
            {doc.sections.map(section => (
              <li key={section.heading}>
                <a
                  href={`#${anchor(section.heading)}`}
                  className="text-body-md text-on-surface-variant hover:text-secondary transition-colors"
                >
                  {section.heading}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <article className="bg-surface-container-lowest rounded-3xl px-8 py-8 flex flex-col gap-8">
        <p className="text-body-lg text-on-surface leading-relaxed">{doc.intro}</p>

        {doc.sections.map(section => (
          <section
            key={section.heading}
            id={anchor(section.heading)}
            className="flex flex-col gap-3 scroll-mt-8"
          >
            <h2 className="text-headline-sm text-on-surface font-semibold">
              {section.heading}
            </h2>

            {section.body && (
              <p className="text-body-md text-on-surface-variant leading-relaxed">
                {section.body}
              </p>
            )}

            {section.bullets && (
              <ul className="flex flex-col gap-2.5">
                {section.bullets.map((clause, i) => (
                  <li key={i} className="flex gap-2.5">
                    <span
                      className="mt-[9px] w-1.5 h-1.5 rounded-full bg-secondary/60 shrink-0"
                      aria-hidden
                    />
                    <p className="text-body-md text-on-surface-variant leading-relaxed">
                      {clause.term && (
                        <span className="text-on-surface font-semibold">{clause.term} — </span>
                      )}
                      {clause.text}
                    </p>
                  </li>
                ))}
              </ul>
            )}

            {section.callout && (
              <p className="bg-surface-container rounded-2xl px-5 py-4 text-body-md text-on-surface leading-relaxed font-medium">
                {section.callout}
              </p>
            )}
          </section>
        ))}
      </article>

      {/* Subpages */}
      {related && related.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-label-sm uppercase tracking-widest text-on-surface-variant">
            The rest of the paperwork
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {related.map(page => (
              <Link
                key={page.id}
                href={legalHref(page)}
                className="group bg-surface-container-lowest rounded-3xl px-6 py-5 flex flex-col gap-2 hover:shadow-card transition-shadow"
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-headline-sm text-on-surface font-semibold">
                    {page.title}
                  </h3>
                  <ArrowUpRight
                    size={16}
                    className="text-on-surface-variant group-hover:text-secondary transition-colors shrink-0"
                  />
                </div>
                <p className="text-body-md text-on-surface-variant leading-relaxed">
                  {page.tagline}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      <p className="text-label-sm text-on-surface-variant leading-relaxed">
        These documents are a starting point drafted for an educational platform. They
        are not legal advice, and they should be reviewed by a lawyer licensed where{' '}
        {OPERATOR.entity} operates before the platform is offered publicly.
      </p>
    </div>
  )
}

/** Stable id from a heading, so the contents list can jump to it. */
function anchor(heading: string): string {
  return heading
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export { LEGAL_ROOT }
