import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartConfig } from "@/components/ui/chart";
import { TimeSeriesDataPoint, TimePeriod } from "@/types";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface StatsChartProps {
  data: TimeSeriesDataPoint[];
  title: string;
  period: TimePeriod;
}

export function StatsChart({ data, title, period }: StatsChartProps) {
  // Chart configuration for colors
  const chartConfig: ChartConfig = {
    sent: {
      label: "Sent",
      color: "var(--chart-1)",
    },
    bounces: {
      label: "Bounces", 
      color: "var(--chart-2)",
    },
    opens: {
      label: "Opens",
      color: "var(--chart-3)",
    },
  };

  // Format date for display based on period
  const formattedData = useMemo(() => {
    return data.map((item) => {
      const date = new Date(item.date);
      let formattedDate: string;

      // For today and yesterday, show hour:minute format
      if (period === "today" || period === "yesterday") {
        formattedDate = date.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
      } else {
        // For other periods, show month and day
        formattedDate = date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
      }

      return {
        ...item,
        formattedDate,
      };
    });
  }, [data, period]);

  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-[400px] w-full">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <AreaChart
            data={formattedData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-sent)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-sent)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="colorBounces" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-bounces)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-bounces)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="colorOpens" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-opens)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-opens)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="formattedDate"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => value.toLocaleString()}
            />
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                borderColor: "hsl(var(--border))",
                borderRadius: "var(--radius)",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
              }}
              formatter={(value: number, name: string) => [
                value.toLocaleString(),
                chartConfig[name as keyof typeof chartConfig]?.label || name
              ]}
              labelFormatter={(label) => label}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="sent"
              stroke="var(--color-sent)"
              fillOpacity={1}
              fill="url(#colorSent)"
              name="Sent"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="bounces"
              stroke="var(--color-bounces)"
              fillOpacity={1}
              fill="url(#colorBounces)"
              name="Bounces"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="opens"
              stroke="var(--color-opens)"
              fillOpacity={1}
              fill="url(#colorOpens)"
              name="Opens"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export default StatsChart;