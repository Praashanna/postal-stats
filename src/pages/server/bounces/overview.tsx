import { useParams, Link } from "react-router-dom";
import { useBounceData } from "@/lib/queries";
import { usePeriod } from "@/contexts/period-context";
import { ErrorState } from "@/components/utils/error-state";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MailIcon, UsersIcon, AtSignIcon } from "lucide-react";

export function BouncesOverviewPage() {
  const { serverId } = useParams<{ serverId: string }>();
  const { period, setPeriod } = usePeriod();

  const { data: overviewData, isLoading: overviewLoading, error: overviewError } = useBounceData(
    serverId || "", 
    period
  );

  if (!serverId) {
    return <div className="p-6">Please select a server from the sidebar.</div>;
  }

  if (overviewLoading && !overviewData) {
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

  if (overviewError) {
    return (
      <ErrorState 
        error={overviewError} 
        message="Failed to load bounce data"
        type="mail"
      />
    );
  }

  return (
    <div className="w-full p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold">Bounces Overview</h1>
          {overviewData && (
            <Badge variant="secondary">{overviewData.totalBounces ?? 0} total</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
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
        <Button variant="default" size="sm">
          <MailIcon className="h-4 w-4 mr-2" />
          Overview
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
      </div>

      {overviewData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Bounces</CardTitle>
                <MailIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overviewData.totalBounces ?? 0}</div>
                <p className="text-xs text-muted-foreground">
                  in the selected period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unique Domains</CardTitle>
                <UsersIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overviewData.totalDomains || 0}</div>
                <p className="text-xs text-muted-foreground">affected domains</p>
              </CardContent>
            </Card>
          </div>

          {overviewData.topDomains && overviewData.topDomains.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Top Bounced Domains</CardTitle>
                <CardDescription>
                  Domains with the highest bounce rates
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
                    {overviewData.topDomains.slice(0, 10).map((domain, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{domain.domain}</TableCell>
                        <TableCell className="text-right">{domain.count.toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          {((domain.count / overviewData.totalBounces) * 100).toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {overviewData.topDomains.length > 10 && (
                  <div className="mt-4 text-center">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/server/${serverId}/bounces/domain`}>
                        View all {overviewData.topDomains.length} domains →
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
