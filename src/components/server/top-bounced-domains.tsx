import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BouncedEmailsData } from "@/types";
import { getPeriodLabel } from "@/lib/period-utils";

interface TopBouncedDomainsProps {
  data: BouncedEmailsData;
  period: string;
  onViewAll: () => void;
}

export function TopBouncedDomains({ data, period, onViewAll }: TopBouncedDomainsProps) {
  if (!data.topDomains?.length) return null;

  const periodLabel = getPeriodLabel(period as any);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Bounced Domains</CardTitle>
        <CardDescription>
          Domains with the most bounced emails for {periodLabel.toLowerCase()}
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
            {data.topDomains.slice(0, 5).map((domain, index) => (
              <TableRow key={domain.domain}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      #{index + 1}
                    </Badge>
                    {domain.domain}
                  </div>
                </TableCell>
                <TableCell className="text-right">{domain.count.toLocaleString()}</TableCell>
                <TableCell className="text-right">{domain.percentage}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {data.topDomains.length > 5 && (
          <div className="mt-4 text-center">
            <button
              onClick={onViewAll}
              className="text-sm text-muted-foreground hover:text-foreground underline"
            >
              View all {data.topDomains.length} domains →
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default TopBouncedDomains;
