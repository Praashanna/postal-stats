import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useBouncedDomains } from "@/lib/queries";
import { usePeriod } from "@/contexts/period-context";
import { ErrorState } from "@/components/utils/error-state";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MailIcon, UsersIcon, AtSignIcon } from "lucide-react";
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

export function BouncedDomainsPage() {
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

  const { data: domainsData, isLoading: domainsLoading, error: domainsError } = useBouncedDomains(
    serverId || "", 
    period, 
    currentPage, 
    50,
    debouncedSearch
  );

  if (!serverId) {
    return <div className="p-6">Please select a server from the sidebar.</div>;
  }

  if (domainsLoading && !domainsData) {
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

  if (domainsError) {
    return (
      <ErrorState 
        error={domainsError} 
        message="Failed to load domains data"
        type="mail"
      />
    );
  }

  const paginationRange = domainsData ? getPaginationRange(currentPage, domainsData.totalPages) : [];

  return (
    <div className="w-full p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold">Bounced Domains</h1>
          {domainsData && (
            <Badge variant="secondary">{domainsData.total.toLocaleString()} domains</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search domains..."
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
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link to={`/server/${serverId}/bounces`}>
            <MailIcon className="h-4 w-4 mr-2" />
            Overview
          </Link>
        </Button>
        <Button variant="default" size="sm">
          <UsersIcon className="h-4 w-4 mr-2" />
          Bounced Domains
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link to={`/server/${serverId}/bounces/email`}>
            <AtSignIcon className="h-4 w-4 mr-2" />
            Bounced Emails
          </Link>
        </Button>
      </div>

      {domainsData && (
        <Card>
          <CardHeader>
            <CardTitle>Bounced Domains</CardTitle>
            <CardDescription>
              Showing {domainsData.data.domains.length} of {domainsData.total} domains
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Domain</TableHead>
                  <TableHead className="text-right">Bounces</TableHead>
                  <TableHead className="text-right">Percentage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {domainsData.data.domains.map((domain, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{domain.domain}</TableCell>
                    <TableCell className="text-right">{domain.count.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{(domain.count / domainsData.data.totalBounces * 100).toFixed(2)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {domainsData.totalPages > 1 && (
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
                        onClick={() => setCurrentPage(Math.min(domainsData.totalPages, currentPage + 1))}
                        className={currentPage === domainsData.totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
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
