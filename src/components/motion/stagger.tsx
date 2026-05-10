"use client"

import {
  motion,
  useReducedMotion,
  type HTMLMotionProps,
  type Variants,
} from "motion/react"

import { motionPresets, reducedMotionTransition } from "@/lib/motion-presets"

interface StaggerProps extends HTMLMotionProps<"div"> {
  delayChildren?: number
  staggerChildren?: number
  once?: boolean
}

export function Stagger({
  children,
  delayChildren = 0.04,
  staggerChildren = motionPresets.stagger.base,
  once = true,
  ...props
}: StaggerProps) {
  const shouldReduceMotion = useReducedMotion()

  const variants: Variants = {
    hidden: {},
    visible: {
      transition: shouldReduceMotion
        ? reducedMotionTransition()
        : {
            delayChildren,
            staggerChildren,
          },
    },
  }

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{
        once,
        amount: motionPresets.viewport.amount,
        margin: motionPresets.viewport.margin,
      }}
      variants={variants}
      {...props}
    >
      {children}
    </motion.div>
  )
}

