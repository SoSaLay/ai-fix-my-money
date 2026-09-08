'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import {
  TRACKS,
  TRACK_ORDER,
  getTrack,
  passMark,
  type TrackId,
} from '@/lib/learning/tracks'

// ============================================================================
// Storage
// ============================================================================

const STORAGE_KEY_PROGRESS = 'llg_learning_progress_v2'
const STORAGE_KEY_REVIEW = 'llg_learning_review'
const STORAGE_KEY_ACK = 'llg_learning_ack'
const STORAGE_KEY_GUIDED = 'llg_learning_guided'

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function write<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore quota errors
  }
}

// ============================================================================
// Shapes
// ============================================================================

export interface LessonProgress {
  /** Every question in the lesson was answered. Correctness is not a gate. */
  answered: boolean
  /** Question ids answered wrong — these drive deliberate practice. */
  missed: string[]
  completedAt?: string
}

export interface FinalResult {
  attempts: number
  /** Best correct-answer count across attempts. */
  best: number
  total: number
  passed: boolean
  passedAt?: string
}

export interface TrackProgress {
  lessons: Record<string, LessonProgress>
  actionDone: boolean
  final: FinalResult | null
}

export type ProgressMap = Partial<Record<TrackId, TrackProgress>>

/** Spaced repetition: 1 day → 3 days → 1 week, then retired. */
export const REVIEW_INTERVALS_DAYS = [1, 3, 7]

export interface ReviewItem {
  trackId: TrackId
  lessonId: string
  questionId: string
  /** Index into REVIEW_INTERVALS_DAYS. */
  stage: number
  dueAt: string
}

/**
 * The action step hands the learner into the real tool before the track is
 * finished. That temporary pass grants access to exactly one section.
 */
export interface GuidedSession {
  trackId: TrackId
}

const emptyTrack = (): TrackProgress => ({ lessons: {}, actionDone: false, final: null })
const emptyLesson = (): LessonProgress => ({ answered: false, missed: [] })

/** Where the learner is in a track. */
export type Stage =
  | { kind: 'lesson'; id: string; index: number }
  | { kind: 'action' }
  | { kind: 'final' }
  | { kind: 'done' }

// ============================================================================
// Context
// ============================================================================

interface LearningContextValue {
  ready: boolean
  progress: ProgressMap

  trackProgress: (trackId: TrackId) => TrackProgress
  lessonProgress: (trackId: TrackId, lessonId: string) => LessonProgress

  /** Record a lesson's questions. `missed` is the ids answered wrong. */
  recordLesson: (trackId: TrackId, lessonId: string, missed: string[]) => void
  /** Mark the real-data step done. */
  recordAction: (trackId: TrackId) => void
  /** Record a final-quiz attempt. Returns whether it passed. */
  recordFinal: (trackId: TrackId, correct: number, total: number, missed: string[]) => boolean

  /** The step the learner should be on right now. */
  stageFor: (trackId: TrackId) => Stage
  isLessonComplete: (trackId: TrackId, lessonId: string) => boolean
  isTrackComplete: (trackId: TrackId) => boolean
  isTrackUnlocked: (trackId: TrackId) => boolean
  /** Hard gate: the tool opens only once the final quiz is passed. */
  isToolUnlocked: (trackId: TrackId) => boolean

  trackCompletion: (trackId: TrackId) => { done: number; total: number; pct: number }
  currentTrackId: () => TrackId

  reviewQueue: ReviewItem[]
  dueReviews: () => ReviewItem[]
  /** Questions to practise when nothing is scheduled. Drawn from finished lessons. */
  practiceReviews: (limit?: number) => ReviewItem[]
  completeReview: (item: ReviewItem, correct: boolean) => void

  guided: GuidedSession | null
  startGuided: (trackId: TrackId) => void
  endGuided: () => void

  acknowledged: boolean
  acknowledge: () => void

  resetProgress: () => void
}

/**
 * Development only. `?unlock=all` writes a completed record for every track
 * with content, so lessons and questions can be reviewed without answering
 * them; `?unlock=reset` clears it again. The parameter is removed from the URL
 * afterwards so a refresh does not keep re-seeding.
 *
 * Guarded by NODE_ENV at both the call site and here, so a production build
 * cannot reach it.
 */
