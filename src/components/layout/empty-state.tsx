import Link from 'next/link'

/**
 * A page with nothing to show yet: one picture, one heading, one line, one way
 * forward. The same shape as the locked-tool screen, so waiting and locked
 * read as the same family.
 */
export function EmptyState({
  image, title, body, action,
}: {
  image: string
  title: string
  body: string
  action: { href: string; label: string }
}) {
  return (
    <div className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="max-w-sm w-full flex flex-col items-center text-center">
        {/* eslint-disable-next-line @next/next/no-img-element -- static SVG, nothing to optimise */}
        <img src={image} alt="" className="w-full max-w-[220px] aspect-square" />
        <h1 className="mt-4 text-display-sm text-on-surface">{title}</h1>
        <p className="mt-3 text-title-lg text-on-surface-variant">{body}</p>
        <Link href={action.href} className="btn-action items-center justify-center mt-8">
          {action.label}
        </Link>
      </div>
    </div>
  )
}
