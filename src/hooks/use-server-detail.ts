import { useNavigate } from "react-router-dom";
import { useServerStats, useBounceData, useServer } from "@/lib/queries";
import { usePeriod } from "@/contexts/period-context";
import { TimePeriod } from "@/types";

export function useServerDetail(serverId: string) {
  const navigate = useNavigate();
  const { period, setPeriod } = usePeriod();

  const serverStatsQuery = useServerStats(serverId, period);
  const serverQuery = useServer(serverId);

  const bounceQuery = useBounceData(serverId, period);

  const handleViewAllDomains = () => {
    navigate(`/server/${serverId}/bounces/domain`);
  };

  const handlePeriodChange = (newPeriod: TimePeriod) => {
    setPeriod(newPeriod);
  };

  return {
    period,
    server: serverQuery.data,
    serverData: serverStatsQuery.data,
    overviewData: bounceQuery.data,
    isLoading: serverStatsQuery.isLoading || bounceQuery.isLoading,
    error: serverStatsQuery.error || bounceQuery.error,
    isPartiallyLoading: serverStatsQuery.isLoading || bounceQuery.isLoading,
    handleViewAllDomains,
    handlePeriodChange,
  };
}
