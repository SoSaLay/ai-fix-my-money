// ============================================================================
// Drawing one paper.
//
// A fresh sample every attempt, so a retake is not the same paper, and only
// `approved` items are eligible so a learner never draws a dead embed.
// ============================================================================

import 'server-only'

import { getTrack, type QuizQuestion, type TrackId } from '@/lib/learning/tracks'
import {
  CHOICE_QUESTIONS_PER_QUIZ,
  liveVideos,
  toPublicQuestion,
  VIDEO_QUESTIONS_PER_QUIZ,
} from '@/lib/learning/video-pool/pool'
import type { PublicVideoQuestion } from '@/lib/learning/video-pool/types'

/** Fisher–Yates on a copy. The caller's array is never reordered. */
function shuffled<T>(items: readonly T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

/** A multiple-choice question with its answer key removed. */
export interface PublicChoiceQuestion {
  id: string
  kind: 'choice'
  question: string
  options: string[]
  imageSrc?: string
}

export interface SampledPaper {
  videos: PublicVideoQuestion[]
  choices: PublicChoiceQuestion[]
  /** Ids in served order, for the attempt token. */
  videoIds: string[]
  choiceIds: string[]
}

export type SampleError =
  | { ok: false; reason: 'unknown-track' }
  | { ok: false; reason: 'pool-too-small'; live: number; needed: number }

export function samplePaper(trackId: string): (SampledPaper & { ok: true }) | SampleError {
  const track = getTrack(trackId)
  if (!track) return { ok: false, reason: 'unknown-track' }

  const live = liveVideos(track.id as TrackId)
  if (live.length < VIDEO_QUESTIONS_PER_QUIZ) {
    return {
      ok: false,
      reason: 'pool-too-small',
      live: live.length,
      needed: VIDEO_QUESTIONS_PER_QUIZ,
    }
  }

  const videos = shuffled(live).slice(0, VIDEO_QUESTIONS_PER_QUIZ)
  const choices = shuffled(track.finalQuiz).slice(0, CHOICE_QUESTIONS_PER_QUIZ)

  return {
    ok: true,
    videos: videos.map(toPublicQuestion),
    choices: choices.map(toPublicChoice),
    videoIds: videos.map(v => v.id),
    choiceIds: choices.map(q => q.id),
  }
}

/** `answer` is the whole point of the projection — it must not travel. */
function toPublicChoice(question: QuizQuestion): PublicChoiceQuestion {
  return {
    id: question.id,
    kind: 'choice',
    question: question.question,
    options: question.options,
    imageSrc: question.imageSrc,
  }
}