function devUnlockAll() {
  if (process.env.NODE_ENV !== 'development' || typeof window === 'undefined') return

  const mode = new URLSearchParams(window.location.search).get('unlock')
  if (mode !== 'all' && mode !== 'reset') return

  if (mode === 'reset') {
    localStorage.removeItem(STORAGE_KEY_PROGRESS)
    localStorage.removeItem(STORAGE_KEY_REVIEW)
    localStorage.removeItem(STORAGE_KEY_ACK)
    localStorage.removeItem(STORAGE_KEY_GUIDED)
  } else {
    const now = new Date().toISOString()
    const seeded: ProgressMap = {}
    for (const track of TRACKS) {
      if (track.lessons.length === 0) continue
      const lessons: Record<string, LessonProgress> = {}
      for (const lesson of track.lessons) {
        lessons[lesson.id] = { answered: true, missed: [], completedAt: now }
      }
      seeded[track.id] = {
        lessons,
        actionDone: true,
        final: {
          attempts: 1,
          best: track.finalQuiz.length,
          total: track.finalQuiz.length,
          passed: true,
          passedAt: now,
        },
      }
    }
    // Every lesson question, due now. An empty queue hides the review button
    // entirely, which makes the unlocked app look like it is missing a feature.
    const queue: ReviewItem[] = TRACKS.flatMap(track =>
      track.lessons.flatMap(lesson =>
        lesson.questions.map(q => ({
          trackId: track.id,
          lessonId: lesson.id,
          questionId: q.id,
          stage: 0,
          dueAt: now,
        })),
      ),
    )

    write(STORAGE_KEY_PROGRESS, seeded)
    write(STORAGE_KEY_REVIEW, queue)
    write(STORAGE_KEY_ACK, true)
    localStorage.removeItem(STORAGE_KEY_GUIDED)
  }

  const url = new URL(window.location.href)
  url.searchParams.delete('unlock')
  window.history.replaceState(null, '', url.toString())
}

/** Whether a queued review still points at a question that exists. */
function questionExists(item: ReviewItem): boolean {
  const track = getTrack(item.trackId)
  if (!track) return false
  return (
    track.lessons.some(l => l.questions.some(q => q.id === item.questionId)) ||
    track.finalQuiz.some(q => q.id === item.questionId)
  )
}

const LearningContext = createContext<LearningContextValue | null>(null)

