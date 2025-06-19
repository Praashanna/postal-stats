import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  ServerData, 
  ServerListItem, 
  BouncedEmailsData, 
  BouncedDomain, 
  BouncedEmail, 
  PaginatedResponse, 
  TimePeriod
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
  },
  bounces: {
    data: (serverId: string, period: TimePeriod) => ['bounces', serverId, period] as const,
    domains: (serverId: string, period: TimePeriod, page: number, limit: number, search?: string) => 
      ['bounces', serverId, period, 'domains', page, limit, search] as const,
    emails: (serverId: string, period: TimePeriod, page: number, limit: number, search?: string) => 
      ['bounces', serverId, period, 'emails', page, limit, search] as const,
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
      timeSeriesData: response.chartData.map(item => ({
        date: item.date,
        sent: item.sent,
        bounces: item.bounced,
        opens: item.opens
      })),
      server: {
        id: serverId,
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
};

const serverManagement = {
  createServer: async (serverData: {
    name: string;
    host: string;
    port: number;
    database: string;
    username: string;
    password?: string;
    is_active?: boolean;
  }) => {
    return apiRequest<{
      status: string;
      message: string;
      data: ServerListItem;
    }>('/servers', {
      method: 'POST',
      body: JSON.stringify(serverData),
    });
  },

  updateServer: async (id: string, serverData: Partial<{
    name: string;
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    is_active: boolean;
  }>) => {
    return apiRequest<{
      status: string;
      message: string;
      data: ServerListItem;
    }>(`/servers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(serverData),
    });
  },

  deleteServer: async (id: string) => {
    return apiRequest<{
      status: string;
      message: string;
      data: null;
    }>(`/servers/${id}`, {
      method: 'DELETE',
    });
  },

  toggleServerStatus: async (id: string) => {
    return apiRequest<{
      status: string;
      message: string;
      data: ServerListItem;
    }>(`/servers/${id}/toggle-status`, {
      method: 'PATCH',
    });
  },

  testConnection: async (id: string) => {
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

export const useCreateServer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: serverManagement.createServer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.servers.all() });
    },
  });
};

export const useUpdateServer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof serverManagement.updateServer>[1] }) =>
      serverManagement.updateServer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.servers.all() });
    },
  });
};

export const useDeleteServer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: serverManagement.deleteServer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.servers.all() });
    },
  });
};

export const useToggleServerStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: serverManagement.toggleServerStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.servers.all() });
    },
  });
};

export const useTestConnection = () => {
  return useMutation({
    mutationFn: serverManagement.testConnection,
  });
};

export { ApiError };
