import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  ServerData, 
  ServerListItem, 
  BouncedEmailsData, 
  BouncedDomain, 
  BouncedEmail, 
  BounceErrorType,
  BounceErrorTypeSuppressionResult,
  PaginatedResponse, 
  SuppressionDuration,
  TimePeriod,
  SuppressionDeleteResult,
  SuppressionsResponse,
} from "@/types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const getAuthToken = (): string | null => {
  return localStorage.getItem("postalToken");
};

const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = getAuthToken();
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      errorData.message || `HTTP ${response.status}: ${response.statusText}`,
      response.status
    );
  }

  return response.json();
};

const apiRequestData = async <T> (
    endpoint: string,
    options: RequestInit = {}
) =>
{
    return (await apiRequest<{
        data: T;
        message: string;
        status: boolean;
    }>(endpoint, options)).data;
}

export const queryKeys = {
  auth: {
    currentUser: () => ['auth', 'currentUser'] as const,
  },
  servers: {
    all: () => ['servers'] as const,
    detail: (id: string) => ['servers', id] as const,
    stats: (id: string, period: TimePeriod) => ['servers', id, 'stats', period] as const,
    statsAll: (id: string) => ['servers', id, 'stats'] as const,
  },
  bounces: {
    data: (serverId: string, period: TimePeriod) => ['bounces', serverId, period] as const,
    domains: (serverId: string, period: TimePeriod, page: number, limit: number, search?: string) => 
      ['bounces', serverId, period, 'domains', page, limit, search] as const,
    emails: (serverId: string, period: TimePeriod, page: number, limit: number, search?: string) => 
      ['bounces', serverId, period, 'emails', page, limit, search] as const,
    errorTypes: (serverId: string, period: TimePeriod, page: number, limit: number, search?: string) =>
      ['bounces', serverId, period, 'error-types', page, limit, search] as const,
  },
  suppressions: {
    all: (serverId: string) => ['suppressions', serverId] as const,
    list: (serverId: string, page: number, perPage: number, search?: string, domain?: string) => 
      ['suppressions', serverId, page, perPage, search, domain] as const,
  },
  opens: {
    data: (serverId: string, period: TimePeriod) => ['opens', serverId, period] as const,
    domains: (serverId: string, period: TimePeriod, page: number, limit: number) => 
      ['opens', serverId, period, 'domains', page, limit] as const,
    addresses: (serverId: string, period: TimePeriod, page: number, limit: number) => 
      ['opens', serverId, period, 'addresses', page, limit] as const,
  },
};

