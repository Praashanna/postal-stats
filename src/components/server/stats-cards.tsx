import { MailIcon, XCircleIcon, CheckCircle2Icon } from "lucide-react";
import { StatsCard } from "@/components/ui/stats-card";
import { ServerData, TimePeriod } from "@/types";
import { getPeriodLabel } from "@/lib/period-utils";
import { Link } from "react-router-dom";

interface StatsCardsProps {
  data: ServerData;
  period: TimePeriod;
  serverId?: string;
}

export function StatsCards({ data, period, serverId }: StatsCardsProps) {
  const periodLabel = getPeriodLabel(period).toLowerCase();
  
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <StatsCard
        title="Total Sent"
        value={data.total_sent}
        icon={<MailIcon className="h-4 w-4" />}
        description={`in ${periodLabel}`}
      />
      <Link to={`/server/${serverId}/bounces`}>
        <StatsCard
          title="Total Bounces"
          value={data.total_bounces}
          icon={<XCircleIcon className="h-4 w-4" />}
          description={`in ${periodLabel}`}
        />
      </Link>
        <StatsCard
          title="Total Opens"
          value={data.total_opens}
          icon={<CheckCircle2Icon className="h-4 w-4" />}
        description={`in ${periodLabel}`}
      />
    </div>
  );
}

export default StatsCards;
