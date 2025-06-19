export type ServerStatus = "active" | "inactive" | "maintenance" | "unknown";

export interface ServerListItem {
  id: string;
  name: string;
  host: string;
  port: number;
  database: string;
  username: string;
  status: ServerStatus;
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