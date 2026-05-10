import "server-only"

import * as jose from "jose"

export type StackJwtUser = {
  id: string
  authPath: "jwt"
}

type JoseLike = Pick<typeof jose, "createRemoteJWKSet" | "jwtVerify">

let cachedJwks:
  | {
      projectId: string
      jwks: ReturnType<typeof jose.createRemoteJWKSet>
    }
  | null = null

function decodeBase64(value: string) {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(value, "base64").toString("utf8")
  }

  return globalThis.atob(value)
}

export function extractStackAccessTokenFromAuthorization(
  authorization: string | null
) {
  if (!authorization) return null

  const bearerPrefix = "Bearer "
  if (!authorization.startsWith(bearerPrefix)) return null

  const token = authorization.slice(bearerPrefix.length).trim()

  if (!token) return null

  if (!token.startsWith("stackauth_")) {
    return token
  }

  try {
    const payload = JSON.parse(decodeBase64(token.slice("stackauth_".length))) as {
      accessToken?: unknown
    }

    return typeof payload.accessToken === "string" && payload.accessToken
      ? payload.accessToken
      : null
  } catch {
    return null
  }
}

function getStackJwks(projectId: string, joseImpl: JoseLike = jose) {
  if (cachedJwks?.projectId === projectId) return cachedJwks.jwks

  const jwks = joseImpl.createRemoteJWKSet(
    new URL(
      `https://api.stack-auth.com/api/v1/projects/${projectId}/.well-known/jwks.json`
    )
  )

  cachedJwks = { projectId, jwks }

  return jwks
}

export async function verifyStackJwtFromRequest(
  request: Request,
  options: {
    env?: NodeJS.ProcessEnv
    joseImpl?: JoseLike
  } = {}
): Promise<StackJwtUser | null> {
  const env = options.env ?? process.env
  const projectId = env.NEXT_PUBLIC_STACK_PROJECT_ID?.trim()

  if (!projectId) return null

  const accessToken = extractStackAccessTokenFromAuthorization(
    request.headers.get("authorization")
  )

  if (!accessToken) return null

  const joseImpl = options.joseImpl ?? jose
  const jwks = getStackJwks(projectId, joseImpl)
  const { payload } = await joseImpl.jwtVerify(accessToken, jwks, {
    algorithms: ["ES256"],
    audience: projectId,
  })

  return typeof payload.sub === "string" && payload.sub
    ? { id: payload.sub, authPath: "jwt" }
    : null
}

export function resetStackJwtCacheForTests() {
  cachedJwks = null
}

