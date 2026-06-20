import { useCallback, useEffect, useRef, useState } from "react"
import { useHexclaveApp, useUser } from "@hexclave/next"

import { db } from "@/lib/db"

export type InstantAuthSyncStatus = "idle" | "syncing" | "synced" | "error"

export type InstantAuthSyncState = {
  status: InstantAuthSyncStatus
  error: string | null
  retry: () => void
}

async function fetchInstantToken(authorization: string | null) {
  const response = await fetch("/api/auth/instantdb", {
    method: "POST",
    headers: authorization ? { Authorization: authorization } : undefined,
    credentials: "include",
  })

  if (!response.ok) {
    throw new Error(`InstantDB auth failed (${response.status})`)
  }

  const body = (await response.json()) as { token?: unknown }

  if (typeof body.token !== "string" || !body.token) {
    throw new Error("InstantDB auth failed: missing token")
  }

  return body.token
}

/**
 * Keeps InstantDB auth aligned with Hexclave.
 *
 * Hexclave is the source of truth. When the Hexclave user changes, InstantDB is
 * signed in with a freshly minted token (or signed out when Hexclave has no
 * user). The effect is keyed on both user ids, so it re-runs whenever either
 * side changes.
 */
export function useInstantDBAuth(): InstantAuthSyncState {
  const app = useHexclaveApp()
  const hexclaveUserId = useUser()?.id ?? null
  const instantUserId = db.useAuth().user?.id ?? null
  const [status, setStatus] = useState<InstantAuthSyncStatus>("idle")
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(false)
  // Bumping this forces the sync effect to re-run even when the ids are
  // unchanged (e.g. after a bfcache/back-button restore, or a manual retry).
  const [resyncToken, setResyncToken] = useState(0)

  useEffect(() => {
    mountedRef.current = true

    return () => {
      mountedRef.current = false
    }
  }, [])

  const retry = useCallback(() => {
    window.setTimeout(() => {
      if (!mountedRef.current) return
      setResyncToken((value) => value + 1)
    }, 0)
  }, [])

  // Re-attempt the sync whenever the tab is restored from the bfcache or
  // becomes visible again. Effects do not re-fire on a back-button restore, so
  // without this an aborted in-flight sync would leave the app stuck.
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) retry()
    }
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") retry()
    }

    window.addEventListener("pageshow", handlePageShow)
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      window.removeEventListener("pageshow", handlePageShow)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [retry])

  useEffect(() => {
    let active = true

    const setSyncResult = (
      nextStatus: InstantAuthSyncStatus,
      nextError: string | null,
    ) => {
      window.setTimeout(() => {
        if (!active || !mountedRef.current) return
        setStatus(nextStatus)
        setError(nextError)
      }, 0)
    }

    const sync = async () => {
      if (!hexclaveUserId) {
        if (instantUserId) await db.auth.signOut()
        setSyncResult("idle", null)
        return
      }

      if (instantUserId === hexclaveUserId) {
        setSyncResult("synced", null)
        return
      }

      setSyncResult("syncing", null)

      const authorization = await app.getAuthorizationHeader()
      const token = await fetchInstantToken(authorization)
      await db.auth.signInWithToken(token)

      setSyncResult("synced", null)
    }

    sync().catch((syncError: unknown) => {
      setSyncResult(
        "error",
        syncError instanceof Error ? syncError.message : String(syncError),
      )
    })

    return () => {
      active = false
    }
  }, [app, hexclaveUserId, instantUserId, resyncToken])

  return { status, error, retry }
}
