# Stack Auth Payments Starter

Pre-built payments helpers for Phantom-generated apps.

## Files

- `src/lib/stack-payments.ts` — Core helpers: env validation, header builder, checkout URL creation, item entitlement check
- `src/app/api/payments/checkout/route.ts` — POST endpoint to create Stack Auth checkout URLs
- `src/app/api/payments/status/route.ts` — GET endpoint to verify item-based entitlements

## How It Works

1. Agent creates a pricing UI and calls `/api/payments/checkout` with an inline product definition
2. User completes checkout on Stack Auth checkout page
3. User is redirected back with `?checkout=success&plan=<id>`
4. Page calls `/api/payments/status?item=<plan_id>_access` to verify entitlement
5. UI shows success state when `hasAccess: true`

## Required Env Vars

Set by Phantom during provisioning (no manual setup needed):

- `NEXT_PUBLIC_STACK_PROJECT_ID`
- `NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY`
- `STACK_SECRET_SERVER_KEY`

## Inline Product Shape

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

