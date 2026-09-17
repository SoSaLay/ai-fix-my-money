'use client'

// ============================================================================
// Speaking an answer instead of typing it.
//
// Uses the browser's own speech recognition, so there is no upload and no bill.
// Chrome, Edge and Safari have it; Firefox does not, and there the microphone
// simply is not offered. The transcript lands in the same text the learner
// could have typed, so grading never knows the difference.
// ============================================================================

import { useCallback, useEffect, useRef, useState } from 'react'

// TypeScript's DOM library does not ship these yet.
interface RecognitionResult {
  readonly isFinal: boolean
  readonly 0: { readonly transcript: string }
}
interface RecognitionEvent {
  readonly results: ArrayLike<RecognitionResult>
}
interface RecognitionErrorEvent {
  readonly error: string
}
interface Recognition {
  continuous: boolean
  interimResults: boolean
  lang: string
  onstart: (() => void) | null
  onresult: ((event: RecognitionEvent) => void) | null
  onerror: ((event: RecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}
type RecognitionConstructor = new () => Recognition

function recognitionConstructor(): RecognitionConstructor | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as {
    SpeechRecognition?: RecognitionConstructor
    webkitSpeechRecognition?: RecognitionConstructor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

/** If the browser has not started hearing by now, it is not going to. */
const START_TIMEOUT_MS = 6000

const BLOCKED =
  'Microphone access is blocked. In Safari, open Settings for This Website (the Aa or page menu) and allow the microphone, then try again — or type your answer.'
const SPEECH_OFF =
  'Voice input is turned off on this device. On an iPhone or Mac, turn on Dictation in Settings under Keyboard, then try again — or type your answer.'

/**
 * Only one mic can be live on the page. Starting another question's mic ends
 * this one, so two buttons can never both say they are listening.
 */
let activeSession: { end: () => void } | null = null

/**
 * Asks for the microphone up front, so the browser shows its permission
 * prompt. Safari's speech recognition does not reliably ask on its own — it
 * just fails. The stream is only for the prompt and is closed immediately.
 */
async function requestMicrophone(): Promise<'granted' | 'denied' | 'unavailable'> {
  if (!navigator.mediaDevices?.getUserMedia) return 'unavailable'
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    stream.getTracks().forEach(track => track.stop())
    return 'granted'
  } catch (err) {
    const name = err instanceof DOMException ? err.name : ''
    return name === 'NotAllowedError' || name === 'SecurityError' ? 'denied' : 'unavailable'
  }
}

/**
 * `text` is whatever is already written; `onChange` receives it with the
 * spoken words appended, updated live as the browser hears them.
 *
 * The button state never waits on the browser to say it stopped. Safari does
 * not always fire `end` after an error or a stop, which left the button stuck
 * on "listening" with no way out, so every exit resets the state here.
 */
export function useDictation(text: string, onChange: (next: string) => void) {
  const [supported, setSupported] = useState(false)
  const [listening, setListening] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const session = useRef<{ end: () => void } | null>(null)
  const latest = useRef({ text, onChange })
  latest.current = { text, onChange }

  // Checked after mount so the server render and the first client render agree.
  useEffect(() => {
    setSupported(recognitionConstructor() !== null)
    return () => session.current?.end()
  }, [])

  const start = useCallback(async () => {
    const Ctor = recognitionConstructor()
    if (!Ctor || session.current) return

    activeSession?.end()
    setError(null)
    setListening(true)

    // A placeholder session, so a second tap or another mic can cancel while
    // the permission prompt is still open.
    let cancelled = false
    let live: { end: () => void } | null = null
    const pending = { end: () => { cancelled = true; finish() } }
    session.current = pending
    activeSession = pending

    function finish() {
      if (session.current === pending || session.current === live) session.current = null
      if (activeSession === pending || activeSession === live) activeSession = null
      setListening(false)
    }

    const mic = await requestMicrophone()
    if (cancelled) return
    if (mic === 'denied') {
      setError(BLOCKED)
      finish()
      return
    }

    // What was written before speaking stays put; each result event carries
    // the whole session so far, so it is rebuilt on top of this every time.
    const base = latest.current.text
    const joiner = base === '' || /\s$/.test(base) ? '' : ' '

    const r = new Ctor()
    r.continuous = true
    r.interimResults = true
    r.lang = navigator.language || 'en-US'

    let started = false
    let closed = false
    const timer = window.setTimeout(() => {
      if (started) return
      setError(SPEECH_OFF)
      close(true)
    }, START_TIMEOUT_MS)

    function close(abort: boolean) {
      if (closed) return
      closed = true
      window.clearTimeout(timer)
      r.onstart = r.onresult = r.onerror = r.onend = null
      try { if (abort) r.abort(); else r.stop() } catch { /* already stopped */ }
      finish()
    }

    live = { end: () => close(false) }
    session.current = live
    activeSession = live

    r.onstart = () => { started = true }
    r.onresult = event => {
      started = true
      const spoken = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('')
        .trim()
      latest.current.onChange(spoken === '' ? base : base + joiner + spoken)
    }
    r.onerror = event => {
      if (event.error === 'not-allowed') {
        setError(mic === 'granted' ? SPEECH_OFF : BLOCKED)
      } else if (event.error === 'service-not-allowed') {
        setError(SPEECH_OFF)
      } else if (event.error === 'no-speech') {
        setError('Did not catch anything. Try again a little closer to the mic.')
      } else if (event.error !== 'aborted') {
        setError('Voice input stopped unexpectedly. You can try again or type instead.')
      }
      close(true)
    }
    r.onend = () => close(false)

    try {
      r.start()
    } catch {
      setError('Could not start voice input. Try again or type instead.')
      close(true)
    }
  }, [])

  const stop = useCallback(() => {
    session.current?.end()
  }, [])

  return { supported, listening, error, start, stop }
}
