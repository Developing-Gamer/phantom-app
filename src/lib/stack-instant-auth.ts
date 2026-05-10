import "server-only"

import { verifyStackJwtFromRequest, type StackJwtUser } from "@/lib/stack-jwt"

export type StackInstantAuthPath = "sdk" | "jwt"

export type StackInstantUser = {
  id: string
  authPath: StackInstantAuthPath
}

export type StackInstantAuthResult = {
  user: StackInstantUser | null
  authPath: StackInstantAuthPath | "none"
  jwtError?: unknown
}

type SdkUser = {
  id?: string | null
}

export async function resolveStackInstantUser(
  request: Request,
  options: {
    env?: NodeJS.ProcessEnv
    getSdkUser: (request: Request) => Promise<SdkUser | null>
    verifyJwt?: typeof verifyStackJwtFromRequest
  }
): Promise<StackInstantAuthResult> {
  const env = options.env ?? process.env
  const verifyJwt = options.verifyJwt ?? verifyStackJwtFromRequest
  let jwtError: unknown

  if (env.STACK_INSTANT_AUTH_FAST_JWT === "1") {
    try {
      const jwtUser: StackJwtUser | null = await verifyJwt(request, { env })

      if (jwtUser) {
        return {
          user: jwtUser,
          authPath: "jwt",
        }
      }
    } catch (error) {
      jwtError = error
    }
  }

  const sdkUser = await options.getSdkUser(request)

  if (!sdkUser?.id) {
    return {
      user: null,
      authPath: "none",
      jwtError,
    }
  }

  return {
    user: {
      id: sdkUser.id,
      authPath: "sdk",
    },
    authPath: "sdk",
    jwtError,
  }
}

