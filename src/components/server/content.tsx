
import { Suspense, lazy } from "react";
import { ServerData, BouncedEmailsData, TimePeriod, ServerListItem } from "@/types";
import { LoadingIndicator } from "@/components/utils/loading-indicator";

const Header = lazy(() => import("./header"));
const StatsCards = lazy(() => import("./stats-cards"));
const ChartSection = lazy(() => import("./chart-section"));
const TopBouncedDomains = lazy(() => import("@/components/server/top-bounced-domains"));

interface ServerContentProps {
  serverId: string;
  server: ServerListItem | undefined;
  serverData: ServerData;
  overviewData: BouncedEmailsData | undefined;
  period: TimePeriod;
  isPartiallyLoading: boolean;
  onPeriodChange: (period: TimePeriod) => void;
  onViewAllDomains: () => void;
}

export function ServerContent({
  serverId,
  server,
  serverData,
  overviewData,
  period,
  isPartiallyLoading,
  onPeriodChange,
  onViewAllDomains,
}: ServerContentProps) {

  return (
    <div className="w-full p-6 space-y-6">
      <Suspense fallback={<div className="h-20 animate-pulse bg-muted rounded" />}>
        <Header
          serverName={server?.name || `Server ${serverId}`}
          serverStatus={server?.status || "unknown"}
          period={period}
          onPeriodChange={onPeriodChange}
        />
      </Suspense>

      <Suspense fallback={<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 animate-pulse bg-muted rounded" />
        ))}
      </div>}>
        <StatsCards data={serverData} period={period} serverId={serverId} />
      </Suspense>

      {serverData.timeSeriesData && (
        <Suspense fallback={<div className="h-64 animate-pulse bg-muted rounded" />}>
          <ChartSection data={serverData.timeSeriesData} period={period} />
        </Suspense>
      )}

      {overviewData && (
        <Suspense fallback={<div className="h-48 animate-pulse bg-muted rounded" />}>
          <TopBouncedDomains 
            data={overviewData} 
            period={period} 
            onViewAll={onViewAllDomains} 
          />
        </Suspense>
      )}

      <LoadingIndicator isLoading={isPartiallyLoading} />
    </div>
  );
}

export default ServerContent;
