import { RefreshCwIcon } from "lucide-react";

interface LoadingIndicatorProps {
  isLoading: boolean;
}

export function LoadingIndicator({ isLoading }: LoadingIndicatorProps) {
  if (!isLoading) return null;
  
  return (
    <div className="flex items-center justify-center p-4">
      <RefreshCwIcon className="h-4 w-4 animate-spin mr-2" />
      <span className="text-sm text-muted-foreground">Loading...</span>
    </div>
  );
}
