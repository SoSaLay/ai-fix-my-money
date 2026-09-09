import type { Lesson, LessonTable } from '@/lib/learning/tracks'
// Shared with the investing tool, so a tier looks the same wherever it appears.
import { RISK_RAMP } from '@/lib/investing/risk-ramp'

/**
 * The left column: the material itself. Headings carry the structure, bullets
 * carry the detail, and a divider only appears where an idea genuinely changes.
 * No worked examples here — information first, then the questions.
 */
export function LessonContent({ lesson }: { lesson: Lesson }) {
  return (
    <article className="flex flex-col gap-6">
      {lesson.intro && (
        <p className="text-body-lg text-on-surface leading-relaxed">{lesson.intro}</p>
      )}

      {lesson.sections.map((section, i) => (
        <section key={i} className="flex flex-col gap-2.5">
          {section.divider && (
            <hr className="border-0 border-t border-outline-variant/50 my-2" />
          )}

          {section.heading && (
            <h3 className="text-title-md text-on-surface font-semibold">
              {section.heading}
            </h3>
          )}

          {section.body && (
            <p className="text-body-md text-on-surface-variant leading-relaxed">
              {section.body}
            </p>
          )}

          {section.table && (
            // Narrow screens scroll the table rather than the page.
            <div className="-mx-1 overflow-x-auto px-1">
              <table className="w-full min-w-[380px] border-collapse text-left">
                <thead>
                  <tr>
                    {section.table.columns.map(column => (
                      <th
                        key={column}
                        scope="col"
                        className="border-b border-outline-variant/60 pb-2 pr-4 text-label-md uppercase tracking-widest text-on-surface-variant last:pr-0"
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
                              ? 'border-b border-outline-variant/30 py-2.5 pr-4 text-body-md font-semibold text-on-surface'
                              : 'border-b border-outline-variant/30 py-2.5 pr-4 text-body-md leading-relaxed text-on-surface-variant last:pr-0'
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
            <ul className="flex flex-col gap-5">
              {section.bullets.map((bullet, j) => (
                <li key={j} className="flex gap-2.5">
                  <span
                    className="mt-[9px] w-1.5 h-1.5 rounded-full bg-secondary/60 shrink-0"
                    aria-hidden
                  />
                  <div className="flex flex-col gap-2">
                    <p className="text-body-md text-on-surface-variant leading-relaxed">
                      {bullet.term && (
                        <span className="text-on-surface font-semibold">{bullet.term} — </span>
                      )}
                      {bullet.text}
                    </p>

                    {/* Nested points sit under their parent, marked by a rule
                        rather than a second dot — one bullet shape per list. */}
                    {bullet.sub && (
                      <ul className="flex flex-col gap-2 border-l border-outline-variant/50 pl-3.5">
                        {bullet.sub.map((point, k) => (
                          <li
                            key={k}
                            className="text-body-md text-on-surface-variant leading-relaxed"
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
    // Narrow screens scroll the table rather than the page.
    <div className="overflow-x-auto rounded-xl">
      <table className="w-full min-w-[380px] border-collapse text-left">
        <thead>
          <tr>
            {table.columns.map((column, i) => (
              <th
                key={column}
                scope="col"
                className={`border border-outline-variant/70 bg-surface-container px-3 py-2 text-label-sm uppercase tracking-wider text-on-surface-variant ${
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
              <tr key={j} className="align-top">
                {row.map((cell, k) => {
                  const tinted = ramp && k === riskColumn

                  return (
                    <td
                      key={k}
                      className={`border border-outline-variant/70 px-3 py-2.5 text-body-md leading-relaxed ${
                        k === 0 ? 'font-semibold text-on-surface' : 'text-on-surface-variant'
                      }`}
                      style={
                        tinted
                          ? {
                              backgroundColor: ramp.tint,
                              borderLeft: `3px solid ${ramp.stripe}`,
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
