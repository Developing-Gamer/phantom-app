# Hexclave Payments Starter

Pre-built payments helpers for Phantom-generated apps.

## Files

- `src/lib/hexclave-payments.ts` — Core helpers: env validation, header builder, checkout URL creation, item entitlement check
- `src/app/api/payments/checkout/route.ts` — POST endpoint to create Hexclave checkout URLs
- `src/app/api/payments/status/route.ts` — GET endpoint to verify item-based entitlements

## How It Works

1. Agent defines products in `hexclave.config.ts` under `payments.productLines`, `payments.items`, and `payments.products`
2. Agent runs `pnpm hexclave:push` to sync the configured products to Hexclave
3. Pricing UI calls `/api/payments/checkout` with `productId`
4. User completes checkout on Hexclave checkout page
5. User is redirected back with `?checkout=success&plan=<id>`
6. Page calls `/api/payments/status?item=<plan_id>_access` to verify entitlement
7. UI shows success state when `hasAccess: true`

## Required Env Vars

Set by Phantom during provisioning (no manual setup needed):

- `NEXT_PUBLIC_HEXCLAVE_PROJECT_ID`
- `NEXT_PUBLIC_HEXCLAVE_PUBLISHABLE_CLIENT_KEY`
- `HEXCLAVE_SECRET_SERVER_KEY`

## Configured Product Checkout

Prefer configured products for real app flows:

```ts
await fetch("/api/payments/checkout", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    productId: "pro",
    planId: "pro",
    returnUrl: window.location.href,
  }),
});
```

Products should live in `hexclave.config.ts`:

```ts
payments: {
  productLines: {
    plans: { displayName: "Plans", customerType: "user" },
  },
  items: {
    pro_access: { displayName: "Pro Access", customerType: "user" },
  },
  products: {
    pro: {
      displayName: "Pro",
      productLineId: "plans",
      customerType: "user",
      prices: {
        monthly: { USD: "19.99", interval: [1, "month"] },
      },
      includedItems: {
        pro_access: { quantity: 1, expires: "when-purchase-expires" },
      },
    },
  },
}
```

## Inline Product Shape

Inline products remain available only as a fallback for temporary experiments.

```ts
{
  display_name: "Pro",
  customer_type: "user",
  server_only: false,
  stackable: false,
  prices: {
    monthly: { USD: "19.99", interval: [1, "month"] }
  },
  included_items: {
    pro_access: { quantity: 1 }
  }
}
```

## Anti-Patterns to Avoid

- Never use `customer_type: "individual"` (must be `"user"`)
- Never use `prices` as an array (must be object)
- Never use `?? ""` fallbacks for env vars in headers
- Never use team billing SDK (`selectedTeam.billing`)
- Never use empty `included_items: {}` (verification will fail)
- Never call `/internal/payments/setup` from generated apps
- Do not create inline products for durable plans; update `hexclave.config.ts`, run `pnpm hexclave:push`, and use `productId`
