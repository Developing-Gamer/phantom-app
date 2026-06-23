import { NextResponse } from "next/server";
import {
  validatePaymentsEnv,
  getHexclavePaymentsHeaders,
  buildReturnUrl,
  HEXCLAVE_API_BASE,
} from "@/lib/hexclave-payments";

/**
 * POST /api/payments/checkout
 *
 * Creates a Hexclave checkout URL for the current user.
 *
 * Request body:
 *   productId?: string      — configured Hexclave product id from hexclave.config.ts
 *   productInline?: object  — fallback inline product definition
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
        { error: "Missing Hexclave env vars", missing },
        { status: 500 }
      );
    }

    // 2) Auth check
    const { hexclaveServerApp } = await import("@/hexclave/server");
    const user = await hexclaveServerApp.getUser({ tokenStore: request });
    if (!user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 3) Parse request body
    const body = (await request.json().catch(() => null)) as {
      productId?: string;
      productInline?: Record<string, unknown>;
      returnUrl?: string;
      planId?: string;
    } | null;

    const productId = body?.productId?.trim();
    const productBody = productId
      ? { product_id: productId }
      : body?.productInline
        ? { product_inline: body.productInline }
        : null;

    if (!productBody) {
      return NextResponse.json(
        { error: "productId or productInline is required in request body" },
        { status: 400 }
      );
    }

    // 4) Build return URL with checkout params
    const returnUrl = body?.returnUrl
      ? buildReturnUrl(body.returnUrl, body.planId ?? productId ?? "default")
      : undefined;

    // 5) Call Hexclave create-purchase-url
    const headers = getHexclavePaymentsHeaders();

    const res = await fetch(
      `${HEXCLAVE_API_BASE}/payments/purchases/create-purchase-url`,
      {
        method: "POST",
        headers,
        cache: "no-store",
        body: JSON.stringify({
          customer_type: "user",
          customer_id: user.id,
          ...productBody,
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
        { error: "Invalid response from Hexclave", details: resText },
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
