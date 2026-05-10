import "server-only"

import { init } from "@instantdb/admin"

import schema, { type AppSchema } from "@/instant.schema"

type InstantAdminDb = ReturnType<typeof init<AppSchema>>

const REQUIRED_INSTANT_ENV_KEYS = [
  "NEXT_PUBLIC_INSTANT_APP_ID",
  "INSTANT_ADMIN_TOKEN",
] as const

export type InstantAdminEnvKey = (typeof REQUIRED_INSTANT_ENV_KEYS)[number]

export class InstantAdminConfigError extends Error {
  readonly missing: InstantAdminEnvKey[]

  constructor(missing: InstantAdminEnvKey[]) {
    super(`Missing InstantDB env vars: ${missing.join(", ")}`)
    this.name = "InstantAdminConfigError"
    this.missing = missing
  }
}

let instantAdminDb: InstantAdminDb | null = null

export function getInstantAdminEnv(env: NodeJS.ProcessEnv = process.env) {
  const missing = REQUIRED_INSTANT_ENV_KEYS.filter((key) => !env[key]?.trim())

  if (missing.length > 0) {
    throw new InstantAdminConfigError(missing)
  }

  return {
    appId: env.NEXT_PUBLIC_INSTANT_APP_ID!,
    adminToken: env.INSTANT_ADMIN_TOKEN!,
  }
}

export function getInstantAdminDb() {
  if (instantAdminDb) return instantAdminDb

  const { appId, adminToken } = getInstantAdminEnv()

  instantAdminDb = init<AppSchema>({
    appId,
    adminToken,
    schema,
  })

  return instantAdminDb
}

export function resetInstantAdminDbForTests() {
  instantAdminDb = null
}

