import { beatRouter } from "./routers/beat";
import { checklistRouter } from "./routers/checklist";
import { packagingRouter } from "./routers/packaging";
import { videoRouter } from "./routers/video";
import { youtubeRouter } from "./routers/youtube";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  video: videoRouter,
  beat: beatRouter,
  packaging: packagingRouter,
  checklist: checklistRouter,
  youtube: youtubeRouter,
});

export type AppRouter = typeof appRouter;
