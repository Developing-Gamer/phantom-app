"use client"

import * as React from "react"
import { flushSync } from "react-dom"
import { MoonIcon, SunIcon } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void) => {
    ready: Promise<void>
  }
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

function subscribeToMount() {
  return () => {}
}

export function ThemeToggle() {
  const buttonRef = React.useRef<HTMLButtonElement>(null)
  const { resolvedTheme, setTheme } = useTheme()
  const mounted = React.useSyncExternalStore(
    subscribeToMount,
    () => true,
    () => false
  )

  const isDark = mounted && resolvedTheme === "dark"

  const toggleTheme = async () => {
    if (!mounted) return

    const nextTheme = isDark ? "light" : "dark"
    const button = buttonRef.current
    const rect = button?.getBoundingClientRect()
    const x = rect ? rect.left + rect.width / 2 : window.innerWidth - 32
    const y = rect ? rect.top + rect.height / 2 : 32

    const applyTheme = () => {
      setTheme(nextTheme)

      // Keep the DOM class in sync inside the View Transition snapshot.
      document.documentElement.classList.toggle("dark", nextTheme === "dark")
      document.documentElement.style.colorScheme = nextTheme
    }

    const viewTransitionDocument = document as ViewTransitionDocument

    if (!viewTransitionDocument.startViewTransition || prefersReducedMotion()) {
      applyTheme()
      return
    }

    const transition = viewTransitionDocument.startViewTransition(() => {
      flushSync(applyTheme)
    })

    await transition.ready

    const radius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    )

    document.documentElement.animate(
      {
        clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`],
      },
      {
        duration: 650,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        pseudoElement: "::view-transition-new(root)",
      }
    )
  }

  return (
    <Button
      ref={buttonRef}
      type="button"
      variant="outline"
      size="icon"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={isDark}
      onClick={toggleTheme}
      className="fixed top-4 right-4 z-50 overflow-hidden rounded-full bg-background/80 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/70"
    >
      <SunIcon className="scale-100 rotate-0 transition-transform duration-300 dark:scale-0 dark:-rotate-90" />
      <MoonIcon className="absolute scale-0 rotate-90 transition-transform duration-300 dark:scale-100 dark:rotate-0" />
    </Button>
  )
}
