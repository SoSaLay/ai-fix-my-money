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

/**
 * `text` is whatever is already written; `onChange` receives it with the
 * spoken words appended, updated live as the browser hears them.
 */
export function useDictation(text: string, onChange: (next: string) => void) {
  const [supported, setSupported] = useState(false)
  const [listening, setListening] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const recognition = useRef<Recognition | null>(null)
  const latest = useRef({ text, onChange })
  latest.current = { text, onChange }

  // Checked after mount so the server render and the first client render agree.
  useEffect(() => {
    setSupported(recognitionConstructor() !== null)
    return () => recognition.current?.abort()
  }, [])

  const start = useCallback(() => {
    const Ctor = recognitionConstructor()
    if (!Ctor || recognition.current) return

    // What was written before speaking stays put; each result event carries
    // the whole session so far, so it is rebuilt on top of this every time.
    const base = latest.current.text
    const joiner = base === '' || /\s$/.test(base) ? '' : ' '

    const r = new Ctor()
    r.continuous = true
    r.interimResults = true
    r.lang = navigator.language || 'en-US'

    r.onresult = event => {
      const spoken = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('')
        .trim()
      latest.current.onChange(spoken === '' ? base : base + joiner + spoken)
    }
    r.onerror = event => {
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setError('Microphone access is blocked. Allow it in your browser to speak your answer.')
      } else if (event.error === 'no-speech') {
        setError('Did not catch anything. Try again a little closer to the mic.')
      } else if (event.error !== 'aborted') {
        setError('Voice input stopped unexpectedly. You can try again or type instead.')
      }
    }
    r.onend = () => {
      recognition.current = null
      setListening(false)
    }

    setError(null)
    recognition.current = r
    try {
      r.start()
      setListening(true)
    } catch {
      recognition.current = null
      setError('Could not start voice input. Try again or type instead.')
    }
  }, [])

  const stop = useCallback(() => {
    recognition.current?.stop()
  }, [])

  return { supported, listening, error, start, stop }
}
