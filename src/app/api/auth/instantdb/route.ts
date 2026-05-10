import { NextResponse } from "next/server"

import { getInstantAdminDb, InstantAdminConfigError } from "@/lib/instant-admin"
import { resolveStackInstantUser } from "@/lib/stack-instant-auth"

type TimingMarks = {
  stackVerify?: number
  instantToken?: number
  total?: number
}

function now() {
  return performance.now()
}

function durationSince(start: number) {
  return Math.max(0, now() - start)
}

function buildHeaders(timings: TimingMarks = {}) {
  const headers = new Headers({
    "Cache-Control": "no-store",
    Vary: "Authorization, Cookie",
  })

  if (process.env.NODE_ENV === "development") {
    const values = [
      timings.stackVerify != null
        ? `stack_verify;dur=${timings.stackVerify.toFixed(1)}`
        : null,
      timings.instantToken != null
        ? `instant_token;dur=${timings.instantToken.toFixed(1)}`
        : null,
      timings.total != null ? `total;dur=${timings.total.toFixed(1)}` : null,
    ].filter(Boolean)

    if (values.length > 0) {
      headers.set("Server-Timing", values.join(", "))
    }
  }

  return headers
}

function json(
  body: Record<string, unknown>,
  init: {
    status: number
    timings?: TimingMarks
  }
) {
  return NextResponse.json(body, {
    status: init.status,
    headers: buildHeaders(init.timings),
  })
}

function logAuthIssue(input: {
  message: string
  authPath?: string
  userId?: string
  durationMs: number
  error?: unknown
}) {
  if (process.env.NODE_ENV !== "development") return

  console.warn("[instant-auth]", {
    message: input.message,
    authPath: input.authPath,
    userIdPrefix: input.userId?.slice(0, 8),
    durationMs: Math.round(input.durationMs),
    error:
      input.error instanceof Error
        ? { name: input.error.name, message: input.error.message }
        : undefined,
  })
}

export async function POST(request: Request) {
  const totalStart = now()
  const timings: TimingMarks = {}
  let authPath = "none"
  let userId: string | undefined

  try {
    const stackStart = now()
    const stackResult = await resolveStackInstantUser(request, {
      getSdkUser: async (req) => {
        const { stackServerApp } = await import("@/stack/server")

        return stackServerApp.getUser({
          tokenStore: req,
          or: "return-null",
        })
      },
    })
    timings.stackVerify = durationSince(stackStart)
    authPath = stackResult.authPath
    userId = stackResult.user?.id

    if (!stackResult.user) {
      timings.total = durationSince(totalStart)
      return json({ error: "unauthorized" }, { status: 401, timings })
    }

    const instantStart = now()
    const token = await getInstantAdminDb().auth.createToken({
      id: stackResult.user.id,
    })
    timings.instantToken = durationSince(instantStart)
    timings.total = durationSince(totalStart)

    if (process.env.NODE_ENV === "development") {
      console.info("[instant-auth]", {
        message: "created InstantDB token",
        authPath,
        userIdPrefix: userId?.slice(0, 8),
        durationMs: Math.round(timings.total),
      })
    }

    return json({ token }, { status: 200, timings })
  } catch (error) {
    timings.total = durationSince(totalStart)

    logAuthIssue({
      message: "failed to create InstantDB token",
      authPath,
      userId,
      durationMs: timings.total,
      error,
    })

    if (error instanceof InstantAdminConfigError) {
      return json(
        {
          error: "missing_instant_env",
          missing: error.missing,
        },
        { status: 500, timings }
      )
    }

    return json(
      {
        error: "instant_auth_failed",
      },
      { status: 500, timings }
    )
  }
}
