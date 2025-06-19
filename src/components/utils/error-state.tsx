import { XCircleIcon, MailIcon } from "lucide-react";

type ErrorType = "default" | "mail";

interface ErrorStateProps {
  error: Error | unknown;
  message?: string;
  type?: ErrorType;
}

export function ErrorState({ error, message = "Failed to load server data", type = "default" }: ErrorStateProps) {
  const getIcon = () => {
    switch (type) {
      case "mail":
        return <MailIcon className="mx-auto h-12 w-12 text-destructive" />;
      case "default":
      default:
        return <XCircleIcon className="mx-auto h-12 w-12 text-destructive" />;
    }
  };

  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="text-center">
        {getIcon()}
        <h2 className="mt-2 text-xl font-semibold">Error Loading Data</h2>
        <p className="mt-1 text-muted-foreground">
          {error instanceof Error ? error.message : message}
        </p>
      </div>
    </div>
  );
}
