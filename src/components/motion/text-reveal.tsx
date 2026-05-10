"use client"

import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react"

import { cn } from "@/lib/utils"
import { motionPresets } from "@/lib/motion-presets"

interface TextRevealProps extends Omit<HTMLMotionProps<"span">, "children"> {
  text: string
  by?: "word" | "character"
  delay?: number
  staggerChildren?: number
}

export function TextReveal({
  text,
  by = "word",
  delay = 0,
  staggerChildren = by === "word" ? 0.045 : 0.018,
  className,
  ...props
}: TextRevealProps) {
  const shouldReduceMotion = useReducedMotion()
  const segments = by === "word" ? text.split(/(\s+)/) : Array.from(text)

  if (shouldReduceMotion) {
    return (
      <motion.span className={className} {...props}>
        {text}
      </motion.span>
    )
  }

  return (
    <motion.span
      aria-label={text}
      className={cn("inline-block", className)}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            delayChildren: delay,
            staggerChildren,
          },
        },
      }}
      {...props}
    >
      {segments.map((segment, index) => {
        const isWhitespace = /^\s+$/.test(segment)

        if (isWhitespace) {
          return segment
        }

        return (
          <motion.span
            aria-hidden="true"
            className="inline-block"
            key={`${segment}-${index}`}
            variants={{
              hidden: {
                opacity: 0,
                y: "0.55em",
                filter: "blur(6px)",
              },
              visible: {
                opacity: 1,
                y: "0em",
                filter: "blur(0px)",
                transition: {
                  duration: motionPresets.duration.expressive,
                  ease: motionPresets.easing.emphasized,
                },
              },
            }}
          >
            {segment}
          </motion.span>
        )
      })}
    </motion.span>
  )
}
