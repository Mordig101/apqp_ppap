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

const getCsrfToken = (): string | null => {
  if (typeof document !== "undefined") {
    // Get CSRF token from cookie
    const cookies = document.cookie.split(";")
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split("=")
      if (name === "csrftoken") {
        return value
      }
    }
  }
  return null
}

const apiRequest = async <T>(endpoint: string, options: RequestOptions)
: Promise<T> =>
{
  const token = getAuthToken()
  const csrfToken = getCsrfToken()

  const defaultHeaders: HeadersInit = {
    "Content-Type": "application/json",
  }

  if (token) {
    defaultHeaders["Authorization"] = `Bearer ${token}`
  }

  // Add CSRF token for non-GET requests if available
  if (csrfToken && options.method !== "GET") {
    defaultHeaders["X-CSRFToken"] = csrfToken
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
      return {} as T
    }

    return await response.json() as T
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
    try {
      const response = await api.post(API_ENDPOINTS.authLogin, { username, password })
      if (response && response.token) {
        localStorage.setItem("auth_token", response.token)
        return response
      } else {
        throw new Error("Login failed: Token not received")
      }
    } catch (error: any) {
      console.error("Login error:", error)
      throw new Error(error.message || "Login failed")
    }
  },

  logout: async () => {
    try {
      const response = await api.post(API_ENDPOINTS.authLogout, {})
      localStorage.removeItem("auth_token")
      return response
    } catch (error: any) {
      console.error("Logout error:", error)
      throw new Error(error.message || "Logout failed")
    }
  },

  getCurrentUser: async () => {
    try {
      return await api.get(API_ENDPOINTS.authUser)
    } catch (error: any) {
      console.error("Get current user error:", error)
      throw new Error(error.message || "Failed to get current user")
    }
  },

  getUserPermissions: async () => {
    try {
      return await api.get(API_ENDPOINTS.userPermissions)
    } catch (error: any) {
      console.error("Get user permissions error:", error)
      throw new Error(error.message || "Failed to get user permissions")
    }
  },
}

// Project specific API functions
export const projectApi = {
  getAllProjects: async () => {
    try {
      return await api.get(API_ENDPOINTS.projects)
    } catch (error: any) {
      console.error("Get all projects error:", error)
      throw new Error(error.message || "Failed to get all projects")
    }
  },

  getProject: async (id: number) => {
    try {
      return await api.get(`${API_ENDPOINTS.projects}${id}/`)
    } catch (error: any) {
      console.error("Get project error:", error)
      throw new Error(error.message || "Failed to get project")
    }
  },

  createProject: async (data: any) => {
    try {
      return await api.post(API_ENDPOINTS.projects, data)
    } catch (error: any) {
      console.error("Create project error:", error)
      throw new Error(error.message || "Failed to create project")
    }
  },

  updateProject: async (id: number, data: any) => {
    try {
      return await api.put(`${API_ENDPOINTS.projects}${id}/`, data)
    } catch (error: any) {
      console.error("Update project error:", error)
      throw new Error(error.message || "Failed to update project")
    }
  },

  deleteProject: async (id: number) => {
    try {
      return await api.delete(`${API_ENDPOINTS.projects}${id}/`)
    } catch (error: any) {
      console.error("Delete project error:", error)
      throw new Error(error.message || "Failed to delete project")
    }
  },

  getProjectHistory: async (id: number) => {
    try {
      return await api.get(`${API_ENDPOINTS.projects}${id}/history/`)
    } catch (error: any) {
      console.error("Get project history error:", error)
      throw new Error(error.message || "Failed to get project history")
    }
  },
}

// Phase specific API functions
export const phaseApi = {
  getAllPhases: async () => {
    try {
      return await api.get(API_ENDPOINTS.phases)
    } catch (error: any) {
      console.error("Get all phases error:", error)
      throw new Error(error.message || "Failed to get all phases")
    }
  },

  getPhase: async (id: number) => {
    try {
      return await api.get(`${API_ENDPOINTS.phases}${id}/`)
    } catch (error: any) {
      console.error("Get phase error:", error)
      throw new Error(error.message || "Failed to get phase")
    }
  },

  updatePhase: async (id: number, data: any) => {
    try {
      return await api.put(`${API_ENDPOINTS.phases}${id}/`, data)
    } catch (error: any) {
      console.error("Update phase error:", error)
      throw new Error(error.message || "Failed to update phase")
    }
  },

  assignResponsible: async (phaseId: number, responsibleId: number) => {
    try {
      return await api.post(API_ENDPOINTS.assignPhaseResponsible, {
        phase_id: phaseId,
        responsible_id: responsibleId,
      })
    } catch (error: any) {
      console.error("Assign responsible error:", error)
      throw new Error(error.message || "Failed to assign responsible")
    }
  },
}

// Output specific API functions
export const outputApi = {
  getAllOutputs: async () => {
    try {
      return await api.get(API_ENDPOINTS.outputs)
    } catch (error: any) {
      console.error("Get all outputs error:", error)
      throw new Error(error.message || "Failed to get all outputs")
    }
  },

  getOutput: async (id: number) => {
    try {
      return await api.get(`${API_ENDPOINTS.outputs}${id}/`)
    } catch (error: any) {
      console.error("Get output error:", error)
      throw new Error(error.message || "Failed to get output")
    }
  },

  updateOutput: async (id: number, data: any) => {
    try {
      return await api.put(`${API_ENDPOINTS.outputs}${id}/`, data)
    } catch (error: any) {
      console.error("Update output error:", error)
      throw new Error(error.message || "Failed to update output")
    }
  },

  assignPermission: async (userId: number, outputId: number, permissionType: "r" | "e") => {
    try {
      return await api.post(API_ENDPOINTS.assignPermission, {
        user_id: userId,
        output_id: outputId,
        permission_type: permissionType,
      })
    } catch (error: any) {
      console.error("Assign permission error:", error)
      throw new Error(error.message || "Failed to assign permission")
    }
  },
}

// Status change API function
export const changeStatus = async (
  entityType: "project" | "ppap" | "phase" | "output",
  entityId: number,
  status: string,
) => {
  try {
    return await api.post(API_ENDPOINTS.changeStatus, {
      entity_type: entityType,
      entity_id: entityId,
      status: status,
    })
  } catch (error: any) {
    console.error("Change status error:", error)
    throw new Error(error.message || "Failed to change status")
  }
}

// Dashboard API function
export const getDashboard = async (level?: number) => {
  try {
    const endpoint = level ? `${API_ENDPOINTS.dashboard}?level=${level}` : API_ENDPOINTS.dashboard
    return await api.get(endpoint)
  } catch (error: any) {
    console.error("Get dashboard error:", error)
    throw new Error(error.message || "Failed to get dashboard")
  }
}