export function LearningProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [progress, setProgress] = useState<ProgressMap>({})
  const [reviewQueue, setReviewQueue] = useState<ReviewItem[]>([])
  const [acknowledged, setAcknowledged] = useState(false)
  const [guided, setGuided] = useState<GuidedSession | null>(null)

  useEffect(() => {
    // Authoring escape hatch: `?unlock=all` in development marks every track
    // finished so the whole curriculum can be read through without sitting the
    // quizzes. Stripped from production builds — see devUnlockAll.
    if (process.env.NODE_ENV === 'development') devUnlockAll()

    setProgress(read<ProgressMap>(STORAGE_KEY_PROGRESS) ?? {})
    setReviewQueue(read<ReviewItem[]>(STORAGE_KEY_REVIEW) ?? [])
    setAcknowledged(read<boolean>(STORAGE_KEY_ACK) ?? false)
    setGuided(read<GuidedSession>(STORAGE_KEY_GUIDED))
    setReady(true)
  }, [])

  const trackProgress = useCallback(
    (trackId: TrackId): TrackProgress => progress[trackId] ?? emptyTrack(),
    [progress],
  )

  const lessonProgress = useCallback(
    (trackId: TrackId, lessonId: string): LessonProgress =>
      progress[trackId]?.lessons?.[lessonId] ?? emptyLesson(),
    [progress],
  )

  const mutate = useCallback(
    (trackId: TrackId, patch: (current: TrackProgress) => TrackProgress) => {
      setProgress(prev => {
        const next = { ...prev, [trackId]: patch(prev[trackId] ?? emptyTrack()) }
        write(STORAGE_KEY_PROGRESS, next)
        return next
      })
    },
    [],
  )

  const recordLesson = useCallback(
    (trackId: TrackId, lessonId: string, missed: string[]) => {
      mutate(trackId, current => ({
        ...current,
        lessons: {
          ...current.lessons,
          [lessonId]: { answered: true, missed, completedAt: new Date().toISOString() },
        },
      }))

      // Everything answered enters spaced review. Missed questions come back
      // tomorrow; correct ones start further along.
      const lesson = getTrack(trackId)?.lessons.find(l => l.id === lessonId)
      if (!lesson) return

      setReviewQueue(prev => {
        const rest = prev.filter(r => !(r.trackId === trackId && r.lessonId === lessonId))
        const additions: ReviewItem[] = lesson.questions.map(q => {
          const stage = missed.includes(q.id) ? 0 : 1
          const due = new Date()
          due.setDate(due.getDate() + REVIEW_INTERVALS_DAYS[stage])
          return { trackId, lessonId, questionId: q.id, stage, dueAt: due.toISOString() }
        })
        const next = [...rest, ...additions]
        write(STORAGE_KEY_REVIEW, next)
        return next
      })
    },
    [mutate],
  )

  const recordAction = useCallback(
    (trackId: TrackId) => mutate(trackId, current => ({ ...current, actionDone: true })),
    [mutate],
  )

  const recordFinal = useCallback(
    (trackId: TrackId, correct: number, total: number, missed: string[]): boolean => {
      const track = getTrack(trackId)
      const needed = track ? passMark(track) : total
      const passed = correct >= needed

      mutate(trackId, current => {
        const prior = current.final
        return {
          ...current,
          final: {
            attempts: (prior?.attempts ?? 0) + 1,
            best: Math.max(prior?.best ?? 0, correct),
            total,
            passed: prior?.passed || passed,
            passedAt: prior?.passedAt ?? (passed ? new Date().toISOString() : undefined),
          },
        }
      })

      // A missed final question is worth revisiting regardless of the outcome.
      if (missed.length > 0) {
        setReviewQueue(prev => {
          const rest = prev.filter(r => !missed.includes(r.questionId))
          const due = new Date()
          due.setDate(due.getDate() + REVIEW_INTERVALS_DAYS[0])
          const additions: ReviewItem[] = missed.map(questionId => ({
            trackId, lessonId: 'final', questionId, stage: 0, dueAt: due.toISOString(),
          }))
          const next = [...rest, ...additions]
          write(STORAGE_KEY_REVIEW, next)
          return next
        })
      }

      return passed
    },
    [mutate],
  )

  const isLessonComplete = useCallback(
    (trackId: TrackId, lessonId: string) => lessonProgress(trackId, lessonId).answered,
    [lessonProgress],
  )

  const isTrackComplete = useCallback(
    (trackId: TrackId) => trackProgress(trackId).final?.passed === true,
    [trackProgress],
  )

  const stageFor = useCallback(
    (trackId: TrackId): Stage => {
      const track = getTrack(trackId)
      if (!track || track.lessons.length === 0) return { kind: 'done' }
      const p = trackProgress(trackId)

      // Passing the final ends the track, however the learner got there — a
      // test-out skips the lessons rather than leaving them owed.
      if (p.final?.passed) return { kind: 'done' }

      const i = track.lessons.findIndex(l => !p.lessons[l.id]?.answered)
      if (i !== -1) return { kind: 'lesson', id: track.lessons[i].id, index: i }
      if (track.action && !p.actionDone) return { kind: 'action' }
      if (track.finalQuiz.length > 0 && !p.final?.passed) return { kind: 'final' }
      return { kind: 'done' }
    },
    [trackProgress],
  )

  // Hard gate. A track opens only when everything before it is finished.
  const isTrackUnlocked = useCallback(
    (trackId: TrackId) => {
      const i = TRACK_ORDER.indexOf(trackId)
      if (i <= 0) return true
      return TRACK_ORDER.slice(0, i).every(id => {
        const t = getTrack(id)
        // A track with no content yet cannot block the ones behind it.
        if (!t || t.lessons.length === 0) return true
        return isTrackComplete(id)
      })
    },
    [isTrackComplete],
  )

  const isToolUnlocked = useCallback(
    (trackId: TrackId) => isTrackComplete(trackId),
    [isTrackComplete],
  )

  const trackCompletion = useCallback(
    (trackId: TrackId) => {
      const track = getTrack(trackId)
      if (!track || track.lessons.length === 0) return { done: 0, total: 0, pct: 0 }

      const p = trackProgress(trackId)
      const total = track.lessons.length + (track.action ? 1 : 0) + (track.finalQuiz.length > 0 ? 1 : 0)
      let done = track.lessons.filter(l => p.lessons[l.id]?.answered).length
      if (track.action && p.actionDone) done += 1
      if (track.finalQuiz.length > 0 && p.final?.passed) done += 1

      return { done, total, pct: total === 0 ? 0 : Math.round((done / total) * 100) }
    },
    [trackProgress],
  )

  const currentTrackId = useCallback((): TrackId => {
    for (const id of TRACK_ORDER) {
      const t = getTrack(id)
      if (!t || t.lessons.length === 0) continue
      if (!isTrackComplete(id)) return id
    }
    return TRACK_ORDER[0]
  }, [isTrackComplete])

  const dueReviews = useCallback(() => {
    const now = Date.now()
    return reviewQueue.filter(
      // A question removed from a lesson leaves its review items behind. They
      // would otherwise be counted as due with nothing to show for them.
      r => new Date(r.dueAt).getTime() <= now && questionExists(r),
    )
  }, [reviewQueue])

  /**
   * Review is also a place to test yourself on demand, not only a queue that
   * comes due. When nothing is scheduled this draws from lessons already
   * finished, so the review screen always has something to offer. Answering
   * one schedules it normally — practising a question is the same signal as
   * meeting it on its due date.
   */
  const practiceReviews = useCallback(
    (limit = 10) => {
      const queued = new Set(reviewQueue.map(r => `${r.trackId}:${r.questionId}`))
      const now = new Date().toISOString()
      const pool: ReviewItem[] = []

      for (const track of TRACKS) {
        for (const lesson of track.lessons) {
          if (!progress[track.id]?.lessons?.[lesson.id]?.answered) continue
          for (const q of lesson.questions) {
            if (queued.has(`${track.id}:${q.id}`)) continue
            pool.push({
              trackId: track.id,
              lessonId: lesson.id,
              questionId: q.id,
              stage: 0,
              dueAt: now,
            })
          }
        }
      }

      return pool.slice(0, limit)
    },
    [progress, reviewQueue],
  )

  const completeReview = useCallback((item: ReviewItem, correct: boolean) => {
    setReviewQueue(prev => {
      const rest = prev.filter(
        r => !(r.trackId === item.trackId && r.questionId === item.questionId),
      )
      // Wrong answers drop back to the shortest interval; correct ones advance
      // and retire off the queue at the end.
      const stage = correct ? item.stage + 1 : 0
      if (stage >= REVIEW_INTERVALS_DAYS.length) {
        write(STORAGE_KEY_REVIEW, rest)
        return rest
      }
      const due = new Date()
      due.setDate(due.getDate() + REVIEW_INTERVALS_DAYS[stage])
      const next = [...rest, { ...item, stage, dueAt: due.toISOString() }]
      write(STORAGE_KEY_REVIEW, next)
      return next
    })
  }, [])

  const startGuided = useCallback((trackId: TrackId) => {
    const session = { trackId }
    setGuided(session)
    write(STORAGE_KEY_GUIDED, session)
  }, [])

  const endGuided = useCallback(() => {
    setGuided(null)
    localStorage.removeItem(STORAGE_KEY_GUIDED)
  }, [])

  const acknowledge = useCallback(() => {
    setAcknowledged(true)
    write(STORAGE_KEY_ACK, true)
  }, [])

  const resetProgress = useCallback(() => {
    setProgress({})
    setReviewQueue([])
    setGuided(null)
    localStorage.removeItem(STORAGE_KEY_GUIDED)
    localStorage.removeItem(STORAGE_KEY_PROGRESS)
    localStorage.removeItem(STORAGE_KEY_REVIEW)
  }, [])

  return (
    <LearningContext.Provider
      value={{
        ready,
        progress,
        trackProgress,
        lessonProgress,
        recordLesson,
        recordAction,
        recordFinal,
        stageFor,
        isLessonComplete,
        isTrackComplete,
        isTrackUnlocked,
        isToolUnlocked,
        trackCompletion,
        currentTrackId,
        reviewQueue,
        dueReviews,
        practiceReviews,
        completeReview,
        guided,
        startGuided,
        endGuided,
        acknowledged,
        acknowledge,
        resetProgress,
      }}
    >
      {children}
    </LearningContext.Provider>
  )
}

export function useLearning() {
  const ctx = useContext(LearningContext)
  if (!ctx) throw new Error('useLearning must be used inside LearningProvider')
  return ctx
}

export { TRACKS }
