import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useBounceErrorTypes, useExportBounceErrorTypeAddresses, useSuppressBounceErrorTypeAddresses } from "@/lib/queries";
import { getSmtpStatusInfo } from "@/lib/smtp-status";
import { usePeriod } from "@/contexts/period-context";
import { SuppressionDuration } from "@/types";
import { ConfirmDialog } from "@/components/utils/confirm-dialog";
import { ErrorState } from "@/components/utils/error-state";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MailIcon, UsersIcon, AtSignIcon, ShieldAlertIcon, MessageSquareWarningIcon, DownloadIcon, BanIcon, ChevronDownIcon } from "lucide-react";
import { toast } from "sonner";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const SUPPRESSION_DURATION_LABELS: Record<SuppressionDuration, string> = {
  "7d": "7 days",
  "1m": "1 month",
  "1y": "1 year",
  infinite: "100 years",
};

type PendingSuppression = {
  errorType: string;
  duration: SuppressionDuration;
};

function getPaginationRange(currentPage: number, totalPages: number, delta: number = 2) {
  const range = [];
  const rangeWithDots = [];

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) {
      range.push(i);
    }
    return range;
  }

  const startPage = Math.max(2, currentPage - delta);
  const endPage = Math.min(totalPages - 1, currentPage + delta);

  rangeWithDots.push(1);

  if (startPage > 2) {
    rangeWithDots.push("...");
  }

  for (let i = startPage; i <= endPage; i++) {
    rangeWithDots.push(i);
  }

  if (endPage < totalPages - 1) {
    rangeWithDots.push("...");
  }

  if (totalPages > 1) {
    rangeWithDots.push(totalPages);
  }

  return rangeWithDots;
}

function formatDateTime(value: string) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function BounceErrorTypesPage() {
  const { serverId } = useParams<{ serverId: string }>();
  const { period, setPeriod } = usePeriod();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [pendingSuppression, setPendingSuppression] = useState<PendingSuppression | null>(null);
  const exportMutation = useExportBounceErrorTypeAddresses();
  const suppressMutation = useSuppressBounceErrorTypeAddresses();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: errorTypesData, isLoading: errorTypesLoading, error: errorTypesError } = useBounceErrorTypes(
    serverId || "",
    period,
    currentPage,
    15,
    debouncedSearch
  );

  if (!serverId) {
    return <div className="p-6">Please select a server from the sidebar.</div>;
  }

  if (errorTypesLoading && !errorTypesData) {
    return (
      <div className="w-full p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (errorTypesError) {
    return (
      <ErrorState
        error={errorTypesError}
        message="Failed to load error type data"
        type="mail"
      />
    );
  }

  const paginationRange = errorTypesData ? getPaginationRange(currentPage, errorTypesData.totalPages) : [];

  const handleExport = async (errorType: string) => {
    try {
      await exportMutation.mutateAsync({ serverId, errorType, period });
      toast.success(`Exported addresses for ${errorType}`);
    } catch {
      toast.error(`Failed to export addresses for ${errorType}`);
    }
  };

  const executeSuppression = async () => {
    if (!pendingSuppression) return;

    try {
      const result = await suppressMutation.mutateAsync({
        serverId,
        errorType: pendingSuppression.errorType,
        duration: pendingSuppression.duration,
        period,
      });

      toast.success(
        `Suppressed ${result.suppressed.toLocaleString()} addresses for ${result.error_type}`
      );
    } catch {
      toast.error(`Failed to suppress addresses for ${pendingSuppression.errorType}`);
    }
  };

  return (
    <div className="w-full p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold">Bounce Error Types</h1>
          {errorTypesData && (
            <Badge variant="secondary">{errorTypesData.total.toLocaleString()} types</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search error types..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-[220px]"
          />
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="14d">Last 14 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link to={`/server/${serverId}/bounces`}>
            <MailIcon className="h-4 w-4 mr-2" />
            Overview
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link to={`/server/${serverId}/bounces/domain`}>
            <UsersIcon className="h-4 w-4 mr-2" />
            Bounced Domains
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link to={`/server/${serverId}/bounces/email`}>
            <AtSignIcon className="h-4 w-4 mr-2" />
            Bounced Emails
          </Link>
        </Button>
        <Button variant="default" size="sm">
          <MessageSquareWarningIcon className="h-4 w-4 mr-2" />
          Error Types
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link to={`/server/${serverId}/suppressions`}>
            <ShieldAlertIcon className="h-4 w-4 mr-2" />
            Suppressions
          </Link>
        </Button>
      </div>

      {errorTypesData && (
        <Card>
          <CardHeader>
            <CardTitle>Error Types</CardTitle>
            <CardDescription>
              Showing {errorTypesData.data.length} of {errorTypesData.total} SMTP response groups
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Error Type</TableHead>
                  <TableHead>Known Meaning</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                  <TableHead className="text-right">Unique Messages</TableHead>
                  <TableHead>Last Delivery</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {errorTypesData.data.map((errorType, index) => {
                  const statusInfo = getSmtpStatusInfo(errorType.errorType);

                  return (
                    <TableRow key={`${errorType.errorType}-${index}`}>
                      <TableCell className="font-medium">{errorType.errorType}</TableCell>
                      <TableCell>
                        {statusInfo ? (
                          <div className="max-w-[360px]">
                            <div className="font-medium">{statusInfo.summary}</div>
                            <div className="text-sm text-muted-foreground">{statusInfo.description}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">{errorType.bounceCount.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{errorType.uniqueMessages.toLocaleString()}</TableCell>
                      <TableCell>{formatDateTime(errorType.lastDelivery)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleExport(errorType.errorType)}
                            disabled={exportMutation.isPending}
                            title={`Export addresses for ${errorType.errorType}`}
                          >
                            <DownloadIcon className="h-4 w-4" />
                            <span className="sr-only">Export addresses for {errorType.errorType}</span>
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={suppressMutation.isPending}
                              >
                                <BanIcon className="mr-2 h-4 w-4" />
                                Suppress
                                <ChevronDownIcon className="ml-2 h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {(Object.keys(SUPPRESSION_DURATION_LABELS) as SuppressionDuration[]).map((duration) => (
                                <DropdownMenuItem
                                  key={duration}
                                  onClick={() => setPendingSuppression({ errorType: errorType.errorType, duration })}
                                >
                                  {SUPPRESSION_DURATION_LABELS[duration]}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {errorTypesData.totalPages > 1 && (
              <div className="mt-4 flex justify-center">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>

                    {paginationRange.map((pageNumber, index) => (
                      <PaginationItem key={index}>
                        {pageNumber === "..." ? (
                          <PaginationEllipsis />
                        ) : (
                          <PaginationLink
                            onClick={() => setCurrentPage(Number(pageNumber))}
                            isActive={currentPage === pageNumber}
                            className="cursor-pointer"
                          >
                            {pageNumber}
                          </PaginationLink>
                        )}
                      </PaginationItem>
                    ))}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setCurrentPage(Math.min(errorTypesData.totalPages, currentPage + 1))}
                        className={currentPage === errorTypesData.totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={!!pendingSuppression}
        onOpenChange={(open) => !open && setPendingSuppression(null)}
        title={`Suppress ${pendingSuppression?.errorType ?? "error type"} addresses`}
        description={`Add all matched recipient addresses for this error type to the suppression list for ${
          pendingSuppression ? SUPPRESSION_DURATION_LABELS[pendingSuppression.duration] : "the selected duration"
        } using the current ${period} period.`}
        confirmText="Add suppressions"
        variant="destructive"
        onConfirm={executeSuppression}
      />
    </div>
  );
}
