import type { Lesson } from '@/lib/learning/tracks'

/**
 * The left column: the material itself. Headings carry the structure, bullets
 * carry the detail, and a divider only appears where an idea genuinely changes.
 * No worked examples here — information first, then the questions.
 */
export function LessonContent({ lesson }: { lesson: Lesson }) {
  return (
    <article className="flex flex-col gap-6">
      <p className="text-body-lg text-on-surface leading-relaxed">{lesson.intro}</p>

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
              <table className="w-full min-w-[520px] border-collapse text-left">
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

          {section.bullets && (
            <ul className="flex flex-col gap-2.5">
              {section.bullets.map((bullet, j) => (
                <li key={j} className="flex gap-2.5">
                  <span
                    className="mt-[9px] w-1.5 h-1.5 rounded-full bg-secondary/60 shrink-0"
                    aria-hidden
                  />
                  <p className="text-body-md text-on-surface-variant leading-relaxed">
                    {bullet.term && (
                      <span className="text-on-surface font-semibold">{bullet.term} — </span>
                    )}
                    {bullet.text}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </article>
  )
}
