import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: number;
  description?: string;
  className?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function StatsCard({
  title,
  value,
  description,
  className,
  icon,
  onClick,
  trend,
}: StatsCardProps) {
  const formattedValue = new Intl.NumberFormat().format(value);

  return (
    <Card 
      className={cn(
        "overflow-hidden", 
        onClick && "cursor-pointer hover:bg-accent/50 transition-colors",
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && <div className="text-muted-foreground h-4 w-4">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formattedValue}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {trend && (
          <div
            className={cn(
              "mt-1 text-xs",
              trend.isPositive ? "text-green-600" : "text-red-600"
            )}
          >
            {trend.isPositive ? "+" : "-"}
            {trend.value}% from previous period
          </div>
        )}
      </CardContent>
    </Card>
  );
}