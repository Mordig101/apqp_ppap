import { API_ENDPOINTS } from "./api"

interface RequestOptions {
  method: "GET" | "POST" | "PUT" | "DELETE"
  headers?: HeadersInit
  body?: BodyInit | null
}

const getAuthToken = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("auth_token")
  }
  return null
}
\
const apiRequest = async <T>(endpoint: string, options: RequestOptions)
: Promise<T> =>
{
  const token = getAuthToken()

  const defaultHeaders: HeadersInit = {
    "Content-Type": "application/json",
  }

  if (token) {
    defaultHeaders["Authorization"] = `Bearer ${token}`
  }

  const headers = { ...defaultHeaders, ...options.headers }

  try {
    const response = await fetch(endpoint, {
      method: options.method,
      headers,
      body: options.body,
      credentials: "include", // Include cookies for session-based auth
    })

    if (!response.ok) {
      // Handle 401 Unauthorized - redirect to login
      if (response.status === 401) {
        if (typeof window !== "undefined") {
          window.location.href = "/login"
        }
      }

      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `API request failed with status ${response.status}`)
    }

    // For 204 No Content responses
    if (response.status === 204) {
      return {} as T;
    }

    return await response.json() as T;
  } catch (error) {
    console.error("API request error:", error)
    throw error
  }
}

export const api = {
  get: async <T>(endpoint: string): Promise<T> => 
    apiRequest<T>(endpoint, { method: 'GET' }),
  
  post: async <T>(endpoint: string, data: any): Promise<T> => 
    apiRequest<T>(endpoint, { method: 'POST', body: JSON.stringify(data) }
),
  
  put: async <T>(endpoint: string, data: any): Promise<T> => 
    apiRequest<T>(endpoint,
{
  method: "PUT", body
  : JSON.stringify(data)
}
),
  
  delete: async <T>(endpoint: string): Promise<T> => 
    apiRequest<T>(endpoint,
{
  method: "DELETE"
}
),
}

// Auth specific API functions
export const authApi = {
  login: async (username: string, password: string) => {
    const response = await api.post(API_ENDPOINTS.authLogin, { username, password })
    if (response && response.token) {
      localStorage.setItem("auth_token", response.token)
    }
    return response
  },

  logout: async () => {
    const response = await api.post(API_ENDPOINTS.authLogout, {})
    localStorage.removeItem("auth_token")
    return response
  },

  getCurrentUser: async () => {
    return await api.get(API_ENDPOINTS.authUser)
  },

  getUserPermissions: async () => {
    return await api.get(API_ENDPOINTS.userPermissions)
  },
}

// Project specific API functions
export const projectApi = {
  getAllProjects: async () => {
    return await api.get(API_ENDPOINTS.projects)
  },

  getProject: async (id: number) => {
    return await api.get(`${API_ENDPOINTS.projects}${id}/`)
  },

  createProject: async (data: any) => {
    return await api.post(API_ENDPOINTS.projects, data)
  },

  updateProject: async (id: number, data: any) => {
    return await api.put(`${API_ENDPOINTS.projects}${id}/`, data)
  },

  deleteProject: async (id: number) => {
    return await api.delete(`${API_ENDPOINTS.projects}${id}/`)
  },

  getProjectHistory: async (id: number) => {
    return await api.get(`${API_ENDPOINTS.projects}${id}/history/`)
  },
}

// Phase specific API functions
export const phaseApi = {
  getAllPhases: async () => {
    return await api.get(API_ENDPOINTS.phases)
  },

  getPhase: async (id: number) => {
    return await api.get(`${API_ENDPOINTS.phases}${id}/`)
  },

  updatePhase: async (id: number, data: any) => {
    return await api.put(`${API_ENDPOINTS.phases}${id}/`, data)
  },

  assignResponsible: async (phaseId: number, responsibleId: number) => {
    return await api.post(API_ENDPOINTS.assignPhaseResponsible, {
      phase_id: phaseId,
      responsible_id: responsibleId,
    })
  },
}

// Output specific API functions
export const outputApi = {
  getAllOutputs: async () => {
    return await api.get(API_ENDPOINTS.outputs)
  },

  getOutput: async (id: number) => {
    return await api.get(`${API_ENDPOINTS.outputs}${id}/`)
  },

  updateOutput: async (id: number, data: any) => {
    return await api.put(`${API_ENDPOINTS.outputs}${id}/`, data)
  },

  assignPermission: async (userId: number, outputId: number, permissionType: "r" | "e") => {
    return await api.post(API_ENDPOINTS.assignPermission, {
      user_id: userId,
      output_id: outputId,
      permission_type: permissionType,
    })
  },
}

// Status change API function
export const changeStatus = async (
  entityType: "project" | "ppap" | "phase" | "output",
  entityId: number,
  status: string,
) => {
  return await api.post(API_ENDPOINTS.changeStatus, {
    entity_type: entityType,
    entity_id: entityId,
    status: status,
  })
}

// Dashboard API function
export const getDashboard = async (level?: number) => {
  const endpoint = level ? `${API_ENDPOINTS.dashboard}?level=${level}` : API_ENDPOINTS.dashboard
  return await api.get(endpoint)
}
