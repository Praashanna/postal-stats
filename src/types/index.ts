export type ServerStatus = "active" | "inactive" | "maintenance" | "unknown";

export interface ServerListItem {
  id: number;
  uuid: string;
  name: string;
  permalink: string;
  mode: string;
  host: string;
  port: number;
  database: string;
  username: string;
  is_active: boolean;
  status: ServerStatus;
  organization?: {
    id: number;
    uuid: string;
    name: string;
    permalink: string;
  };
}

export interface TimeSeriesDataPoint {
  date: string;
  sent: number;
  bounces: number;
  opens: number;
}

export interface ServerData {
  total_sent: number;
  total_bounces: number;
  total_opens: number;
  suppressionCount: number;
  timeSeriesData: TimeSeriesDataPoint[];
  server: Partial<ServerListItem>;
}

export type TimePeriod = "today" | "yesterday" | "7d" | "14d" | "30d";

export interface BouncedDomain {
  domain: string;
  count: number;
  percentage: number;
}

export interface BouncedEmail {
  email: string;
  domain: string;
  bounceDate: string;
  bounceCount: number;
}

export interface BounceErrorType {
  errorType: string;
  bounceCount: number;
  uniqueMessages: number;
  lastDelivery: string;
}

export type SuppressionDuration = "7d" | "1m" | "1y" | "infinite";

export interface BounceErrorTypeSuppressionResult {
  error_type: string;
  duration: SuppressionDuration;
  matched_addresses: number;
  inserted: number;
  updated: number;
  suppressed: number;
  keep_until: string;
  keep_until_timestamp: number;
}

export interface SuppressionRow {
  id: number;
  type: "recipient";
  address: string;
  reason: string;
  timestamp: string;
  keep_until: string | null;
  domain: string;
}

export interface SuppressionPagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface SuppressionsResponse {
  data: SuppressionRow[];
  pagination: SuppressionPagination;
}

export interface SuppressionDeleteResult {
  deleted: number;
}

export interface PaginatedResponse<T> {
  data: T;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface BouncedEmailsData {
  topDomains: BouncedDomain[];
  totalBounces: number;
  totalDomains: number;
  period: TimePeriod;
}

export interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: { id: string; email: string; name: string } | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}
