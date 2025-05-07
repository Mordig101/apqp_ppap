import { API_ENDPOINTS } from "./api"
import type { ApiError } from "./api-types"

// Base API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

// Get CSRF token from cookies
function getCSRFToken(): string | null {
  if (typeof document === "undefined") return null

  const cookies = document.cookie.split(";")
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split("=")
    if (name === "csrftoken") {
      return value
    }
  }
  return null
}

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

// Generic fetch function with error handling
export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_URL}${endpoint}`

  // Add CSRF token for non-GET requests
  if (options.method && options.method !== "GET") {
    const csrfToken = getCSRFToken()
    if (csrfToken) {
      options.headers = {
        ...options.headers,
        "X-CSRFToken": csrfToken,
      }
    }
  }

  // Add credentials to include cookies
  options.credentials = "include"

  try {
    const response = await fetch(url, options)

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T
    }

    // Parse response
    const data = await response.json()

    // Handle error responses
    if (!response.ok) {
      const errorMessage = data.error || "An unknown error occurred"
      throw new Error(errorMessage)
    }

    return data as T
  } catch (error) {
    console.error("API request failed:", error)
    throw error
  }
}

// POST request with JSON body
export async function postJson<T>(endpoint: string, body: any): Promise<T> {
  return fetchApi<T>(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })
}

// PUT request with JSON body
export async function putJson<T>(endpoint: string, body: any): Promise<T> {
  return fetchApi<T>(endpoint, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })
}

// DELETE request
export async function deleteRequest<T>(endpoint: string): Promise<T> {
  return fetchApi<T>(endpoint, {
    method: "DELETE",
  })
}

// Helper to check if response is an error
export function isApiError(data: any): data is ApiError {
  return data && typeof data === "object" && "error" in data
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

// Add specific API functions for managing users, clients, templates, and history

// User management API functions
export const userApi = {
  getAllUsers: async () => {
    try {
      const data = await api.get(API_ENDPOINTS.users)
      return data
    } catch (error: any) {
      console.error("Get all users error:", error)
      throw new Error(error.message || "Failed to get all users")
    }
  },

  getUser: async (id: number) => {
    try {
      return await api.get(`${API_ENDPOINTS.users}${id}/`)
    } catch (error: any) {
      console.error("Get user error:", error)
      throw new Error(error.message || "Failed to get user")
    }
  },

  createUser: async (data: any) => {
    try {
      return await api.post(API_ENDPOINTS.users, data)
    } catch (error: any) {
      console.error("Create user error:", error)
      throw new Error(error.message || "Failed to create user")
    }
  },

  updateUser: async (id: number, data: any) => {
    try {
      return await api.put(`${API_ENDPOINTS.users}${id}/`, data)
    } catch (error: any) {
      console.error("Update user error:", error)
      throw new Error(error.message || "Failed to update user")
    }
  },

  deleteUser: async (id: number) => {
    try {
      return await api.delete(`${API_ENDPOINTS.users}${id}/`)
    } catch (error: any) {
      console.error("Delete user error:", error)
      throw new Error(error.message || "Failed to delete user")
    }
  },
}

// Client management API functions
export const clientApi = {
  getAllClients: async () => {
    try {
      return await api.get(API_ENDPOINTS.clients)
    } catch (error: any) {
      console.error("Get all clients error:", error)
      throw new Error(error.message || "Failed to get all clients")
    }
  },

  getClient: async (id: number) => {
    try {
      return await api.get(`${API_ENDPOINTS.clients}${id}/`)
    } catch (error: any) {
      console.error("Get client error:", error)
      throw new Error(error.message || "Failed to get client")
    }
  },

  createClient: async (data: any) => {
    try {
      return await api.post(API_ENDPOINTS.clients, data)
    } catch (error: any) {
      console.error("Create client error:", error)
      throw new Error(error.message || "Failed to create client")
    }
  },

  updateClient: async (id: number, data: any) => {
    try {
      return await api.put(`${API_ENDPOINTS.clients}${id}/`, data)
    } catch (error: any) {
      console.error("Update client error:", error)
      throw new Error(error.message || "Failed to update client")
    }
  },

  deleteClient: async (id: number) => {
    try {
      return await api.delete(`${API_ENDPOINTS.clients}${id}/`)
    } catch (error: any) {
      console.error("Delete client error:", error)
      throw new Error(error.message || "Failed to delete client")
    }
  },
}

// Template management API functions
export const templateApi = {
  // Phase templates
  getAllPhaseTemplates: async () => {
    try {
      return await api.get(API_ENDPOINTS.phaseTemplates)
    } catch (error: any) {
      console.error("Get all phase templates error:", error)
      throw new Error(error.message || "Failed to get all phase templates")
    }
  },

  getPhaseTemplate: async (id: number) => {
    try {
      return await api.get(`${API_ENDPOINTS.phaseTemplates}${id}/`)
    } catch (error: any) {
      console.error("Get phase template error:", error)
      throw new Error(error.message || "Failed to get phase template")
    }
  },

  createPhaseTemplate: async (data: any) => {
    try {
      return await api.post(API_ENDPOINTS.phaseTemplates, data)
    } catch (error: any) {
      console.error("Create phase template error:", error)
      throw new Error(error.message || "Failed to create phase template")
    }
  },

  updatePhaseTemplate: async (id: number, data: any) => {
    try {
      return await api.put(`${API_ENDPOINTS.phaseTemplates}${id}/`, data)
    } catch (error: any) {
      console.error("Update phase template error:", error)
      throw new Error(error.message || "Failed to update phase template")
    }
  },

  deletePhaseTemplate: async (id: number) => {
    try {
      return await api.delete(`${API_ENDPOINTS.phaseTemplates}${id}/`)
    } catch (error: any) {
      console.error("Delete phase template error:", error)
      throw new Error(error.message || "Failed to delete phase template")
    }
  },

  // Output templates
  getAllOutputTemplates: async () => {
    try {
      return await api.get(API_ENDPOINTS.outputTemplates)
    } catch (error: any) {
      console.error("Get all output templates error:", error)
      throw new Error(error.message || "Failed to get all output templates")
    }
  },

  getOutputTemplate: async (id: number) => {
    try {
      return await api.get(`${API_ENDPOINTS.outputTemplates}${id}/`)
    } catch (error: any) {
      console.error("Get output template error:", error)
      throw new Error(error.message || "Failed to get output template")
    }
  },

  createOutputTemplate: async (data: any) => {
    try {
      return await api.post(API_ENDPOINTS.outputTemplates, data)
    } catch (error: any) {
      console.error("Create output template error:", error)
      throw new Error(error.message || "Failed to create output template")
    }
  },

  updateOutputTemplate: async (id: number, data: any) => {
    try {
      return await api.put(`${API_ENDPOINTS.outputTemplates}${id}/`, data)
    } catch (error: any) {
      console.error("Update output template error:", error)
      throw new Error(error.message || "Failed to update output template")
    }
  },

  deleteOutputTemplate: async (id: number) => {
    try {
      return await api.delete(`${API_ENDPOINTS.outputTemplates}${id}/`)
    } catch (error: any) {
      console.error("Delete output template error:", error)
      throw new Error(error.message || "Failed to delete output template")
    }
  },

  // PPAP elements
  getAllPPAPElements: async () => {
    try {
      return await api.get(API_ENDPOINTS.ppapElements)
    } catch (error: any) {
      console.error("Get all PPAP elements error:", error)
      throw new Error(error.message || "Failed to get all PPAP elements")
    }
  },

  getPPAPElement: async (id: number) => {
    try {
      return await api.get(`${API_ENDPOINTS.ppapElements}${id}/`)
    } catch (error: any) {
      console.error("Get PPAP element error:", error)
      throw new Error(error.message || "Failed to get PPAP element")
    }
  },

  createPPAPElement: async (data: any) => {
    try {
      return await api.post(API_ENDPOINTS.ppapElements, data)
    } catch (error: any) {
      console.error("Create PPAP element error:", error)
      throw new Error(error.message || "Failed to create PPAP element")
    }
  },

  updatePPAPElement: async (id: number, data: any) => {
    try {
      return await api.put(`${API_ENDPOINTS.ppapElements}${id}/`, data)
    } catch (error: any) {
      console.error("Update PPAP element error:", error)
      throw new Error(error.message || "Failed to update PPAP element")
    }
  },

  deletePPAPElement: async (id: number) => {
    try {
      return await api.delete(`${API_ENDPOINTS.ppapElements}${id}/`)
    } catch (error: any) {
      console.error("Delete PPAP element error:", error)
      throw new Error(error.message || "Failed to delete PPAP element")
    }
  },
}

// History API functions
export const historyApi = {
  getAllHistory: async () => {
    try {
      return await api.get(API_ENDPOINTS.history)
    } catch (error: any) {
      console.error("Get all history error:", error)
      throw new Error(error.message || "Failed to get all history")
    }
  },

  getHistoryById: async (id: string) => {
    try {
      return await api.get(`${API_ENDPOINTS.history}${id}/`)
    } catch (error: any) {
      console.error("Get history error:", error)
      throw new Error(error.message || "Failed to get history")
    }
  },

  getHistoryByEntity: async (entityType: string, entityId: number) => {
    try {
      return await api.get(`${API_URL}/${entityType}s/${entityId}/history/`)
    } catch (error: any) {
      console.error(`Get ${entityType} history error:`, error)
      throw new Error(error.message || `Failed to get ${entityType} history`)
    }
  },
}
