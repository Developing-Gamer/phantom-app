import { useEffect, useReducer, useRef } from "react"
import { useStackApp, useUser } from "@stackframe/stack"

import { db } from "@/lib/db"

export type InstantAuthSyncStatus =
  | "idle"
  | "syncing"
  | "synced"
  | "signing-out"
  | "error"

export type InstantAuthSyncState = {
  status: InstantAuthSyncStatus
  isAuthenticating: boolean
  error: string | null
  stackUserId: string | null
  instantUserId: string | null
}

const RETRY_DELAYS_MS = [250, 750, 1500] as const

function createState(input: {
  status: InstantAuthSyncStatus
  error?: string | null
  stackUserId: string | null
  instantUserId: string | null
}): InstantAuthSyncState {
  return {
    status: input.status,
    isAuthenticating:
      input.status === "syncing" || input.status === "signing-out",
    error: input.error ?? null,
    stackUserId: input.stackUserId,
    instantUserId: input.instantUserId,
  }
}

function wait(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException("Aborted", "AbortError"))
      return
    }

    const timeout = window.setTimeout(resolve, ms)

    signal.addEventListener(
      "abort",
      () => {
        window.clearTimeout(timeout)
        reject(new DOMException("Aborted", "AbortError"))
      },
      { once: true }
    )
  })
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError"
}

function isTransientAuthSyncError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)

  return (
    message.includes("Failed to fetch") ||
    message.includes("ERR_CONNECTION") ||
    message.includes("NetworkError") ||
    message.toLowerCase().includes("network") ||
    message.includes("503") ||
    message.includes("502") ||
    message.includes("504")
  )
}

async function fetchInstantToken(input: {
  authorization: string | null
  signal: AbortSignal
}) {
  const response = await fetch("/api/auth/instantdb", {
    method: "POST",
    headers: {
      ...(input.authorization ? { Authorization: input.authorization } : {}),
    },
    credentials: "include",
    signal: input.signal,
  })

  if (!response.ok) {
    let details = ""

    try {
      const body = (await response.json()) as { error?: string }
      details = body.error ? `: ${body.error}` : ""
    } catch {
      details = ""
    }

    throw new Error(`InstantDB auth failed ${response.status}${details}`)
  }

  const body = (await response.json()) as { token?: unknown }

  if (typeof body.token !== "string" || !body.token) {
    throw new Error("InstantDB auth failed: missing token")
  }

  return body.token
}

/**
 * Keeps InstantDB auth aligned with Stack Auth.
 *
 * Stack Auth remains the source of truth. InstantDB receives short-lived
 * custom auth tokens only when the current Instant user is missing or does not
 * match the current Stack user.
 */
export function useInstantDBAuth() {
  const stackApp = useStackApp()
  const stackUser = useUser()
  const instantAuth = db.useAuth()
  const stackUserId = stackUser?.id ?? null
  const instantUserId = instantAuth.user?.id ?? null
  const [authState, dispatchAuthState] = useReducer(
    (_state: InstantAuthSyncState, nextState: InstantAuthSyncState) =>
      nextState,
    createState({
      status: "idle",
      stackUserId: null,
      instantUserId: null,
    })
  )
  const inFlightUserIdRef = useRef<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    let isMounted = true

    const setState = (
      status: InstantAuthSyncStatus,
      error: string | null = null
    ) => {
      if (!isMounted) return

      dispatchAuthState(
        createState({
          status,
          error,
          stackUserId,
          instantUserId,
        })
      )
    }

    const syncAuth = async () => {
      if (!stackUserId) {
        inFlightUserIdRef.current = null

        if (!instantUserId) {
          setState("idle")
          return
        }

        setState("signing-out")
        await db.auth.signOut()
        setState("idle")
        return
      }

      if (instantUserId === stackUserId) {
        inFlightUserIdRef.current = null
        setState("synced")
        return
      }

      if (inFlightUserIdRef.current === stackUserId) {
        return
      }

      inFlightUserIdRef.current = stackUserId

      try {
        if (instantUserId && instantUserId !== stackUserId) {
          setState("signing-out")
          await db.auth.signOut()
        }

        setState("syncing")

        let lastError: unknown

        for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
          if (attempt > 0) {
            await wait(RETRY_DELAYS_MS[attempt - 1]!, controller.signal)
          }

          try {
            const authorization = await stackApp.getAuthorizationHeader()
            const token = await fetchInstantToken({
              authorization,
              signal: controller.signal,
            })

            await db.auth.signInWithToken(token)
            setState("synced")
            return
          } catch (error) {
            if (isAbortError(error)) return

            lastError = error

            if (
              !isTransientAuthSyncError(error) ||
              attempt === RETRY_DELAYS_MS.length
            ) {
              break
            }
          }
        }

        const message =
          lastError instanceof Error
            ? lastError.message
            : "InstantDB authentication failed"

        setState("error", message)
      } finally {
        if (inFlightUserIdRef.current === stackUserId) {
          inFlightUserIdRef.current = null
        }
      }
    }

    syncAuth().catch((error: unknown) => {
      if (isAbortError(error)) return

      const message =
        error instanceof Error ? error.message : "InstantDB authentication failed"

      setState("error", message)
    })

    return () => {
      isMounted = false
      controller.abort()
    }
  }, [stackApp, stackUserId, instantUserId])

  return authState
}

