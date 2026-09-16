import { Lightbulb } from 'lucide-react'
import type { Lesson } from '@/lib/learning/tracks'

/**
 * The right column: a pinned note. Lesson images are not drawn here — they only
 * appear beside the questions that point at them.
 *
 * The column sticks to the viewport on wide screens. A lesson whose material is
 * a long table needs its governing rule still in view at the bottom of that
 * table — a note that scrolls away has stopped being a note by the time it is
 * needed. Below `lg` the column sits under the material and scrolls normally,
 * because there is no second column to pin it to.
 *
 * Renders nothing when a lesson has no note, so the material takes the full
 * width instead of leaving a gap.
 */
export function LessonAside({ lesson }: { lesson: Lesson }) {
  const note = lesson.aside

  if (!note) return null

  return (
    <aside className="w-full lg:w-[360px] shrink-0 lg:sticky lg:top-6 flex flex-col gap-4">
      <div className="bg-surface-container-lowest rounded-3xl border border-on-surface/[0.06] p-6 flex flex-col gap-3">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-full bg-[rgba(224,163,0,0.14)] flex items-center justify-center shrink-0">
            <Lightbulb size={15} className="text-[#8a6400]" aria-hidden />
          </span>
          <p className="text-title-md text-on-surface">
            {note.heading}
          </p>
        </div>
        {note.body.map(paragraph => (
          <p key={paragraph} className="text-body-lg text-on-surface-variant leading-relaxed">
            {paragraph}
          </p>
        ))}
      </div>
    </aside>
  )
}
