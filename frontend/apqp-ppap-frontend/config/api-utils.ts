import { API_ENDPOINTS } from "./api"
import type { ApiError } from "./api-types"
import type { PaginatedResponse, Project, Client, Team } from "./api-types"

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
      const data = await api.get<PaginatedResponse<Project>>(API_ENDPOINTS.projects)
      return data.results || []
    } catch (error: any) {
      console.error("Get all projects error:", error)
      throw new Error(error.message || "Failed to get all projects")
    }
  },

  getProjectsPage: async (url: string) => {
    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch projects: ${response.statusText}`)
      }

      return await response.json() as PaginatedResponse<Project>
    } catch (error: any) {
      console.error("Get projects page error:", error)
      throw new Error(error.message || "Failed to get projects page")
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

  getAllOutputTemplates: async () => {
    try {
      // First, get all phase templates
      const phaseTemplatesResponse = await api.get(API_ENDPOINTS.phaseTemplates);
      
      // Extract all output templates from all phases
      if (Array.isArray(phaseTemplatesResponse.results)) {
        const outputTemplates: OutputTemplate[] = [];
        
        // Loop through each phase template
        phaseTemplatesResponse.results.forEach(phase => {
          // If phase has output templates, add them to our array
          if (Array.isArray(phase.output_templates)) {
            phase.output_templates.forEach(template => {
              // Add phase information to make it easier to identify the phase
              outputTemplates.push({
                ...template,
                phase_name: phase.name  // Add a reference to the phase name
              });
            });
          }
        });
        
        return outputTemplates;
      }
      
      return [];
    } catch (error: any) {
      console.error("Get all output templates error:", error);
      throw new Error(error.message || "Failed to get all output templates");
    }
  },
}

// Document API functions
export const documentApi = {
  getAllDocuments: async () => {
    try {
      const response = await api.get(API_ENDPOINTS.documents)
      return response.results || []
    } catch (error: any) {
      console.error("Get all documents error:", error)
      throw new Error(error.message || "Failed to get all documents")
    }
  },
  
  getDocumentsByOutput: async (outputId: number) => {
    try {
      const response = await api.get(`${API_ENDPOINTS.documents}?output=${outputId}`)
      return response.results || []
    } catch (error: any) {
      console.error(`Get documents for output ${outputId} error:`, error)
      throw new Error(error.message || `Failed to get documents for output ${outputId}`)
    }
  },
  
  getDocument: async (id: number) => {
    try {
      return await api.get(`${API_ENDPOINTS.documents}${id}/`)
    } catch (error: any) {
      console.error(`Get document ${id} error:`, error)
      throw new Error(error.message || `Failed to get document ${id}`)
    }
  },
  
  uploadDocument: async (formData: FormData) => {
    try {
      const token = getAuthToken()
      
      const response = await fetch(API_ENDPOINTS.documents, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: formData,
        credentials: 'include',
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Upload failed with status ${response.status}`)
      }
      
      return await response.json()
    } catch (error: any) {
      console.error("Upload document error:", error)
      throw new Error(error.message || "Failed to upload document")
    }
  },
  
  updateDocument: async (id: number, data: any) => {
    try {
      return await api.put(`${API_ENDPOINTS.documents}${id}/`, data)
    } catch (error: any) {
      console.error(`Update document ${id} error:`, error)
      throw new Error(error.message || `Failed to update document ${id}`)
    }
  },
  
  deleteDocument: async (id: number) => {
    try {
      return await api.delete(`${API_ENDPOINTS.documents}${id}/`)
    } catch (error: any) {
      console.error(`Delete document ${id} error:`, error)
      throw new Error(error.message || `Failed to delete document ${id}`)
    }
  }
}

// Add this to your existing api-utils.ts file

