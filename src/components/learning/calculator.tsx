'use client'

import { useState } from 'react'
import { Calculator as CalculatorIcon, X } from 'lucide-react'

type Op = '+' | '−' | '×' | '÷'

const KEYS: (string | Op)[] = [
  'C', '⌫', '%', '÷',
  '7', '8', '9', '×',
  '4', '5', '6', '−',
  '1', '2', '3', '+',
  '0', '.', '=',
]

function apply(a: number, b: number, op: Op): number {
  switch (op) {
    case '+': return a + b
    case '−': return a - b
    case '×': return a * b
    case '÷': return b === 0 ? NaN : a / b
  }
}

/** Rounded to hide float noise, with thousands separators for reading. */
function format(value: string): string {
  if (value === 'Error') return value
  const [whole, fraction] = value.split('.')
  const grouped = Number(whole).toLocaleString('en-US', { maximumFractionDigits: 0 })
  const sign = whole.startsWith('-') && grouped[0] !== '-' ? '-' : ''
  return fraction !== undefined ? `${sign}${grouped}.${fraction}` : `${sign}${grouped}`
}

function tidy(n: number): string {
  if (!Number.isFinite(n)) return 'Error'
  return String(parseFloat(n.toPrecision(12)))
}

/**
 * A basic calculator for question sets that ask for a number. It sits in the
 * bottom-right corner as a button and opens into a small keypad.
 */
export function Calculator() {
  const [open, setOpen] = useState(false)
  const [display, setDisplay] = useState('0')
  const [stored, setStored] = useState<number | null>(null)
  const [op, setOp] = useState<Op | null>(null)
  // The next digit starts a fresh number rather than appending.
  const [fresh, setFresh] = useState(true)

  const press = (key: string) => {
    if (display === 'Error' && key !== 'C') {
      setDisplay('0'); setStored(null); setOp(null); setFresh(true)
      if (!/[0-9.]/.test(key)) return
    }

    if (/^[0-9]$/.test(key)) {
      setDisplay(d => (fresh || d === '0' ? key : d.length < 15 ? d + key : d))
      setFresh(false)
      return
    }

    switch (key) {
      case '.':
        setDisplay(d => (fresh ? '0.' : d.includes('.') ? d : d + '.'))
        setFresh(false)
        return
      case 'C':
        setDisplay('0'); setStored(null); setOp(null); setFresh(true)
        return
      case '⌫':
        if (fresh) return
        setDisplay(d => (d.length > 1 && d !== '-0' ? d.slice(0, -1).replace(/^-$/, '0') : '0'))
        return
      case '%':
        setDisplay(d => tidy(Number(d) / 100))
        setFresh(true)
        return
      case '=': {
        if (op === null || stored === null) return
        setDisplay(tidy(apply(stored, Number(display), op)))
        setStored(null); setOp(null); setFresh(true)
        return
      }
      default: {
        const next = key as Op
        // Chained operators evaluate left to right, like a pocket calculator.
        if (op !== null && stored !== null && !fresh) {
          const result = tidy(apply(stored, Number(display), op))
          setDisplay(result)
          setStored(result === 'Error' ? null : Number(result))
        } else {
          setStored(Number(display))
        }
        setOp(next)
        setFresh(true)
      }
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-30 flex flex-col items-end gap-3">
      {open && (
        <div
          role="dialog"
          aria-label="Calculator"
          className="animate-fade-in w-[264px] bg-surface-container-lowest rounded-3xl border border-on-surface/[0.06] shadow-[0_12px_40px_rgba(0,0,0,0.12)] p-4 flex flex-col gap-3"
        >
          <div className="rounded-2xl bg-surface-container-low px-4 py-3 flex flex-col items-end">
            <span className="h-4 text-label-md text-on-surface-variant tabular-nums">
              {stored !== null && op ? `${format(tidy(stored))} ${op}` : ''}
            </span>
            <span
              className="text-headline-lg text-on-surface tabular-nums truncate max-w-full"
              aria-live="polite"
            >
              {format(display)}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {KEYS.map(key => {
              const isOp = ['÷', '×', '−', '+', '='].includes(key)
              const isFn = ['C', '⌫', '%'].includes(key)
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => press(key)}
                  className={`h-11 rounded-xl text-title-md tabular-nums transition-colors ${
                    key === '0' ? 'col-span-2' : ''
                  } ${
                    key === '='
                      ? 'bg-[#17171c] text-white hover:bg-black'
                      : isOp && op === key && fresh
                        ? 'bg-on-surface/15 text-on-surface'
                        : isOp || isFn
                          ? 'bg-surface-container text-on-surface hover:bg-on-surface/10'
                          : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                  }`}
                  aria-label={key === '⌫' ? 'Delete' : key === 'C' ? 'Clear' : undefined}
                >
                  {key}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-label={open ? 'Close calculator' : 'Open calculator'}
        aria-expanded={open}
        className="w-12 h-12 rounded-full bg-[#17171c] text-white hover:bg-black flex items-center justify-center shadow-[0_6px_20px_rgba(0,0,0,0.18)] transition-colors"
      >
        {open ? <X size={20} /> : <CalculatorIcon size={20} />}
      </button>
    </div>
  )
}
