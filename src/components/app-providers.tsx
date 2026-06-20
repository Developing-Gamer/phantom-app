"use client"

import * as React from "react"
import { ErrorBoundary, type FallbackProps } from "react-error-boundary"
import { ThemeProvider } from "next-themes"
import { AlertTriangle, Home, RefreshCcw } from "lucide-react"

import { TRPCProvider } from "@/lib/trpc/client"
import { Button } from "@/components/ui/button"
import { TooltipProvider } from "@/components/ui/tooltip"

function AppErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  const message = error instanceof Error ? error.message : "Unexpected error"

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-6 text-foreground">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,oklch(0.35_0_0/18%),transparent_34%),linear-gradient(to_bottom,transparent,oklch(0_0_0/18%))]" />
      <div className="relative w-full max-w-[460px] overflow-hidden rounded-2xl border border-white/8 bg-zinc-950/75 p-6 text-card-foreground shadow-2xl shadow-black/30 ring-1 ring-white/6 backdrop-blur-xl">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full border border-destructive/20 bg-destructive/10 text-destructive">
            <AlertTriangle className="size-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">We hit a snag</h1>
            <p className="text-sm text-muted-foreground">
              The page crashed, but your session is still safe.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-white/8 bg-white/3 p-3">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Developer detail
          </p>
          <p className="mt-1 wrap-break-word font-mono text-sm text-foreground/85">
            {message}
          </p>
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Button className="h-10 flex-1" onClick={resetErrorBoundary}>
            <RefreshCcw className="size-4" />
            Try Again
          </Button>
          <Button
            variant="outline"
            className="h-10 flex-1"
            onClick={() => window.location.assign("/")}
          >
            <Home className="size-4" />
            Go Home
          </Button>
        </div>
      </div>
    </main>
  )
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary FallbackComponent={AppErrorFallback}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        enableColorScheme
      >
        <TRPCProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </TRPCProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