// File upload with progress tracking
export const uploadDocument = async (
  file: File, 
  outputId: string,
  uploaderId: string | undefined,
  onProgress?: (percent: number) => void
): Promise<DocumentData> => {
  return new Promise((resolve, reject) => {
    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', file.name);
    formData.append('output_id', outputId);
    
    // Add uploader if available
    if (uploaderId) {
      formData.append('uploader', uploaderId);
    }
    
    // Get file type and determine MIME type
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    formData.append('file_type', fileExtension || '');
    
    // Create xhr request
    const xhr = new XMLHttpRequest();
    xhr.open('POST', API_ENDPOINTS.documents);
    
    // Get latest token
    const token = localStorage.getItem('auth_token');
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }
    
    // Handle CSRF if necessary
    const csrfToken = getCsrfToken(); // Implement this function
    if (csrfToken) {
      xhr.setRequestHeader('X-CSRFToken', csrfToken);
    }
    
    // Handle progress
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const percentComplete = Math.round((event.loaded / event.total) * 100);
        onProgress(percentComplete);
      }
    };
    
    // Handle response
    xhr.onload = function() {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch (e) {
          reject(new Error("Invalid response format"));
        }
      } else {
        let errorMsg;
        try {
          const errorResponse = JSON.parse(xhr.responseText);
          errorMsg = errorResponse.error || errorResponse.detail || `Upload failed with status ${xhr.status}`;
          
          // Special handling for auth errors
          if (xhr.status === 401 || xhr.status === 403) {
            // Trigger token refresh or redirect to login
            handleAuthError();
          }
        } catch(e) {
          errorMsg = `Upload failed with status ${xhr.status}`;
        }
        reject(new Error(errorMsg));
      }
    };
    
    xhr.onerror = function() {
      reject(new Error("Network error occurred during upload"));
    };
    
    // Send the request
    xhr.send(formData);
  });
};

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
      const data = await api.get<PaginatedResponse<Client>>(API_ENDPOINTS.clients)
      return data.results || []
    } catch (error: any) {
      console.error("Get all clients error:", error)
      throw new Error(error.message || "Failed to get all clients")
    }
  },

  getClientsPage: async (url: string) => {
    try {
      const data = await fetch(url, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
        credentials: "include",
      })

      if (!data.ok) {
        throw new Error(`Failed to fetch clients: ${data.statusText}`)
      }

      return (await data.json()) as PaginatedResponse<Client>
    } catch (error: any) {
      console.error("Get clients page error:", error)
      throw new Error(error.message || "Failed to get clients page")
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
      const response = await api.get(API_ENDPOINTS.phaseTemplates)
      // Return the results array from the paginated response
      return response.results || []
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
      // First, get all phase templates
      const phaseTemplatesResponse = await api.get(API_ENDPOINTS.phaseTemplates);
      
      // Extract all output templates from all phases
      if (Array.isArray(phaseTemplatesResponse.results)) {
        const outputTemplates: OutputTemplate[] = [];
        
        // Loop through each phase template
        phaseTemplatesResponse.results.forEach(phase => {
          // If phase has output templates, add them to our array
          if (Array.isArray(phase.output_templates)) {
            phase.output_templates.forEach(template => {
              // Add phase information to make it easier to identify the phase
              outputTemplates.push({
                ...template,
                phase_name: phase.name  // Add a reference to the phase name
              });
            });
          }
        });
        
        return outputTemplates;
      }
      
      return [];
    } catch (error: any) {
      console.error("Get all output templates error:", error);
      throw new Error(error.message || "Failed to get all output templates");
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
      const response = await api.get(API_ENDPOINTS.ppapElements)
      // Return the results array from the paginated response
      return response.results || []
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

// Team management API functions
export const teamApi = {
  getAllTeams: async () => {
    try {
      const data = await api.get<PaginatedResponse<Team>>(API_ENDPOINTS.teams)
      return data.results || []
    } catch (error: any) {
      console.error("Get all teams error:", error)
      throw new Error(error.message || "Failed to get all teams")
    }
  },

  getTeamsPage: async (url: string) => {
    try {
      const data = await fetch(url, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
        credentials: "include",
      })

      if (!data.ok) {
        throw new Error(`Failed to fetch teams: ${data.statusText}`)
      }

      return (await data.json()) as PaginatedResponse<Team>
    } catch (error: any) {
      console.error("Get teams page error:", error)
      throw new Error(error.message || "Failed to get teams page")
    }
  },

  getTeam: async (id: number) => {
    try {
      return await api.get(`${API_ENDPOINTS.teams}${id}/`)
    } catch (error: any) {
      console.error(`Get team ${id} error:`, error)
      throw new Error(error.message || `Failed to get team ${id}`)
    }
  },
  
  createTeam: async (data: any) => {
    try {
      return await api.post(API_ENDPOINTS.teams, data)
    } catch (error: any) {
      console.error("Create team error:", error)
      throw new Error(error.message || "Failed to create team")
    }
  },
  
  updateTeam: async (id: number, data: any) => {
    try {
      return await api.put(`${API_ENDPOINTS.teams}${id}/`, data)
    } catch (error: any) {
      console.error(`Update team ${id} error:`, error)
      throw new Error(error.message || `Failed to update team ${id}`)
    }
  },
  
  deleteTeam: async (id: number) => {
    try {
      return await api.delete(`${API_ENDPOINTS.teams}${id}/`)
    } catch (error: any) {
      console.error(`Delete team ${id} error:`, error)
      throw new Error(error.message || `Failed to delete team ${id}`)
    }
  },
  
  // Add or remove members from a team
  updateTeamMembers: async (teamId: number, memberIds: number[]) => {
    try {
      const data = await api.put(`${API_ENDPOINTS.teams}${teamId}/`, { 
        member_ids: memberIds 
      })
      return data
    } catch (error: any) {
      console.error(`Update team ${teamId} members error:`, error)
      throw new Error(error.message || `Failed to update team ${teamId} members`)
    }
  }
}
