import { Suspense, lazy } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TimePeriod, TimeSeriesDataPoint } from "@/types";
import { getPeriodLabel } from "@/lib/period-utils";

// Lazy load the heavy chart component
const StatsChart = lazy(() => import("@/components/utils/stats-chart").then(m => ({ default: m.StatsChart })));

interface ChartSectionProps {
  data: TimeSeriesDataPoint[];
  period: TimePeriod;
}

export function ChartSection({ data, period }: ChartSectionProps) {
  if (!data.length) return null;

  const periodLabel = getPeriodLabel(period);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Statistics</CardTitle>
        <CardDescription>
          Email delivery metrics for the last {periodLabel.toLowerCase()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<div className="h-64 animate-pulse bg-muted rounded" />}>
          <StatsChart 
            data={data} 
            title={`Email Statistics - ${periodLabel}`}
            period={period}
          />
        </Suspense>
      </CardContent>
    </Card>
  );
}

export default ChartSection;
