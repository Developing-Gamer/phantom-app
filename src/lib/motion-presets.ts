import type { Transition, Variants } from "motion/react"

type CubicBezier = [number, number, number, number]

export const motionPresets = {
  duration: {
    instant: 0.12,
    quick: 0.18,
    base: 0.32,
    expressive: 0.56,
    slow: 0.82,
  },
  easing: {
    standard: [0.22, 1, 0.36, 1],
    emphasized: [0.16, 1, 0.3, 1],
    entrance: [0.21, 1.02, 0.73, 1],
    exit: [0.7, 0, 0.84, 0],
  },
  viewport: {
    once: true,
    amount: 0.24,
    margin: "0px 0px -80px 0px",
  },
  stagger: {
    tight: 0.04,
    base: 0.07,
    loose: 0.11,
  },
} satisfies {
  duration: Record<string, number>
  easing: Record<string, CubicBezier>
  viewport: {
    once: boolean
    amount: number
    margin: string
  }
  stagger: Record<string, number>
}

export const revealVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 18,
    filter: "blur(8px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
  },
}

export const staggerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: motionPresets.stagger.base,
      delayChildren: 0.04,
    },
  },
}

export function reducedMotionTransition(): Transition {
  return {
    duration: 0.01,
    ease: "linear",
  }
}
