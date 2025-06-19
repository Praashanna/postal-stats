import { TimePeriod } from "@/types";

export const getPeriodLabel = (period: TimePeriod) => {
  switch (period) {
    case "today": return "Today";
    case "yesterday": return "Yesterday";
    case "7d": return "Last 7 days";
    case "14d": return "Last 14 days";
    case "30d": return "Last 30 days";
    default: return period;
  }
};

export const PERIOD_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "7d", label: "Last 7 days" },
  { value: "14d", label: "Last 14 days" },
  { value: "30d", label: "Last 30 days" },
] as const;