const apiClient = {
  login: async (email: string, password: string) => {
    const response = await apiRequest<{
      status: string;
      access_token?: string;
      user?: {
        id: string;
        email: string;
        name: string;
      };
      error?: string;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.status === 'success' && response.access_token) {
      localStorage.setItem("postalToken", response.access_token);
      return { success: true, token: response.access_token };
    }

    throw new Error(response.error || "Login failed");
  },

  logout: async () => {
    try {
      await apiRequest<{ success: boolean }>('/auth/logout', {
        method: 'POST',
      });
    } finally {
      localStorage.removeItem("postalToken");
    }
    return { success: true };
  },

  getCurrentUser: async () => {
    return (await apiRequest<{
        user: {
            id: string;
            email: string;
            name: string;
        }
    }>('/auth/me')).user;
  },

  getServers: async (): Promise<ServerListItem[]> => {
    return apiRequestData<ServerListItem[]>('/servers');
  },

  getServerStats: async (serverId: string, period: TimePeriod): Promise<ServerData> => {
    const response = await apiRequestData<{
        totalSent: number;
        totalDelivered: number;
        totalBounced: number;
        totalHeld: number;
        totalOpened: number;
        suppressionCount: number;
        deliveryRate: number;
        bounceRate: number;
        openRate: number;
        chartData: {
            date: string;
            sent: number;
            delivered: number;
            bounced: number;
            held: number;
            opens: number;
        }[];
    }>(`/stats/server/${serverId}?period=${period}`);

    return {
      total_sent: response.totalSent,
      total_bounces: response.totalBounced,
      total_opens: response.totalOpened,
      suppressionCount: response.suppressionCount ?? 0,
      timeSeriesData: response.chartData.map(item => ({
        date: item.date,
        sent: item.sent,
        bounces: item.bounced,
        opens: item.opens
      })),
      server: {
        id: Number(serverId),
        name: "Server",
        status: "active"
      }
    };
  },

  getBounceData: async (serverId: string, period: TimePeriod): Promise<BouncedEmailsData> => {
    const response = await apiRequestData<{
        totalBounced: number;
        totalDomains: number;
        bounceRate: number;
        topDomains: Array<{
          domain: string;
          count: number;
          percentage: number;
        }>;
      }>(`/stats/server/${serverId}/bounces?period=${period}`);

    return {
      topDomains: response.topDomains,
      totalDomains: response.totalDomains,
      totalBounces: response.totalBounced,
      period
    };
  },

  getBouncedDomains: async (
    serverId: string,
    period: TimePeriod,
    page: number = 1,
    limit: number = 50,
    search: string = ""
  ): Promise<PaginatedResponse<{
      domains: BouncedDomain[],
      totalBounces: number;
    }>> => {
    const searchParam = search ? `&q=${encodeURIComponent(search)}` : '';
    const response = await apiRequestData<{
        data: {
          domains: Array<{
              id: string;
              domain: string;
              bounce_count: number;
              percentage: number;
              lastBounce: string;
          }>;
          totalBounces: number;
        };
        pagination: {
            page: number;
            per_page: number;
            total: number;
            last_page: number;
            hasNext: boolean;
            hasPrev: boolean;
        };
    }>(`/stats/server/${serverId}/bounces/domain?period=${period}&page=${page}&per_page=${limit}${searchParam}`);

    return {
      data: {
        domains: response.data.domains.map(item => ({
          domain: item.domain,
          count: item.bounce_count,
          percentage: 0
        })),
        totalBounces: response.data.totalBounces
      },
      total: response.pagination.total,
      page: response.pagination.page,
      limit: response.pagination.per_page,
      totalPages: response.pagination.last_page
    };
  },

  getBouncedEmails: async (
    serverId: string,
    period: TimePeriod,
    page: number = 1,
    limit: number = 50,
    search: string = ""
  ): Promise<PaginatedResponse<BouncedEmail[]>> => {
    const searchParam = search ? `&q=${encodeURIComponent(search)}` : '';
    const response = await apiRequestData<{
      data: Array<{
        address: string;
        domain: string;
        bounce_count: number;
        last_bounce: string;
      }>;
      pagination: {
        page: number;
        per_page: number;
        total: number;
        last_page: number;
      };
    }>(`/stats/server/${serverId}/bounces/email?period=${period}&page=${page}&limit=${limit}${searchParam}`);

    return {
      data: response.data.map(item => ({
        email: item.address,
        domain: item.domain,
        bounceDate: item.last_bounce,
        bounceCount: item.bounce_count
      })),
      total: response.pagination.total,
      page: response.pagination.page,
      limit: response.pagination.per_page,
      totalPages: response.pagination.last_page
    };
  },

  getBounceErrorTypes: async (
    serverId: string,
    period: TimePeriod,
    page: number = 1,
    limit: number = 15,
    search: string = ""
  ): Promise<PaginatedResponse<BounceErrorType[]>> => {
    const searchParam = search ? `&q=${encodeURIComponent(search)}` : '';
    const response = await apiRequestData<{
      data: Array<{
        error_type: string;
        bounce_count: number;
        unique_messages: number;
        last_delivery: string;
      }>;
      pagination: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
      };
    }>(`/stats/server/${serverId}/bounces/error-type?period=${period}&page=${page}&per_page=${limit}${searchParam}`);

    return {
      data: response.data.map(item => ({
        errorType: item.error_type,
        bounceCount: item.bounce_count,
        uniqueMessages: item.unique_messages,
        lastDelivery: item.last_delivery
      })),
      total: response.pagination.total,
      page: response.pagination.current_page,
      limit: response.pagination.per_page,
      totalPages: response.pagination.last_page
    };
  },

  exportBounceErrorTypeAddresses: async (
    serverId: string,
    errorType: string,
    period: TimePeriod
  ): Promise<void> => {
    const response = await fetch(
      `${API_BASE_URL}/export/server/${serverId}/bounces/error-type?error_type=${encodeURIComponent(errorType)}&period=${period}`,
      {
        headers: {
          Accept: 'text/csv',
          Authorization: `Bearer ${getAuthToken()}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(errorData.message || "Export failed", response.status);
    }

    const contentDisposition = response.headers.get("Content-Disposition");
    const filename = contentDisposition?.match(/filename="?([^"]+)"?/)?.[1] ?? `bounces-${serverId}-${errorType}-${period}.csv`;
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  suppressBounceErrorTypeAddresses: async (
    serverId: string,
    payload: {
      error_type: string;
      duration: SuppressionDuration;
      period: TimePeriod;
    },
  ): Promise<BounceErrorTypeSuppressionResult> => {
    return apiRequestData<BounceErrorTypeSuppressionResult>(
      `/stats/server/${serverId}/bounces/error-type/suppressions`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
  },

  exportBouncedEmails: async (serverId: string, period: TimePeriod): Promise<void> => {
    const response = await fetch(
      `${API_BASE_URL}/export/server/${serverId}/bounces/?period=${period}`,
      {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      }
    );

    if (!response.ok) {
      throw new ApiError("Export failed", response.status);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bounced-emails-${serverId}-${period}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  getOpensData: async (serverId: string, period: TimePeriod) => {
    return apiRequest<{
      summary: {
        totalOpens: number;
        uniqueOpens: number;
        openRate: number;
        topDomains: Array<{
          domain: string;
          opens: number;
          uniqueOpens: number;
          percentage: number;
        }>;
      };
      chartData: Array<{
        date: string;
        opens: number;
        uniqueOpens: number;
      }>;
    }>(`/servers/${serverId}/opens?period=${period}`);
  },

  getSuppressions: async (
    serverId: string,
    page: number = 1,
    perPage: number = 15,
    search: string = "",
    domain: string = "",
  ): Promise<SuppressionsResponse> => {
    const searchParam = search ? `&q=${encodeURIComponent(search)}` : "";
    const domainParam = domain ? `&domain=${encodeURIComponent(domain)}` : "";

    return apiRequestData<SuppressionsResponse>(
      `/stats/server/${serverId}/suppressions?page=${page}&per_page=${perPage}${searchParam}${domainParam}`
    );
  },

  deleteSuppressions: async (
    serverId: string,
    payload: {
      scope: "all" | "domain" | "preset" | "address";
      domain?: string;
      domains?: string[];
      preset?: "google" | "microsoft" | "yahoo";
      address?: string;
    },
  ): Promise<SuppressionDeleteResult> => {
    return apiRequestData<SuppressionDeleteResult>(`/stats/server/${serverId}/suppressions`, {
      method: "DELETE",
      body: JSON.stringify(payload),
    });
  },
};

const serverManagement = {
  testConnection: async (id: string | number) => {
    return apiRequest<{
      status: string;
      message: string;
      data: { connection_successful: boolean };
    }>(`/servers/${id}/test-connection`, {
      method: 'POST',
    });
  },

  getServer: async (id: string) => {
    return apiRequestData<ServerListItem>(`/servers/${id}`);
  }
};

export const useLogin = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => 
      apiClient.login(email, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.currentUser() });
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: apiClient.logout,
    onSuccess: () => {
      queryClient.clear();
    },
  });
};

export const useCurrentUser = () => {
  return useQuery({
    queryKey: queryKeys.auth.currentUser(),
    queryFn: apiClient.getCurrentUser,
    retry: false,
  });
};

export const useServers = () => {
  return useQuery({
    queryKey: queryKeys.servers.all(),
    queryFn: apiClient.getServers,
  });
};

export const useServer = (serverId: string) => {
  return useQuery({
    queryKey: queryKeys.servers.detail(serverId),
    queryFn: () => serverManagement.getServer(serverId),
    enabled: !!serverId,
  });
};

export const useServerStats = (serverId: string, period: TimePeriod) => {
  return useQuery({
    queryKey: queryKeys.servers.stats(serverId, period),
    queryFn: () => apiClient.getServerStats(serverId, period),
    enabled: !!serverId,
  });
};

export const useBounceData = (serverId: string, period: TimePeriod) => {
  return useQuery({
    queryKey: queryKeys.bounces.data(serverId, period),
    queryFn: () => apiClient.getBounceData(serverId, period),
    enabled: !!serverId,
  });
};

export const useBouncedDomains = (
  serverId: string, 
  period: TimePeriod, 
  page: number = 1, 
  limit: number = 50,
  search: string = ""
) => {
  return useQuery({
    queryKey: queryKeys.bounces.domains(serverId, period, page, limit, search),
    queryFn: () => apiClient.getBouncedDomains(serverId, period, page, limit, search),
    enabled: !!serverId,
    placeholderData: (previousData) => previousData,
  });
};

export const useBouncedEmails = (
  serverId: string, 
  period: TimePeriod, 
  page: number = 1, 
  limit: number = 50,
  search: string = ""
) => {
  return useQuery({
    queryKey: queryKeys.bounces.emails(serverId, period, page, limit, search),
    queryFn: () => apiClient.getBouncedEmails(serverId, period, page, limit, search),
    enabled: !!serverId,
    placeholderData: (previousData) => previousData,
  });
};

export const useBounceErrorTypes = (
  serverId: string,
  period: TimePeriod,
  page: number = 1,
  limit: number = 15,
  search: string = ""
) => {
  return useQuery({
    queryKey: queryKeys.bounces.errorTypes(serverId, period, page, limit, search),
    queryFn: () => apiClient.getBounceErrorTypes(serverId, period, page, limit, search),
    enabled: !!serverId,
    placeholderData: (previousData) => previousData,
  });
};

export const useExportBounceErrorTypeAddresses = () => {
  return useMutation({
    mutationFn: ({ serverId, errorType, period }: { serverId: string; errorType: string; period: TimePeriod }) =>
      apiClient.exportBounceErrorTypeAddresses(serverId, errorType, period),
  });
};

export const useSuppressBounceErrorTypeAddresses = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      serverId,
      errorType,
      duration,
      period,
    }: {
      serverId: string;
      errorType: string;
      duration: SuppressionDuration;
      period: TimePeriod;
    }) =>
      apiClient.suppressBounceErrorTypeAddresses(serverId, {
        error_type: errorType,
        duration,
        period,
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.suppressions.all(variables.serverId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.servers.statsAll(variables.serverId) });
    },
  });
};

export const useExportBouncedEmails = () => {
  return useMutation({
    mutationFn: ({ serverId, period }: { serverId: string; period: TimePeriod }) =>
      apiClient.exportBouncedEmails(serverId, period),
  });
};

export const useOpensData = (serverId: string, period: TimePeriod) => {
  return useQuery({
    queryKey: queryKeys.opens.data(serverId, period),
    queryFn: () => apiClient.getOpensData(serverId, period),
    enabled: !!serverId,
  });
};

export const useSuppressions = (
  serverId: string,
  page: number = 1,
  perPage: number = 15,
  search: string = "",
  domain: string = "",
) => {
  return useQuery({
    queryKey: queryKeys.suppressions.list(serverId, page, perPage, search, domain),
    queryFn: () => apiClient.getSuppressions(serverId, page, perPage, search, domain),
    enabled: !!serverId,
    placeholderData: (previousData) => previousData,
  });
};

export const useDeleteSuppressions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ serverId, payload }: { serverId: string; payload: Parameters<typeof apiClient.deleteSuppressions>[1] }) =>
      apiClient.deleteSuppressions(serverId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.suppressions.all(variables.serverId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.servers.statsAll(variables.serverId) });
    },
  });
};

export const useTestConnection = () => {
  return useMutation({
    mutationFn: serverManagement.testConnection,
  });
};

export { ApiError };
