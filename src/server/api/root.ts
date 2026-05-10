import { initTRPC } from "@trpc/server"
import superjson from "superjson"
import { z } from "zod"

const t = initTRPC.create({
  transformer: superjson,
})

export const appRouter = t.router({
  health: t.procedure
    .input(
      z
        .object({
          source: z.string().optional(),
        })
        .optional()
    )
    .query(({ input }) => ({
      ok: true,
      source: input?.source ?? "phantom-app",
    })),
})

export type AppRouter = typeof appRouter
