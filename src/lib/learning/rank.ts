// ============================================================================
// Rank
//
// How well someone knows their money, measured by how they answer. Every point
// comes from a question: the multiple choice at the end of each lesson, and the
// final test. A written answer on the final is worth three times a multiple
// choice one — picking the right option is recognising an answer, explaining a
// video in your own words is having one.
//
// Pure functions over the stored progress. Nothing new is persisted to rank a
// learner; the rank is whatever their answers already add up to.
// ============================================================================

import { TRACKS, type Track, type TrackId } from '@/lib/learning/tracks'
import { quizMix } from '@/lib/learning/video-pool/constants'
import type { ProgressMap } from '@/contexts/learning-context'

/** A multiple choice answered correctly, in a lesson or on a final. */
export const POINTS_PER_CHOICE = 10

/** A written final answer given full marks by the grader. Half for partial. */
export const POINTS_PER_WRITTEN = 30

/** The grader marks 0, 1 or 2. Points scale with it. */
export const POINTS_PER_GRADE_STEP = POINTS_PER_WRITTEN / 2

export interface Rank {
  /** Shown as the rank's number. 1 is the top. */
  level: number
  /** Short enough for a button. */
  name: string
  /** The relationship, in the learner's own voice. */
  line: string
  /** Points needed to reach this rank. */
  minPoints: number
  /** Gradient stops as hex. Grey at the bottom, more colour the higher you go. */
  colors: string[]
}

/** The rank's gradient, optionally translucent. `alpha` is 0–1. */
export function rankGradient(rank: Rank, alpha = 1, angle = 135): string {
  const a = Math.round(alpha * 255).toString(16).padStart(2, '0')
  const stops = rank.colors.length === 1 ? [rank.colors[0], rank.colors[0]] : rank.colors
  return `linear-gradient(${angle}deg, ${stops.map(c => `${c}${a}`).join(', ')})`
}

/** Bottom rank first. Numbered the other way: 5 is where everyone starts, 1 is the top. */
export const RANKS: Rank[] = [
  {
    level: 5,
    name: 'The Stranger',
    line: 'Me and my money don’t even know each other.',
    minPoints: 0,
    colors: ['#8a8d93', '#b4b7bd'],
  },
  {
    level: 4,
    name: 'The Acquaintance',
    line: 'We know each other’s names, and we talk sometimes.',
    minPoints: 250,
    colors: ['#2f8fd6', '#4fc9c0'],
  },
  {
    level: 3,
    name: 'The Business Partner',
    line: 'My money and I work together. It pulls its weight, and so do I.',
    minPoints: 700,
    colors: ['#1a9b5a', '#a4d13a'],
  },
  {
    level: 2,
    name: 'The Soulmate',
    line: 'My money gets me. I don’t go anywhere without it.',
    minPoints: 1250,
    colors: ['#4c49c9', '#ff9817'],
  },
  {
    level: 1,
    name: 'Absolute Oneness',
    line: 'Me and my money are sentient, identical beings — in sync on a galactic level.',
    minPoints: 1750,
    colors: ['#7b2ff7', '#f107a3', '#ff9817', '#00c2ff'],
  },
]

/** Points for a finished final paper, from what the quiz marked. */
export function finalRankPoints(writtenGrades: number[], choicesCorrect: number): number {
  const written = writtenGrades.reduce((sum, grade) => sum + grade * POINTS_PER_GRADE_STEP, 0)
  return written + choicesCorrect * POINTS_PER_CHOICE
}

export interface TrackPoints {
  trackId: TrackId
  lessons: number
  lessonsMax: number
  final: number
  finalMax: number
}

function finalMax(track: Track): number {
  const mix = quizMix(track.id)
  return mix.videos * POINTS_PER_WRITTEN + mix.choices * POINTS_PER_CHOICE
}

export function trackPoints(track: Track, progress: ProgressMap): TrackPoints {
  const p = progress[track.id]

  let lessons = 0
  for (const lesson of track.lessons) {
    const record = p?.lessons?.[lesson.id]
    if (!record?.answered) continue
    // First attempt only, so revisiting a lesson to pick the answers just
    // revealed does not farm points. Older records predate the field.
    const correct = record.firstCorrect ?? lesson.questions.length - record.missed.length
    lessons += Math.max(0, Math.min(correct, lesson.questions.length)) * POINTS_PER_CHOICE
  }

  const max = finalMax(track)
  let final = 0
  if (p?.final) {
    // Older records carry only the paper's own score; scale it onto the rank's.
    final = p.final.bestRankPoints ??
      (p.final.total > 0 ? Math.round((p.final.best / p.final.total) * max) : 0)
  }

  return {
    trackId: track.id,
    lessons,
    lessonsMax: track.lessons.reduce((sum, l) => sum + l.questions.length, 0) * POINTS_PER_CHOICE,
    final: Math.min(final, max),
    finalMax: track.lessons.length === 0 ? 0 : max,
  }
}

export interface RankStanding {
  points: number
  maxPoints: number
  rank: Rank
  next: Rank | null
  /** 0–100 through the current rank toward the next. 100 at the top. */
  pctToNext: number
  pointsToNext: number
  byTrack: TrackPoints[]
}

export function rankStanding(progress: ProgressMap): RankStanding {
  const byTrack = TRACKS.filter(t => t.lessons.length > 0).map(t => trackPoints(t, progress))
  const points = byTrack.reduce((sum, t) => sum + t.lessons + t.final, 0)
  const maxPoints = byTrack.reduce((sum, t) => sum + t.lessonsMax + t.finalMax, 0)

  const index = RANKS.reduce((found, r, i) => (points >= r.minPoints ? i : found), 0)
  const rank = RANKS[index]
  const next = RANKS[index + 1] ?? null

  const span = next ? next.minPoints - rank.minPoints : 1
  const pctToNext = next ? Math.round(((points - rank.minPoints) / span) * 100) : 100

  return {
    points,
    maxPoints,
    rank,
    next,
    pctToNext,
    pointsToNext: next ? next.minPoints - points : 0,
    byTrack,
  }
}
