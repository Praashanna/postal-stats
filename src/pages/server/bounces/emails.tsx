import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useBouncedEmails, useExportBouncedEmails } from "@/lib/queries";
import { usePeriod } from "@/contexts/period-context";
import { ErrorState } from "@/components/utils/error-state";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MailIcon, DownloadIcon, UsersIcon, AtSignIcon } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

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

export function BouncedEmailsPage() {
  const { serverId } = useParams<{ serverId: string }>();
  const { period, setPeriod } = usePeriod();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: emailsData, isLoading: emailsLoading, error: emailsError } = useBouncedEmails(
    serverId || "", 
    period, 
    currentPage, 
    50,
    debouncedSearch
  );

  const exportMutation = useExportBouncedEmails();

  const handleExportCSV = async () => {
    if (!serverId) return;
    
    try {
      await exportMutation.mutateAsync({ serverId, period });
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  if (!serverId) {
    return <div className="p-6">Please select a server from the sidebar.</div>;
  }

  if (emailsLoading && !emailsData) {
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

  if (emailsError) {
    return (
      <ErrorState 
        error={emailsError} 
        message="Failed to load emails data"
        type="mail"
      />
    );
  }

  const paginationRange = emailsData ? getPaginationRange(currentPage, emailsData.totalPages) : [];

  return (
    <div className="w-full p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold">Bounced Emails</h1>
          {emailsData && (
            <Badge variant="secondary">{emailsData.total.toLocaleString()} emails</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search emails..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-[200px]"
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
          <Button 
            onClick={handleExportCSV} 
            disabled={exportMutation.isPending} 
            size="sm"
          >
            <DownloadIcon className="h-4 w-4 mr-2" />
            {exportMutation.isPending ? "Exporting..." : "Export CSV"}
          </Button>
        </div>
      </div>

      <div className="flex gap-2">
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
        <Button variant="default" size="sm">
          <AtSignIcon className="h-4 w-4 mr-2" />
          Bounced Emails
        </Button>
      </div>

      {emailsData && (
        <Card>
          <CardHeader>
            <CardTitle>Bounced Emails</CardTitle>
            <CardDescription>
              Showing {emailsData.data.length} of {emailsData.total} emails
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead></TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead>Last Bounce</TableHead>
                  <TableHead className="text-right">Bounces</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {emailsData.data.map((email, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{email.email.split('@')[0]}</TableCell>
                    <TableCell>@</TableCell>
                    <TableCell>{email.domain}</TableCell>
                    <TableCell>{new Date(email.bounceDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                    })}</TableCell>
                    <TableCell className="text-right">{email.bounceCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {emailsData.totalPages > 1 && (
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
                        onClick={() => setCurrentPage(Math.min(emailsData.totalPages, currentPage + 1))}
                        className={currentPage === emailsData.totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
