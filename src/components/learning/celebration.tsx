'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

// The site's own palette: the diagram purple, the progress green and yellow,
// the chart orange, and the near-black of the action buttons.
const COLOURS = ['#4c49c9', '#7d7bd8', '#1a6b3a', '#e0a300', '#ff9817', '#17171c']

const DURATION_MS = 4200

interface Piece {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  rotation: number
  spin: number
  wobble: number
  colour: string
  /** Paper strip, coin, or a dollar bill. */
  kind: 'strip' | 'coin' | 'bill'
}

/**
 * A one-off confetti burst over the whole screen, fired from both bottom
 * corners: paper strips, gold coins, and dollar bills. It runs for a few
 * seconds, fades, and leaves the page as it was. Skipped entirely for anyone
 * who has asked for reduced motion.
 */
export function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // Mounted on the body: a card that animates in is a containing block for
  // anything fixed inside it, which would crop the burst to the card.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  useEffect(() => {
    // The canvas only exists once the portal is up, so this waits for it.
    if (!mounted) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const dpr = window.devicePixelRatio || 1
    const resize = () => {
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const w = window.innerWidth
    const h = window.innerHeight
    const pieces: Piece[] = []
    const burst = (fromX: number, direction: 1 | -1) => {
      for (let i = 0; i < 90; i++) {
        const angle = (-60 - Math.random() * 25) * (Math.PI / 180)
        const speed = 11 + Math.random() * 9
        const roll = Math.random()
        pieces.push({
          x: fromX,
          y: h + 10,
          vx: Math.cos(angle) * speed * direction * -1,
          vy: Math.sin(angle) * speed,
          size: 6 + Math.random() * 6,
          rotation: Math.random() * Math.PI,
          spin: (Math.random() - 0.5) * 0.3,
          wobble: Math.random() * Math.PI * 2,
          colour: COLOURS[Math.floor(Math.random() * COLOURS.length)],
          kind: roll < 0.25 ? 'bill' : roll < 0.45 ? 'coin' : 'strip',
        })
      }
    }
    burst(0, -1)
    burst(w, 1)

    const start = performance.now()
    let frame = 0

    const draw = (now: number) => {
      const t = now - start
      ctx.clearRect(0, 0, w, h)
      // Fade the last stretch out rather than letting pieces vanish.
      ctx.globalAlpha = t > DURATION_MS - 800 ? Math.max(0, (DURATION_MS - t) / 800) : 1

      for (const p of pieces) {
        p.vy += 0.28
        p.vx *= 0.985
        p.vy *= 0.985
        p.wobble += 0.12
        p.x += p.vx + Math.sin(p.wobble) * 0.6
        p.y += p.vy
        p.rotation += p.spin

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rotation)
        // Turning flattens every piece, which is what reads as paper spinning.
        const turn = Math.abs(Math.cos(p.wobble))

        if (p.kind === 'bill') {
          const w = p.size * 2.2
          const h = p.size * 1.1 * turn
          ctx.fillStyle = '#1f7d44'
          ctx.fillRect(-w / 2, -h / 2, w, h)
          ctx.strokeStyle = '#bfe5cc'
          ctx.lineWidth = 1
          ctx.strokeRect(-w / 2 + 2, -h / 2 + 1.5, w - 4, Math.max(0, h - 3))
        } else if (p.kind === 'coin') {
          ctx.fillStyle = '#e0a300'
          ctx.beginPath()
          ctx.ellipse(0, 0, p.size / 2.2, (p.size / 2.2) * turn, 0, 0, Math.PI * 2)
          ctx.fill()
        } else {
          ctx.fillStyle = p.colour
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, (p.size / 2) * turn)
        }
        ctx.restore()
      }

      if (t < DURATION_MS) frame = requestAnimationFrame(draw)
      else ctx.clearRect(0, 0, w, h)
    }
    frame = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', resize)
    }
  }, [mounted])

  if (!mounted) return null

  return createPortal(
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-50 h-full w-full"
    />,
    document.body,
  )
}
