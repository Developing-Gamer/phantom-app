"use client"

import * as React from "react"
import Lenis, { type LenisOptions } from "lenis"

interface SmoothScrollProviderProps {
  children: React.ReactNode
  options?: LenisOptions
}

function shouldReduceMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

export function SmoothScrollProvider({
  children,
  options,
}: SmoothScrollProviderProps) {
  React.useEffect(() => {
    if (shouldReduceMotion()) return

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      ...options,
    })

    let frame = 0

    const raf = (time: number) => {
      lenis.raf(time)
      frame = requestAnimationFrame(raf)
    }

    frame = requestAnimationFrame(raf)

    return () => {
      cancelAnimationFrame(frame)
      lenis.destroy()
    }
  }, [options])

  return <>{children}</>
}

