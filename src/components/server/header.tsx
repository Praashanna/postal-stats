import { MailIcon } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TimePeriod } from "@/types";
import { PERIOD_OPTIONS } from "@/lib/period-utils";

interface HeaderProps {
  serverName: string;
  serverStatus: string;
  period: TimePeriod;
  onPeriodChange: (period: TimePeriod) => void;
}

export function Header({ serverName, serverStatus, period, onPeriodChange }: HeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <MailIcon className="h-8 w-8" />
        <div>
          <h1 className="text-2xl font-semibold">{serverName}</h1>
          <div className="flex items-center gap-2 mt-1">
            <StatusBadge status={serverStatus as any} />
          </div>
        </div>
      </div>
      <Select value={period} onValueChange={onPeriodChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select period" />
        </SelectTrigger>
        <SelectContent>
          {PERIOD_OPTIONS.map(option => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export default Header;
