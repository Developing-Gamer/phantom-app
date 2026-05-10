import { createInstantRouteHandler } from "@instantdb/admin"

function getRouteHandler() {
  const appId = process.env.NEXT_PUBLIC_INSTANT_APP_ID?.trim()

  if (!appId) {
    return {
      POST: async () =>
        Response.json(
          { error: "Missing NEXT_PUBLIC_INSTANT_APP_ID" },
          { status: 500, headers: { "Cache-Control": "no-store" } }
        ),
    }
  }

  return createInstantRouteHandler({ appId })
}

export async function POST(request: Request) {
  return getRouteHandler().POST(request)
}

