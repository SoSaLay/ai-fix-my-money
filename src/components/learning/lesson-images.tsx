import Image from 'next/image'
import { ImageIcon } from 'lucide-react'
import type { LessonImage } from '@/lib/learning/tracks'

/**
 * The right column: reference art for the lesson. The same images are what the
 * questions will point back at, so a learner can check the picture rather than
 * re-reading the text.
 *
 * Renders nothing when a lesson has no imagery yet, so the material takes the
 * full width until the art exists.
 */
export function LessonImages({ images }: { images?: LessonImage[] }) {
  if (!images || images.length === 0) return null

  return (
    <aside className="w-full lg:w-[340px] shrink-0 flex flex-col gap-4">
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
