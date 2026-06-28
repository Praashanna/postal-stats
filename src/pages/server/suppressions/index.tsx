import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/utils/confirm-dialog";
import { ErrorState } from "@/components/utils/error-state";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { useDeleteSuppressions, useServer, useSuppressions } from "@/lib/queries";
import { ShieldAlertIcon, MailIcon, RefreshCw, Trash2, UsersIcon } from "lucide-react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/ui/status-badge";

const PRESET_DOMAINS = {
  google: ["gmail.com", "google.com", "googlemail.com", "googleusercontent.com"],
  microsoft: ["hotmail.com", "live.com", "outlook.com", "msn.com", "windowslive.com"],
  yahoo: ["yahoo.com", "ymail.com", "rocketmail.com"],
} as const;

type DeleteAction =
  | { scope: "all" }
  | { scope: "domain"; domain: string }
  | { scope: "preset"; preset: keyof typeof PRESET_DOMAINS }
  | { scope: "address"; address: string };

function normalizeDomain(value: string) {
  return value.trim().replace(/^@+/, "").toLowerCase();
}

function formatSuppressionDate(value: string | null) {
  if (!value) return "Never";

  const parsed = Number(value);
  if (Number.isNaN(parsed)) return value;

  const date = new Date(parsed * 1000);
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getPaginationRange(currentPage: number, totalPages: number, delta: number = 2) {
  const range: Array<number> = [];
  const rangeWithDots: Array<number | "..."> = [];

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i += 1) {
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

  for (let i = startPage; i <= endPage; i += 1) {
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

export function SuppressionsPage() {
  const { serverId } = useParams<{ serverId: string }>();
  const { data: server } = useServer(serverId || "");
  const deleteSuppressions = useDeleteSuppressions();

  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [searchTerm, setSearchTerm] = useState("");
  const [domainTerm, setDomainTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [debouncedDomain, setDebouncedDomain] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<keyof typeof PRESET_DOMAINS | "">("");
  const [pendingDelete, setPendingDelete] = useState<DeleteAction | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedDomain(normalizeDomain(domainTerm));
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [domainTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [perPage]);

  const {
    data: suppressionsData,
    isLoading,
    error,
    refetch,
  } = useSuppressions(serverId || "", currentPage, perPage, debouncedSearch, debouncedDomain);

  if (!serverId) {
    return <div className="p-6">Please select a server from the sidebar.</div>;
  }

  if (isLoading && !suppressionsData) {
    return (
      <div className="w-full p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, index) => (
            <Skeleton key={index} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error) {
    return <ErrorState error={error} message="Failed to load suppressions" type="mail" />;
  }

  const paginationRange = suppressionsData ? getPaginationRange(currentPage, suppressionsData.pagination.last_page) : [];
  const normalizedDomain = normalizeDomain(domainTerm);

  const executeDelete = async () => {
    if (!pendingDelete) return;

    try {
      if (pendingDelete.scope === "all") {
        const result = await deleteSuppressions.mutateAsync({
          serverId,
          payload: { scope: "all" },
        });
        toast.success(`Deleted ${result.deleted} suppressions`);
      } else if (pendingDelete.scope === "domain") {
        const result = await deleteSuppressions.mutateAsync({
          serverId,
          payload: { scope: "domain", domain: pendingDelete.domain },
        });
        toast.success(`Deleted ${result.deleted} suppressions for ${pendingDelete.domain}`);
      } else if (pendingDelete.scope === "preset") {
        const result = await deleteSuppressions.mutateAsync({
          serverId,
          payload: { scope: "preset", preset: pendingDelete.preset },
        });
        toast.success(`Deleted ${result.deleted} suppressions for the ${pendingDelete.preset} preset`);
      } else if (pendingDelete.scope === "address") {
        const result = await deleteSuppressions.mutateAsync({
          serverId,
          payload: { scope: "address", address: pendingDelete.address },
        });
        toast.success(`Deleted ${result.deleted} suppression`);
      }

      await refetch();
    } catch (mutationError) {
      toast.error("Failed to delete suppressions");
    }
  };

  const deleteDialogTitle =
    pendingDelete?.scope === "all"
      ? "Delete all recipient suppressions"
      : pendingDelete?.scope === "domain"
        ? `Delete suppressions for ${pendingDelete.domain}`
        : pendingDelete?.scope === "preset"
          ? `Delete ${pendingDelete.preset} suppressions`
          : `Delete ${pendingDelete?.address ?? "suppression"}`;

  const deleteDialogDescription =
    pendingDelete?.scope === "all"
      ? "This removes every recipient suppression for the selected Postal server."
      : pendingDelete?.scope === "domain"
        ? "This removes every recipient suppression that matches the selected domain."
        : pendingDelete?.scope === "preset"
          ? "This removes every recipient suppression inside the selected preset domain group."
          : "This removes just the selected recipient suppression row.";

  return (
    <div className="w-full p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold">Suppressions</h1>
            {suppressionsData && <Badge variant="secondary">{suppressionsData.pagination.total.toLocaleString()} total</Badge>}
            {server && <StatusBadge status={server.status} />}
          </div>
          <p className="text-sm text-muted-foreground">
            Recipient rows only. Search addresses, filter by domain, and delete in bulk or one row at a time.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to={`/server/${serverId}/bounces`}>
              <MailIcon className="mr-2 h-4 w-4" />
              Bounces
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to={`/server/${serverId}`}>
              <UsersIcon className="mr-2 h-4 w-4" />
              Overview
            </Link>
          </Button>
          <Button variant="default" size="sm" disabled>
            <ShieldAlertIcon className="mr-2 h-4 w-4" />
            Suppressions
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="space-y-1">
          <CardTitle>Filters and actions</CardTitle>
          <CardDescription>
            Search by email fragment, narrow by domain, and control how many rows you see per page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-4">
            <Input
              placeholder="Search address fragments"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
            <Input
              placeholder="Filter by domain, for example gmail.com"
              value={domainTerm}
              onChange={(event) => setDomainTerm(event.target.value)}
            />
            <Select value={String(perPage)} onValueChange={(value) => setPerPage(Number(value))}>
              <SelectTrigger>
                <SelectValue placeholder="Rows per page" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 rows</SelectItem>
                <SelectItem value="30">30 rows</SelectItem>
                <SelectItem value="50">50 rows</SelectItem>
                <SelectItem value="100">100 rows</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedPreset} onValueChange={(value) => setSelectedPreset(value as keyof typeof PRESET_DOMAINS)}>
              <SelectTrigger>
                <SelectValue placeholder="Preset delete group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="google">Google</SelectItem>
                <SelectItem value="microsoft">Microsoft</SelectItem>
                <SelectItem value="yahoo">Yahoo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="destructive"
              onClick={() => setPendingDelete({ scope: "all" })}
              disabled={deleteSuppressions.isPending}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete all
            </Button>
            <Button
              variant="outline"
              onClick={() => setPendingDelete({ scope: "domain", domain: normalizedDomain })}
              disabled={!normalizedDomain || deleteSuppressions.isPending}
            >
              Delete domain
            </Button>
            <Button
              variant="outline"
              onClick={() => selectedPreset && setPendingDelete({ scope: "preset", preset: selectedPreset })}
              disabled={!selectedPreset || deleteSuppressions.isPending}
            >
              Delete preset
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setSearchTerm("");
                setDomainTerm("");
                setSelectedPreset("");
                setCurrentPage(1);
              }}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Clear filters
            </Button>
          </div>

          {normalizedDomain && (
            <p className="text-xs text-muted-foreground">
              Domain filter and domain delete target: <span className="font-medium text-foreground">{normalizedDomain}</span>
            </p>
          )}

          {selectedPreset && (
            <p className="text-xs text-muted-foreground">
              Preset delete target: <span className="font-medium text-foreground">{selectedPreset}</span> ({PRESET_DOMAINS[selectedPreset].join(", ")}, etc)
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recipient suppressions</CardTitle>
          <CardDescription>
            Showing {suppressionsData?.data.length ?? 0} of {suppressionsData?.pagination.total ?? 0} rows
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Address</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Keep until</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppressionsData?.data.length ? (
                suppressionsData.data.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.address}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{row.domain}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[18rem] truncate">{row.reason || "No reason provided"}</TableCell>
                    <TableCell>{formatSuppressionDate(row.keep_until)}</TableCell>
                    <TableCell>{formatSuppressionDate(row.timestamp)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setPendingDelete({ scope: "address", address: row.address })}
                        disabled={deleteSuppressions.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete suppression</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                    No recipient suppressions match the current filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {suppressionsData && suppressionsData.pagination.last_page > 1 && (
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
                      onClick={() => setCurrentPage(Math.min(suppressionsData.pagination.last_page, currentPage + 1))}
                      className={currentPage === suppressionsData.pagination.last_page ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title={deleteDialogTitle}
        description={deleteDialogDescription}
        confirmText="Delete"
        variant="destructive"
        onConfirm={executeDelete}
      />
    </div>
  );
}

export default SuppressionsPage;