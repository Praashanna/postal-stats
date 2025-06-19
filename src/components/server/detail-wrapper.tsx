import { useParams } from "react-router-dom";
import { ServerSkeleton } from "./skeleton";
import { useServerDetail } from "@/hooks/use-server-detail";
import { ErrorState } from "@/components/utils/error-state";
import ServerContent from "./content";


export function DataWrapper() {
  const { serverId } = useParams<{ serverId: string }>();
  
  if (!serverId)
    return <div className="p-6">Please select a server from the sidebar.</div>;

  const {
    period,
    server,
    serverData,
    overviewData,
    isLoading,
    error,
    isPartiallyLoading,
    handleViewAllDomains,
    handlePeriodChange,
  } = useServerDetail(serverId);

  if ((isLoading && !serverData && !overviewData) || !serverData) {
    return <ServerSkeleton />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  return (
    <ServerContent
      serverId={serverId}
      server={server}
      serverData={serverData}
      overviewData={overviewData}
      period={period}
      isPartiallyLoading={isPartiallyLoading}
      onPeriodChange={handlePeriodChange}
      onViewAllDomains={handleViewAllDomains}
    />
  );
}

export default DataWrapper;
