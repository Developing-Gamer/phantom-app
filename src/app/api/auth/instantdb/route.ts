import { NextResponse } from "next/server"

import { getInstantAdminDb, InstantAdminConfigError } from "@/lib/instant-admin"
import { hexclaveServerApp } from "@/hexclave/server"

const NO_STORE = {
  "Cache-Control": "no-store",
  Vary: "Authorization, Cookie",
}

/**
 * POST /api/auth/instantdb
 *
 * Mints a short-lived InstantDB token for the currently signed-in Hexclave user.
 * Hexclave is the source of truth: the request must carry a valid Hexclave
 * session (cookie or Authorization header) for a token to be issued.
 */
export async function POST(request: Request) {
  try {
    const user = await hexclaveServerApp.getUser({
      tokenStore: request,
      or: "return-null",
    })

    if (!user?.id) {
      return NextResponse.json(
        { error: "unauthorized" },
        { status: 401, headers: NO_STORE }
      )
    }

    const token = await getInstantAdminDb().auth.createToken({ id: user.id })

    return NextResponse.json({ token }, { status: 200, headers: NO_STORE })
  } catch (error) {
    if (error instanceof InstantAdminConfigError) {
      return NextResponse.json(
        { error: "missing_instant_env", missing: error.missing },
        { status: 500, headers: NO_STORE }
      )
    }

    if (process.env.NODE_ENV === "development") {
      console.error("[instant-auth] failed to create InstantDB token", error)
    }

    return NextResponse.json(
      { error: "instant_auth_failed" },
      { status: 500, headers: NO_STORE }
    )
  }
}
