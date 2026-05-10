"use client"

import * as React from "react"
import { ErrorBoundary, type FallbackProps } from "react-error-boundary"
import { ThemeProvider } from "next-themes"

import { TRPCProvider } from "@/lib/trpc/client"
import { TooltipProvider } from "@/components/ui/tooltip"

function AppErrorFallback({ error }: FallbackProps) {
  const message = error instanceof Error ? error.message : "Unexpected error"

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
      <div className="w-full max-w-md space-y-2 rounded-lg border bg-card p-5 text-card-foreground shadow-sm">
        <h1 className="text-lg font-semibold">Something went wrong</h1>
        <p className="text-sm text-muted-foreground">{message}</p>
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
