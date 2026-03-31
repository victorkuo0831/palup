import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { z } from "zod";

// ─── Context ──────────────────────────────────────────────────

export interface Context {
  userId: string | null;
  orgId: string | null;
}

export function createContext(): Context {
  // In production, extract from Clerk session
  return {
    userId: null,
    orgId: null,
  };
}

// ─── tRPC Init ────────────────────────────────────────────────

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

// Middleware: require authenticated user
const enforceAuth = t.middleware(({ ctx, next }) => {
  if (!ctx.userId || !ctx.orgId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      userId: ctx.userId,
      orgId: ctx.orgId,
    },
  });
});

export const protectedProcedure = t.procedure.use(enforceAuth);
