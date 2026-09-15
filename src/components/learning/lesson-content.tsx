import type { Lesson, LessonTable } from '@/lib/learning/tracks'
// Shared with the investing tool, so a tier looks the same wherever it appears.
import { RISK_RAMP } from '@/lib/investing/risk-ramp'

/**
 * The left column: the material itself. Headings carry the structure, bullets
 * carry the detail, and a divider only appears where an idea genuinely changes.
 * No worked examples here — information first, then the questions.
 *
 * Set at reading size: body copy at 16px on a comfortable measure, so a lesson
 * reads like an article rather than a form.
 */
export function LessonContent({ lesson }: { lesson: Lesson }) {
  return (
    <article className="flex flex-col gap-8">
      {lesson.intro && (
        <p className="text-title-lg text-on-surface max-w-[62ch]">{lesson.intro}</p>
      )}

      {lesson.sections.map((section, i) => (
        <section key={i} className="flex flex-col gap-3">
          {section.divider && (
            <hr className="border-0 border-t border-on-surface/10 mb-4" />
          )}

          {section.heading && (
            <h3 className="text-headline-md text-on-surface">
              {section.heading}
            </h3>
          )}

          {section.body && (
            <p className="text-body-lg leading-relaxed text-on-surface-variant max-w-[68ch]">
              {section.body}
            </p>
          )}

          {section.table && (
            // Narrow screens scroll the table rather than the page.
            <div className="-mx-1 overflow-x-auto px-1">
              <table className="w-full min-w-[420px] border-collapse text-left">
                <thead>
                  <tr>
                    {section.table.columns.map(column => (
                      <th
                        key={column}
                        scope="col"
                        className="border-b border-on-surface/15 pb-2.5 pr-4 text-label-lg text-on-surface-variant last:pr-0"
                      >
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {section.table.rows.map((row, j) => (
                    <tr key={j} className="align-top">
                      {row.map((cell, k) => (
                        <td
                          key={k}
                          className={
                            k === 0
                              ? 'border-b border-on-surface/[0.07] py-3.5 pr-4 text-body-lg text-on-surface'
                              : 'border-b border-on-surface/[0.07] py-3.5 pr-4 text-body-lg leading-relaxed text-on-surface-variant last:pr-0'
                          }
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {section.gridTable && <GridTable table={section.gridTable} />}

          {section.bullets && (
            <ul className="flex flex-col gap-4 max-w-[68ch]">
              {section.bullets.map((bullet, j) => (
                <li key={j} className="flex gap-3">
                  <span
                    className="mt-[10px] w-1.5 h-1.5 rounded-full bg-on-surface/40 shrink-0"
                    aria-hidden
                  />
                  <div className="flex flex-col gap-2.5">
                    <p className="text-body-lg leading-relaxed text-on-surface-variant">
                      {bullet.term && (
                        <span className="text-on-surface font-medium">{bullet.term} — </span>
                      )}
                      {bullet.text}
                    </p>

                    {/* Nested points sit under their parent, marked by a rule
                        rather than a second dot — one bullet shape per list. */}
                    {bullet.sub && (
                      <ul className="flex flex-col gap-2 border-l-2 border-on-surface/10 pl-4">
                        {bullet.sub.map((point, k) => (
                          <li
                            key={k}
                            className="text-body-lg leading-relaxed text-on-surface-variant"
                          >
                            {point}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </article>
  )
}

/**
 * A reference table with every cell ruled, the way a spreadsheet draws one.
 * The full grid is the point: these are rows you scan across and compare, and
 * the underline-only style used for an inline `table` reads as prose instead.
 */
function GridTable({ table }: { table: LessonTable }) {
  // Defaults to the last column, which is where a risk note naturally lands.
  const riskColumn = table.riskColumn ?? table.columns.length - 1

  return (
    // Narrow screens scroll the table rather than the page. The outline sits on
    // the wrapper so the rounded corners clip the grid cleanly.
    <div className="overflow-x-auto rounded-2xl border border-on-surface/10">
      <table className="w-full min-w-[420px] border-collapse text-left">
        <thead>
          <tr>
            {table.columns.map((column, i) => (
              <th
                key={column}
                scope="col"
                className={`border-b border-on-surface/10 bg-surface-container-low px-4 py-3 text-label-lg text-on-surface-variant [&:not(:last-child)]:border-r ${
                  i === 0 ? 'w-[30%]' : ''
                }`}
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, j) => {
            const tier = table.risk?.[j]
            const ramp = tier ? RISK_RAMP[tier] : null

            return (
              <tr key={j} className="align-top [&:not(:last-child)>td]:border-b">
                {row.map((cell, k) => {
                  const tinted = ramp && k === riskColumn

                  return (
                    <td
                      key={k}
                      className={`border-on-surface/10 px-4 py-3.5 text-body-md leading-relaxed [&:not(:last-child)]:border-r ${
                        k === 0 ? 'text-body-lg text-on-surface' : 'text-on-surface-variant'
                      }`}
                      style={
                        tinted
                          ? {
                              backgroundColor: ramp.tint,
                              boxShadow: `inset 3px 0 0 ${ramp.stripe}`,
                              color: '#2d2f33',
                            }
                          : undefined
                      }
                    >
                      {cell}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
