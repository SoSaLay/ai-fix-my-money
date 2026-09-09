'use client'

// ============================================================================
// The review pass, one candidate at a time.
//
// This screen is the whole reason the pool can be curated by hand: watch the
// video, write the question and the reference answer beside it, approve. If
// reviewing meant editing raw JSON it would happen once and never again, and
// the pool would rot.
// ============================================================================

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Check, ChevronLeft, ChevronRight, Undo2, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { VideoEmbed } from '@/components/learning/video-embed'
import type { TrackId } from '@/lib/learning/tracks'
import { isReviewComplete, type QueuedVideo } from '@/lib/learning/video-pool/types'

interface ReviewQueueProps {
  trackId: TrackId
  trackTitle: string
  initialQueue: QueuedVideo[]
}

/** The rubric is one point per line — the fastest thing to type while watching. */
const rubricToText = (rubric?: string[]) => (rubric ?? []).join('\n')
const textToRubric = (text: string) =>
  text.split('\n').map(line => line.trim()).filter(Boolean)

export function ReviewQueue({ trackId, trackTitle, initialQueue }: ReviewQueueProps) {
  const [queue, setQueue] = useState(initialQueue)
  const [index, setIndex] = useState(0)
  const [dirty, setDirty] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [note, setNote] = useState<string | null>(null)

  // Draft fields for the candidate on screen.
  const [question, setQuestion] = useState('')
  const [claim, setClaim] = useState('')
  const [reference, setReference] = useState('')
  const [rubricText, setRubricText] = useState('')

  const current = queue[index]

  // Load the candidate's saved draft whenever the screen moves to a new one.
  useEffect(() => {
    setQuestion(current?.question ?? '')
    setClaim(current?.claimUnderTest ?? '')
    setReference(current?.referenceAnswer ?? '')
    setRubricText(rubricToText(current?.rubric))
    setDirty(false)
    setError(null)
  }, [current])

  const draft = useMemo(
    () => ({
      question: question.trim(),
      claimUnderTest: claim.trim(),
      referenceAnswer: reference.trim(),
      rubric: textToRubric(rubricText),
    }),
    [question, claim, reference, rubricText],
  )

  const complete = current
    ? isReviewComplete({ ...current, ...draft })
    : false

  const post = useCallback(
    async (action: 'save' | 'approve' | 'reject' | 'unreject', extra?: Record<string, unknown>) => {
      if (!current) return null
      setBusy(true)
      setError(null)
      try {
        const response = await fetch('/api/admin/review', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            trackId,
            action,
            id: current.id,
            review: draft,
            ...extra,
          }),
        })
        const payload = await response.json()
        if (!response.ok) {
          setError(payload.error ?? 'That did not save.')
          return null
        }
        return payload as { ok: true; item?: QueuedVideo; approvedId?: string }
      } catch {
        setError('Could not reach the review route. Is the dev server still running?')
        return null
      } finally {
        setBusy(false)
      }
    },
    [current, draft, trackId],
  )

  const save = useCallback(async () => {
    const result = await post('save')
    if (!result?.item) return false
    const item = result.item
    setQueue(prev => prev.map(row => (row.id === item.id ? item : row)))
    setDirty(false)
    setNote('Draft saved.')
    return true
  }, [post])

  const move = useCallback(
    async (delta: number) => {
      const next = index + delta
      if (next < 0 || next >= queue.length) return
      // Never lose typing to a stray arrow click.
      if (dirty && !(await save())) return
      setNote(null)
      setIndex(next)
    },
    [dirty, index, queue.length, save],
  )

  const approve = useCallback(async () => {
    const result = await post('approve')
    if (!result?.approvedId) return
    const approvedId = result.approvedId
    setQueue(prev => prev.filter(row => row.id !== approvedId))
    setIndex(prev => Math.max(0, Math.min(prev, queue.length - 2)))
    setNote(`${approvedId} approved. Commit the diff to ship it.`)
  }, [post, queue.length])

  const reject = useCallback(async () => {
    const reason = window.prompt('Why is this one out? (optional)') ?? ''
    const result = await post('reject', { reason })
    if (!result?.item) return
    const item = result.item
    setQueue(prev => prev.map(row => (row.id === item.id ? item : row)))
    setNote('Rejected. It stays in the file so ingestion will not offer it again.')
  }, [post])

  const unreject = useCallback(async () => {
    const result = await post('unreject')
    if (!result?.item) return
    const item = result.item
    setQueue(prev => prev.map(row => (row.id === item.id ? item : row)))
    setNote(null)
  }, [post])

  const pending = queue.filter(row => !row.rejected).length

  if (queue.length === 0) {
    return (
      <div className="rounded-2xl bg-surface-container-lowest p-8 text-center shadow-card">
        <p className="text-headline-sm text-on-surface">Nothing waiting for {trackTitle}.</p>
        <p className="mx-auto mt-2 max-w-md text-body-md text-on-surface-variant">
          Candidates arrive here when the ingestion script runs. It pulls from TikHub, ranks
          by engagement, drops anything already in the pool, and writes{' '}
          <code className="rounded bg-surface-container px-1 py-0.5 text-label-md">
            {trackId}.candidates.json
          </code>
          . Nothing it writes is ever approved on its own.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => move(-1)}
            disabled={index === 0 || busy}
            className="rounded-md p-2 text-on-surface-variant hover:bg-surface-container disabled:opacity-40"
            aria-label="Previous candidate"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-label-md tabular-nums text-on-surface-variant">
            {index + 1} / {queue.length} · {pending} to go
          </span>
          <button
            type="button"
            onClick={() => move(1)}
            disabled={index >= queue.length - 1 || busy}
            className="rounded-md p-2 text-on-surface-variant hover:bg-surface-container disabled:opacity-40"
            aria-label="Next candidate"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {current && (
        <div className="grid gap-6 lg:grid-cols-[325px_1fr]">
          {/* Watch it here. Everything ingestion found sits underneath. */}
          <div className="flex flex-col gap-3">
            <VideoEmbed
              embedUrl={current.embedUrl}
              shareUrl={current.shareUrl}
              creatorHandle={current.creatorHandle}
              postedAt={current.postedAt}
            />
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-label-md">
              {(
                [
                  ['Plays', current.engagement.plays],
                  ['Likes', current.engagement.likes],
                  ['Comments', current.engagement.comments],
                  ['Shares', current.engagement.shares],
                ] as const
              ).map(([label, value]) => (
                <div key={label} className="flex justify-between gap-2">
                  <dt className="text-on-surface-variant">{label}</dt>
                  <dd className="tabular-nums text-on-surface">{value.toLocaleString()}</dd>
                </div>
              ))}
            </dl>
            <div className="rounded-xl bg-surface-container-low p-3">
              <p className="text-label-sm uppercase tracking-widest text-on-surface-variant">
                Creator&rsquo;s caption
              </p>
              <p className="mt-1 text-body-md text-on-surface">{current.caption || '—'}</p>
              <p className="mt-2 text-label-sm text-on-surface-variant">
                Context for you only. It is never shown to a learner as material.
              </p>
            </div>
            <p className="text-label-sm tabular-nums text-on-surface-variant">{current.id}</p>
          </div>

          <div className="flex flex-col gap-4">
            {current.rejected && (
              <div className="flex items-center justify-between gap-3 rounded-xl bg-error/10 px-4 py-3">
                <span className="text-body-md text-error">
                  Rejected{current.rejectedReason ? ` — ${current.rejectedReason}` : ''}.
                </span>
                <button
                  type="button"
                  onClick={unreject}
                  disabled={busy}
                  className="inline-flex items-center gap-1 text-label-md text-error hover:underline"
                >
                  <Undo2 className="h-3.5 w-3.5" aria-hidden />
                  Undo
                </button>
              </div>
            )}

            <Field
              label="Question"
              hint="Medium to semi-difficult. Comprehension or judgment, not recall."
              value={question}
              rows={3}
              onChange={value => {
                setQuestion(value)
                setDirty(true)
              }}
            />
            <Field
              label="Claim under test"
              hint="Optional. What the video actually asserts — this is what makes “does it hold up?” answerable."
              value={claim}
              rows={2}
              onChange={value => {
                setClaim(value)
                setDirty(true)
              }}
            />
            <Field
              label="Reference answer"
              hint="Server-side only. Never sent to a browser — the grader compares against this."
              value={reference}
              rows={5}
              onChange={value => {
                setReference(value)
                setDirty(true)
              }}
            />
            <Field
              label="Rubric"
              hint="One point per line, heaviest first. Server-side only."
              value={rubricText}
              rows={4}
              mono
              onChange={value => {
                setRubricText(value)
                setDirty(true)
              }}
            />

            {error && <p className="text-body-md text-error">{error}</p>}
            {!error && note && <p className="text-body-md text-success">{note}</p>}

            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={approve} disabled={busy || !complete}>
                <span className="inline-flex items-center gap-2">
                  <Check className="h-4 w-4" aria-hidden />
                  Approve
                </span>
              </Button>
              <Button variant="secondary" onClick={save} disabled={busy || !dirty}>
                Save draft
              </Button>
              {!current.rejected && (
                <Button variant="ghost" onClick={reject} disabled={busy}>
                  <span className="inline-flex items-center gap-2">
                    <X className="h-4 w-4" aria-hidden />
                    Reject
                  </span>
                </Button>
              )}
              {!complete && (
                <span className="text-label-md text-on-surface-variant">
                  A question, a reference answer, and one rubric point are required.
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface FieldProps {
  label: string
  hint: string
  value: string
  rows: number
  mono?: boolean
  onChange: (value: string) => void
}

function Field({ label, hint, value, rows, mono, onChange }: FieldProps) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-label-md font-medium text-on-surface">{label}</span>
      <span className="text-label-sm text-on-surface-variant">{hint}</span>
      <textarea
        value={value}
        rows={rows}
        onChange={event => onChange(event.target.value)}
        className={`w-full resize-y rounded-md bg-surface-container-low px-4 py-3 text-body-md text-on-surface focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-secondary/35 ${
          mono ? 'font-mono text-label-md' : ''
        }`}
      />
    </label>
  )
}
