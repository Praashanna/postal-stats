import { Suspense, lazy } from "react";
import { ServerSkeleton } from "@/components/server/skeleton";

const ServerDataWrapper = lazy(() => import("@/components/server/detail-wrapper"));

export function ServerDetailPage() {
  return (
    <Suspense fallback={<ServerSkeleton />}>
      <ServerDataWrapper />
    </Suspense>
  );
}
