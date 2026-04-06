import axios, { AxiosInstance, AxiosResponse } from 'axios';

/* =========================
   TYPES
========================= */

export interface WorkQuery {
  _id: string;
  queryId: string;
  title: string;
  description: string;
  type: 'service' | 'task';
  serviceId?: string;
  serviceTitle?: string;
  serviceType?: string;
  serviceStaffId?: string;
  serviceStaffName?: string;
  employeeId?: string;
  employeeName?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in-progress' | 'resolved' | 'rejected';
  category: string;
  reportedBy: {
    userId: string;
    name: string;
    role: string;
  };
  assignedTo?: {
    userId: string;
    name: string;
    role: string;
  };
  supervisorId: string;
  supervisorName: string;
  superadminResponse?: string;
  responseDate?: string;
  comments: Array<{
    userId: string;
    name: string;
    comment: string;
    timestamp: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  _id: string;
  serviceId: string;
  type: string;
  title: string;
  description: string;
  location: string;
  assignedTo: string;
  assignedToName: string;
  status: string;
  schedule: string;
  supervisorId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  value: string;
  label: string;
  description: string;
}

export interface Priority {
  value: string;
  label: string;
  description: string;
  color: string;
}

export interface Status {
  value: string;
  label: string;
  description: string;
  color: string;
}

export interface ServiceType {
  value: string;
  label: string;
  icon: string;
  color: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Statistics {
  total: number;
  statusCounts: {
    pending: number;
    'in-progress': number;
    resolved: number;
    rejected: number;
  };
  serviceTypeCounts: {
    cleaning: number;
    'waste-management': number;
    'parking-management': number;
    security: number;
    maintenance: number;
  };
  priorityCounts: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: Pagination;
}

/* =========================
   AXIOS SETUP
========================= */
const API_URL = `https://${window.location.hostname}:5001/api`;

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token') || localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  console.log('🌐 API Request:', {
    method: config.method,
    url: config.url,
    data: config.data,
    headers: config.headers
  });

  return config;
});

api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', {
      status: response.status,
      url: response.config.url,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('❌ API Error:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.response?.data?.message || error.message,
      data: error.response?.data
    });
    
    if (error.response) {
      return Promise.reject({
        status: error.response.status,
        message: error.response.data?.message || 'API Error',
        data: error.response.data
      });
    }
    return Promise.reject({
      status: 0,
      message: 'Network error. Please check your connection.'
    });
  }
);

/* =========================
   API METHODS
========================= */

export const workQueryApi = {
  /* GET all work queries */
  getAllWorkQueries: async (params: {
    supervisorId?: string;
    search?: string;
    status?: string;
    priority?: string;
    serviceType?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<ApiResponse<WorkQuery[]>> => {
    const response: AxiosResponse<ApiResponse<WorkQuery[]>> =
      await api.get('/work-queries', { params });
    return response.data;
  },

  /* CREATE work query - Simple JSON payload without files */
  createWorkQuery: async (
    workQueryData: {
      title: string;
      description: string;
      serviceId: string;
      priority: 'low' | 'medium' | 'high' | 'critical';
      category: string;
      supervisorId: string;
      supervisorName: string;
      serviceTitle?: string;
      serviceType?: string;
    }
  ): Promise<ApiResponse<WorkQuery>> => {
    const response = await api.post('/work-queries', workQueryData);
    return response.data;
  },

  /* GET work query by ID */
  getWorkQueryById: async (id: string): Promise<ApiResponse<WorkQuery>> => {
    const response = await api.get(`/work-queries/${id}`);
    return response.data;
  },

  /* GET work query by queryId */
  getWorkQueryByQueryId: async (queryId: string): Promise<ApiResponse<WorkQuery>> => {
    const response = await api.get(`/work-queries/query/${queryId}`);
    return response.data;
  },

  /* UPDATE work query status */
  updateWorkQueryStatus: async (
    queryId: string,
    status: WorkQuery['status'],
    superadminResponse?: string
  ): Promise<ApiResponse<WorkQuery>> => {
    const response = await api.patch(
      `/work-queries/${queryId}/status`,
      { status, superadminResponse }
    );
    return response.data;
  },

  /* ADD comment to work query */
  addComment: async (
    queryId: string,
    userId: string,
    name: string,
    comment: string
  ): Promise<ApiResponse<WorkQuery>> => {
    const response = await api.post(
      `/work-queries/${queryId}/comments`,
      { userId, name, comment }
    );
    return response.data;
  },

  /* ASSIGN work query */
  assignQuery: async (
    queryId: string,
    userId: string,
    name: string,
    role?: string
  ): Promise<ApiResponse<WorkQuery>> => {
    const response = await api.patch(
      `/work-queries/${queryId}/assign`,
      { userId, name, role }
    );
    return response.data;
  },

  /* GET statistics */
  getStatistics: async (
    supervisorId: string
  ): Promise<ApiResponse<Statistics>> => {
    const response = await api.get('/work-queries/statistics', {
      params: { supervisorId }
    });
    return response.data;
  },

  /* GET categories */
  getCategories: async (): Promise<ApiResponse<Category[]>> => {
    const response = await api.get('/work-queries/categories');
    return response.data;
  },

  /* GET priorities */
  getPriorities: async (): Promise<ApiResponse<Priority[]>> => {
    const response = await api.get('/work-queries/priorities');
    return response.data;
  },

  /* GET statuses */
  getStatuses: async (): Promise<ApiResponse<Status[]>> => {
    const response = await api.get('/work-queries/statuses');
    return response.data;
  },

  /* GET service types */
  getServiceTypes: async (): Promise<ApiResponse<ServiceType[]>> => {
    const response = await api.get('/work-queries/service-types');
    return response.data;
  },

  /* GET services for supervisor */
  getServicesForSupervisor: async (
    supervisorId: string
  ): Promise<ApiResponse<Service[]>> => {
    const response = await api.get(`/work-queries/supervisor/${supervisorId}/services`);
    return response.data;
  },

  /* GET recent work queries */
  getRecentWorkQueries: async (
    supervisorId: string,
    limit: number = 5
  ): Promise<ApiResponse<WorkQuery[]>> => {
    const response = await api.get('/work-queries/recent', {
      params: { supervisorId, limit }
    });
    return response.data;
  },

  /* DELETE work query */
  deleteWorkQuery: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.delete(`/work-queries/${id}`);
    return response.data;
  }
};

/* =========================
   ERROR HELPER
========================= */

export const handleApiError = (error: any): string => {
  if (error?.message) return error.message;
  if (error?.response?.data?.message) return error.response.data.message;
  return 'Something went wrong. Please try again.';
};

export default api;