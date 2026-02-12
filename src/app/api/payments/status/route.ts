import { NextResponse } from "next/server";
import { stackServerApp } from "@/stack/server";
import {
  validatePaymentsEnv,
  checkItemEntitlement,
} from "@/lib/stack-payments";

/**
 * GET /api/payments/status?item=<item_id>
 *
 * Checks if the current user has an active entitlement for a given item.
 * Uses Stack Auth item-based verification (not product name matching).
 *
 * Query params:
 *   item: string  — the item key to check (e.g. "pro_access")
 *
 * Response:
 *   200 { hasAccess: boolean }
 *   4xx/5xx { error: string }
 */
export async function GET(request: Request) {
  try {
    // 1) Validate env vars
    const missing = validatePaymentsEnv();
    if (missing.length > 0) {
      return NextResponse.json(
        { error: "Missing Stack Auth env vars", missing },
        { status: 500, headers: { "Cache-Control": "no-store" } }
      );
    }

    // 2) Auth check
    const user = await stackServerApp.getUser({ tokenStore: request });
    if (!user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    // 3) Get item id from query params
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("item");
    if (!itemId) {
      return NextResponse.json(
        { error: "Missing required query param: item" },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    // 4) Check entitlement
    const hasAccess = await checkItemEntitlement(user.id, itemId);

    return NextResponse.json(
      { hasAccess },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unexpected error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}

