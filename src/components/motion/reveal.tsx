"use client"

import * as React from "react"
import {
  motion,
  useReducedMotion,
  type HTMLMotionProps,
  type Transition,
  type Variants,
} from "motion/react"

import { motionPresets, reducedMotionTransition } from "@/lib/motion-presets"

type RevealDirection = "up" | "down" | "left" | "right" | "none"

interface RevealProps extends Omit<HTMLMotionProps<"div">, "transition"> {
  delay?: number
  direction?: RevealDirection
  distance?: number
  duration?: number
  once?: boolean
  transition?: Transition
}

function getOffset(direction: RevealDirection, distance: number) {
  if (direction === "left") return { x: distance, y: 0 }
  if (direction === "right") return { x: -distance, y: 0 }
  if (direction === "down") return { x: 0, y: -distance }
  if (direction === "up") return { x: 0, y: distance }

  return { x: 0, y: 0 }
}

export function Reveal({
  children,
  delay = 0,
  direction = "up",
  distance = 18,
  duration = motionPresets.duration.base,
  once = true,
  transition,
  ...props
}: RevealProps) {
  const shouldReduceMotion = useReducedMotion()
  const offset = getOffset(direction, distance)

  const variants: Variants = shouldReduceMotion
    ? {
        hidden: { opacity: 1 },
        visible: { opacity: 1 },
      }
    : {
        hidden: {
          opacity: 0,
          x: offset.x,
          y: offset.y,
          filter: "blur(8px)",
        },
        visible: {
          opacity: 1,
          x: 0,
          y: 0,
          filter: "blur(0px)",
        },
      }

  const resolvedTransition: Transition = shouldReduceMotion
    ? reducedMotionTransition()
    : {
        duration,
        delay,
        ease: motionPresets.easing.standard,
        ...transition,
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
      transition={resolvedTransition}
      {...props}
    >
      {children}
    </motion.div>
  )
}
