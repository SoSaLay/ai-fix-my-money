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

          {section.table && <InlineTable table={section.table} />}

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
 * A table set as prose: rules under the rows only.
 *
 * Wherever the column is too narrow for its cells, the rows become stacked
 * blocks instead — each row's first cell as a heading, each other cell under
 * its column name. Squeezing three columns into a phone split the first one a
 * letter per line. Which layout shows is decided by the column's own width
 * (`.lesson-table` in globals.css), not the screen's, because the sidebar and
 * the note column both take space out of it.
 */
function InlineTable({ table }: { table: LessonTable }) {
  return (
    <div className="lesson-table">
      <table className="lesson-table-wide w-full border-collapse text-left break-words">
        <thead>
          <tr>
            {table.columns.map((column, i) => (
              <th
                key={i}
                scope="col"
                className="border-b border-on-surface/15 pb-2.5 pr-4 text-label-lg text-on-surface-variant last:pr-0"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, j) => (
            <tr key={j} className="align-top">
              {row.map((cell, k) => (
                <td
                  key={k}
                  className={
                    k === 0
                      ? 'whitespace-nowrap border-b border-on-surface/[0.07] py-3.5 pr-4 text-body-lg text-on-surface'
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

      <div className="lesson-table-stacked flex-col">
        {table.rows.map((row, j) => (
          <div key={j} className="flex flex-col gap-3 border-b border-on-surface/[0.07] py-4 first:pt-0 last:border-b-0">
            <p className="text-title-lg text-on-surface">{row[0]}</p>
            {row.slice(1).map((cell, k) => (
              <div key={k} className="flex flex-col gap-1">
                {table.columns[k + 1] && (
                  <p className="text-label-lg text-on-surface-variant">{table.columns[k + 1]}</p>
                )}
                <p className="text-body-lg leading-relaxed text-on-surface-variant">{cell}</p>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
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
    // Cells wrap to fit the column, so nothing has to scroll sideways. The
    // outline sits on the wrapper so the rounded corners clip the grid cleanly.
    <div className="scrollbar-dark overflow-x-auto rounded-2xl border border-on-surface/10">
      <table className="w-full border-collapse text-left break-words">
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
