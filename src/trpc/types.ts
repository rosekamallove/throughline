import type { inferRouterOutputs } from "@trpc/server";

import type { AppRouter } from "@/server/api/root";

export type RouterOutputs = inferRouterOutputs<AppRouter>;

export type Video = RouterOutputs["video"]["list"][number];
export type VideoDetail = RouterOutputs["video"]["byId"];
export type Beat = RouterOutputs["beat"]["listByVideo"][number];
export type PackagingVariant = RouterOutputs["packaging"]["listByVideo"][number];
