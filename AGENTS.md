<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

This is a Next.js 16 (Turbopack) app (`phantom-app`) built on the Hexclave platform (auth, teams, payments, etc.) with InstantDB. Package manager is `pnpm` (see `pnpm-lock.yaml`); Node 22.

### Running the app (important)

Do NOT run `pnpm dev` directly. The app instantiates `HexclaveClientApp`/`HexclaveServerApp` at import time, which throws `"you haven't provided a project ID"` and returns HTTP 500 unless Hexclave env vars are injected. Instead run the dev server wrapped in the Hexclave CLI, which boots a local Hexclave development dashboard on `http://127.0.0.1:26700` and injects the credentials:

```
pnpm exec hexclave dev --config-file ./hexclave.config.ts -- next dev --turbopack
```

The app serves on `http://localhost:3000`. The `hexclave dev` dashboard injects the Hexclave/Stack keys (`NEXT_PUBLIC_HEXCLAVE_PROJECT_ID`, `NEXT_PUBLIC_HEXCLAVE_PUBLISHABLE_CLIENT_KEY`, `HEXCLAVE_SECRET_SERVER_KEY`, and the `STACK_*`/`VITE_*`/`EXPO_*` aliases) automatically by spinning up an anonymous cloud dev project against `https://api.hexclave.com`.

### InstantDB env vars are NOT injected by `hexclave dev`

InstantDB is a separate service, so `hexclave dev` does **not** provide `NEXT_PUBLIC_INSTANT_APP_ID` / `INSTANT_ADMIN_TOKEN`. Without `NEXT_PUBLIC_INSTANT_APP_ID`, `src/lib/db.ts` calls `init()` with an empty app id and the **client** crashes on render with `"Instant must be initialized with an appId"` (the server may still return 200, but the browser shows the error boundary). In Phantom provisioning these are injected as secrets. For local dev without those secrets, put them in a gitignored `.env.local` (Next.js loads it automatically):

```
NEXT_PUBLIC_INSTANT_APP_ID=<app id>
INSTANT_ADMIN_TOKEN=<admin token>
```

If you have no InstantDB project, you can mint a throwaway one (expires ~2 weeks) with InstantDB's public endpoint — the response `app.id` and `app["admin-token"]` map to the two vars above:

```
curl -s -X POST https://api.instantdb.com/dash/apps/ephemeral -H 'content-type: application/json' -d '{"title":"phantom-app-dev"}'
```

### Dev auth data is ephemeral

The `hexclave dev` anonymous project resets when the local dashboard shuts down (it stops once no CLI sessions remain). Also, `hexclave.config.ts` sets `requireEmailVerification: true`, so newly signed-up users start `is_restricted: email_not_verified` and won't show up in the server `/api/v1/users` list until verified — sign-up itself still succeeds (the API returns 201 and the client is redirected to the authenticated home).

### Known gotcha: broken bundled `@swc/helpers` in the Hexclave dashboard

The Hexclave CLI lazily downloads a local dashboard runtime into `~/.stack/` on the first `hexclave dev`. That bundled runtime ships `@swc/helpers` **without its `esm/` directory**, so the dashboard crashes on startup with:

```
Error: Cannot find module '.../.stack/rde-dashboard-runtime-26700/node_modules/@swc/helpers/esm/_interop_require_default.js'
```

and `hexclave dev` then fails with `Timed out waiting for the development environment dashboard`. If you hit this, repair the cache by copying the complete `esm/` dir from the project's own (identical-version) `@swc/helpers`, then rerun `hexclave dev`:

```
SRC=$(echo node_modules/.pnpm/@swc+helpers@*/node_modules/@swc/helpers/esm | awk '{print $1}')
for d in ~/.stack/dashboards/*/node_modules/@swc/helpers; do
  [ -d "$d" ] && [ ! -d "$d/esm" ] && cp -r "$SRC" "$d/esm";
done
```

The CLI copies the dashboard from `~/.stack/dashboards/<version>` into the per-port runtime on each start, so patching the `dashboards/<version>` source is enough and survives restarts (it does not re-download while that version is cached).

### Lint / tests / checks

- Lint: `pnpm lint` (passes with one pre-existing `no-location-assign` warning).
- Tests: there is no automated test suite in this repo.
- `pnpm design:doctor` is a soft design-review check; it exits non-zero on the pre-existing template auth pages (reduced-motion warnings) — treat as advisory, not a setup failure.
- Target dev mode (`hexclave dev ... -- next dev`); `pnpm build` is the production build and is not needed for development.
