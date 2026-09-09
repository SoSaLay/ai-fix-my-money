import Image from 'next/image'
import { ImageIcon, Lightbulb } from 'lucide-react'
import type { Lesson } from '@/lib/learning/tracks'

/**
 * The right column: a pinned note, then reference art for the lesson. The same
 * images are what the questions point back at, so a learner can check the
 * picture rather than re-reading the text.
 *
 * The column sticks to the viewport on wide screens. A lesson whose material is
 * a long table needs its governing rule still in view at the bottom of that
 * table — a note that scrolls away has stopped being a note by the time it is
 * needed. Below `lg` the column sits under the material and scrolls normally,
 * because there is no second column to pin it to.
 *
 * Renders nothing when a lesson has neither, so the material takes the full
 * width instead of leaving a gap.
 */
export function LessonAside({ lesson }: { lesson: Lesson }) {
  const images = lesson.images ?? []
  const note = lesson.aside

  if (!note && images.length === 0) return null

  return (
    <aside className="w-full lg:w-[340px] shrink-0 lg:sticky lg:top-6 flex flex-col gap-4">
      {note && (
        <div className="bg-surface-container-lowest rounded-3xl px-5 py-5 flex flex-col gap-2.5">
          <div className="flex items-center gap-2">
            <Lightbulb size={14} className="text-secondary shrink-0" aria-hidden />
            <p className="text-label-sm uppercase tracking-widest text-on-surface-variant">
              {note.heading}
            </p>
          </div>
          {note.body.map(paragraph => (
            <p key={paragraph} className="text-body-md text-on-surface leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>
      )}

      {images.map(image => (
        <figure
          key={image.src}
          className="bg-surface-container-lowest rounded-3xl overflow-hidden flex flex-col"
        >
          <div className="relative w-full aspect-[4/3] bg-surface-container">
            <Image
              src={image.src}
              alt={image.alt}
              fill
              sizes="(max-width: 1024px) 100vw, 340px"
              // The diagrams ship as SVG; the optimizer rejects those by
              // default. A raster swapped in later still gets optimized.
              unoptimized={image.src.endsWith('.svg')}
              className="object-contain"
            />
          </div>
          {image.caption && (
            <figcaption className="px-5 py-4 flex items-start gap-2">
              <ImageIcon size={13} className="text-on-surface-variant mt-0.5 shrink-0" />
              <span className="text-label-sm text-on-surface-variant leading-relaxed">
                {image.caption}
              </span>
            </figcaption>
          )}
        </figure>
      ))}
    </aside>
  )
}
