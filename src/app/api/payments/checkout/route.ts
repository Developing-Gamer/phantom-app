import { NextResponse } from "next/server";
import { stackServerApp } from "@/stack/server";
import {
  validatePaymentsEnv,
  getStackPaymentsHeaders,
  buildReturnUrl,
} from "@/lib/stack-payments";

const STACK_API_BASE = "https://api.stack-auth.com/api/v1";

/**
 * POST /api/payments/checkout
 *
 * Creates a Stack Auth checkout URL for the current user.
 *
 * Request body:
 *   productInline: object   — inline product definition
 *   returnUrl?: string      — page to redirect back to after checkout
 *   planId?: string         — plan identifier for return URL params
 *
 * Response:
 *   200 { url: string }
 *   4xx/5xx { error: string, details?: unknown }
 */
export async function POST(request: Request) {
  try {
    // 1) Validate env vars
    const missing = validatePaymentsEnv();
    if (missing.length > 0) {
      return NextResponse.json(
        { error: "Missing Stack Auth env vars", missing },
        { status: 500 }
      );
    }

    // 2) Auth check
    const user = await stackServerApp.getUser({ tokenStore: request });
    if (!user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 3) Parse request body
    const body = (await request.json().catch(() => null)) as {
      productInline?: Record<string, unknown>;
      returnUrl?: string;
      planId?: string;
    } | null;

    if (!body?.productInline) {
      return NextResponse.json(
        { error: "productInline is required in request body" },
        { status: 400 }
      );
    }

    // 4) Build return URL with checkout params
    const returnUrl = body.returnUrl
      ? buildReturnUrl(body.returnUrl, body.planId ?? "default")
      : undefined;

    // 5) Call Stack Auth create-purchase-url
    const headers = getStackPaymentsHeaders();

    const res = await fetch(
      `${STACK_API_BASE}/payments/purchases/create-purchase-url`,
      {
        method: "POST",
        headers,
        cache: "no-store",
        body: JSON.stringify({
          customer_type: "user",
          customer_id: user.id,
          product_inline: body.productInline,
          return_url: returnUrl,
        }),
      }
    );

    const resText = await res.text();

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to create checkout URL", details: resText },
        { status: res.status }
      );
    }

    let resJson: Record<string, unknown> = {};
    try {
      resJson = JSON.parse(resText) as Record<string, unknown>;
    } catch {
      return NextResponse.json(
        { error: "Invalid response from Stack Auth", details: resText },
        { status: 502 }
      );
    }

    const url = typeof resJson.url === "string" ? resJson.url : null;
    if (!url) {
      return NextResponse.json(
        { error: "No checkout URL in response", details: resText },
        { status: 502 }
      );
    }

    return NextResponse.json({ url });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unexpected error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

