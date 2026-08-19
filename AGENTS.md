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

The app serves on `http://localhost:3000`. In production/Phantom provisioning the Hexclave/InstantDB env vars (`NEXT_PUBLIC_HEXCLAVE_PROJECT_ID`, `NEXT_PUBLIC_HEXCLAVE_PUBLISHABLE_CLIENT_KEY`, `HEXCLAVE_SECRET_SERVER_KEY`, `NEXT_PUBLIC_INSTANT_APP_ID`) are set externally; locally the `hexclave dev` dashboard supplies them, so no manual `.env` is needed.

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
