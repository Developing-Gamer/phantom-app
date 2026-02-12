/**
 * Stack Auth Payments helpers for generated Phantom apps.
 *
 * Provides:
 * - Env validation (prevents empty-header ACCESS_TYPE_REQUIRED errors)
 * - Canonical Stack Auth server header builder
 * - Checkout URL creation with correct inline product shape
 * - Item-based entitlement verification
 */

const STACK_API_BASE = "https://api.stack-auth.com/api/v1";

const REQUIRED_ENV_KEYS = [
  "NEXT_PUBLIC_STACK_PROJECT_ID",
  "NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY",
  "STACK_SECRET_SERVER_KEY",
] as const;

export type PaymentsEnvKey = (typeof REQUIRED_ENV_KEYS)[number];

/**
 * Validate that all required Stack Auth env vars are present and non-empty.
 * Returns the list of missing keys (empty array = all good).
 */
export function validatePaymentsEnv(): PaymentsEnvKey[] {
  return REQUIRED_ENV_KEYS.filter(
    (key) => !process.env[key]?.trim()
  ) as unknown as PaymentsEnvKey[];
}

/**
 * Build the required server-auth headers for Stack Auth payments API calls.
 * Throws if any required env var is missing.
 */
export function getStackPaymentsHeaders(): Record<string, string> {
  const missing = validatePaymentsEnv();
  if (missing.length > 0) {
    throw new Error(
      `Missing Stack Auth env vars: ${missing.join(", ")}. Cannot build payments headers.`
    );
  }

  return {
    "content-type": "application/json",
    "x-stack-access-type": "server",
    "x-stack-project-id": process.env.NEXT_PUBLIC_STACK_PROJECT_ID!,
    "x-stack-secret-server-key": process.env.STACK_SECRET_SERVER_KEY!,
    "x-stack-publishable-client-key":
      process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY!,
  };
}

/**
 * Build a canonical product_inline object for create-purchase-url.
 *
 * @param displayName  - Human-readable plan name (e.g. "Pro", "Pirate Black")
 * @param priceUsd     - Price in USD as string (e.g. "5", "19.99")
 * @param planId       - Machine-friendly plan id (e.g. "pro", "pirate_black")
 * @param interval     - Billing interval: "month" | "year" | null for one-time
 */
export function buildInlineProduct(
  displayName: string,
  priceUsd: string,
  planId: string,
  interval: "month" | "year" | null = "month"
) {
  const itemKey = `${planId}_access`;

  const priceEntry: Record<string, unknown> = { USD: priceUsd };
  if (interval) {
    priceEntry.interval = [1, interval];
  }

  return {
    product: {
      display_name: displayName,
      customer_type: "user" as const,
      server_only: false,
      stackable: false,
      prices: {
        [interval ?? "one_time"]: priceEntry,
      },
      included_items: {
        [itemKey]: { quantity: 1 },
      },
    },
    itemKey,
  };
}

/**
 * Create a Stack Auth checkout URL for a user.
 * Returns { url } on success or { error, details } on failure.
 */
export async function createCheckoutUrl(input: {
  userId: string;
  productInline: Record<string, unknown>;
  returnUrl?: string;
}): Promise<{ url: string } | { error: string; details?: unknown }> {
  const headers = getStackPaymentsHeaders();

  const res = await fetch(
    `${STACK_API_BASE}/payments/purchases/create-purchase-url`,
    {
      method: "POST",
      headers,
      cache: "no-store",
      body: JSON.stringify({
        customer_type: "user",
        customer_id: input.userId,
        product_inline: input.productInline,
        return_url: input.returnUrl,
      }),
    }
  );

  const text = await res.text();

  if (!res.ok) {
    return {
      error: `Stack Auth checkout failed (${res.status})`,
      details: text,
    };
  }

  try {
    const json = JSON.parse(text) as { url?: string };
    if (json.url) return { url: json.url };
    return { error: "No checkout URL in response", details: text };
  } catch {
    return { error: "Invalid JSON response", details: text };
  }
}

/**
 * Check if a user has access to a specific item entitlement.
 * Returns true if the item exists with quantity > 0.
 */
export async function checkItemEntitlement(
  userId: string,
  itemId: string
): Promise<boolean> {
  const headers = getStackPaymentsHeaders();

  const res = await fetch(
    `${STACK_API_BASE}/payments/items/user/${encodeURIComponent(userId)}/${encodeURIComponent(itemId)}`,
    {
      method: "GET",
      headers,
      cache: "no-store",
    }
  );

  if (!res.ok) return false;

  try {
    const json = (await res.json()) as { quantity?: number };
    return typeof json.quantity === "number" && json.quantity > 0;
  } catch {
    return false;
  }
}

/**
 * Build a return URL with checkout success query params.
 */
export function buildReturnUrl(
  baseUrl: string,
  planId: string
): string {
  try {
    const url = new URL(baseUrl);
    url.searchParams.set("checkout", "success");
    url.searchParams.set("plan", planId);
    return url.toString();
  } catch {
    return baseUrl;
  }
}

