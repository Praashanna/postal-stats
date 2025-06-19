import { cn } from "@/lib/utils";
import { ServerStatus } from "@/types";

interface StatusBadgeProps {
  status: ServerStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const getStatusColor = (status: ServerStatus) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "inactive":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "maintenance":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        getStatusColor(status),
        className
      )}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}