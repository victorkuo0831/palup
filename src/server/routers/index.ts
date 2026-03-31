import { router } from "../trpc";
import { goalsRouter } from "./goals";

export const appRouter = router({
  goals: goalsRouter,
});

export type AppRouter = typeof appRouter;
