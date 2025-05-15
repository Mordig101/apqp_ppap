import { HistoryEntry, NestedHistory } from "@/app/projects/[projectId]/history/types"
import { API_ENDPOINTS } from "./api"
import type { 
  User,
  ApiError, 
  PaginatedResponse, 
  Project, 
  Client, 
   
  OutputTemplate, 
  Phase, 
  PhaseTemplate, 
  Document, 
  Department, 
  DepartmentCreateRequest,
  DepartmentUpdateRequest, 
  History, 
  PhaseCreateRequest, 
  PhaseUpdateRequest, 
  PhaseHistoryUpdateRequest, 
  Output, 
  OutputCreateRequest, 
  OutputUpdateRequest, 
  OutputHistoryUpdateRequest,
  DocumentUpdateRequest,
  DocumentHistoryUpdateRequest,
  // Add PPAP related types
  PPAP,
  PPAPCreateRequest,
  PPAPUpdateRequest,
  PPAPDetails,
  PPAPElement,
  
  ProjectDetails,
  ProjectCreateRequest,
  ProjectUpdateRequest,
  ProjectHistoryUpdateRequest,

  Todo,
  TodoCreateRequest,
  TodoUpdateRequest,
  TodoHistoryUpdateRequest,
  TodoSummary,
  TodoBulkCreateRequest,

  OutputTemplateCreateRequest,
  OutputTemplateUpdateRequest,

  ClientCreateRequest,
  ClientUpdateRequest,

  Person,
  PersonCreateRequest,
  PersonUpdateRequest,

  Team,
  TeamCreateRequest,
  TeamUpdateRequest,
  
} from "./api-types"

// Define DocumentData interface
interface DocumentData extends Document {
  // Add any additional fields that might be in the API response
}

// Near the top of the file with other interfaces
interface AllProjectsHistoryResponse {
  total: number;
  page: number;
  page_size: number;
  pages: number;
  results: Record<string, {
    project_name: string;
    history: any;
  }>;
}

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

const apiRequest = async <T>(endpoint: string, options: RequestOptions): Promise<T> => {
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

// Add handleAuthError function
const handleAuthError = () => {
  // Redirect to login or refresh token
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
};

// Auth specific API functions
export const authApi = {
  login: async (username: string, password: string) => {
    try {
      const response = await api.post<{token: string}>(API_ENDPOINTS.authLogin, { username, password });
      if (response && response.token) {
        localStorage.setItem("auth_token", response.token);
        return response;
      } else {
        throw new Error("Login failed: Token not received");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      throw new Error(error.message || "Login failed");
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

  getCurrentUser: async (): Promise<User> => {  // Add proper return type
    try {
      return await api.get<User>(API_ENDPOINTS.authUser);
    } catch (error: any) {
      console.error("Get current user error:", error);
      throw new Error(error.message || "Failed to get current user");
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

  register: async (
    username: string, 
    email: string, 
    password: string, 
    firstName: string, 
    lastName: string, 
    phone?: string, 
    address?: string, 
    departmentId?: number
  ) => {
    try {
      // Prepare request data according to registration requirements
      const userData = {
        username,
        password,
        email,
        first_name: firstName,
        last_name: lastName,
        phone,
        address,
        department_id: departmentId,
        // No need to set is_active - the backend will set it to false for public registration
      };
      
      // Make API request - no authentication needed
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}/users/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Registration failed");
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error("Registration error:", error);
      
      // Handle specific error cases from your API
      if (error.message?.includes("username already exists")) {
        throw new Error("Username is already taken. Please choose another.");
      }
      
      throw new Error(error.message || "Registration failed");
    }
  }
}

// Project API functions
export const projectApi = {
  getAllProjects: async () => {
    try {
      const response = await api.get<PaginatedResponse<Project>>(API_ENDPOINTS.projects);
      return response.results || [];
    } catch (error: any) {
      console.error("Get all projects error:", error);
      throw new Error(error.message || "Failed to get all projects");
    }
  },

  getProjectsPage: async (url: string) => {
    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch projects: ${response.statusText}`);
      }

      return await response.json() as PaginatedResponse<Project>;
    } catch (error: any) {
      console.error("Get projects page error:", error);
      throw new Error(error.message || "Failed to get projects page");
    }
  },

  getProject: async (id: number) => {
    try {
      return await api.get<Project>(API_ENDPOINTS.project(id));
    } catch (error: any) {
      console.error(`Get project ${id} error:`, error);
      throw new Error(error.message || `Failed to get project ${id}`);
    }
  },
  
  getProjectDetails: async (id: number) => {
    try {
      return await api.get<ProjectDetails>(API_ENDPOINTS.projectDetails(id));
    } catch (error: any) {
      console.error(`Get project ${id} details error:`, error);
      throw new Error(error.message || `Failed to get project ${id} details`);
    }
  },

  createProject: async (data: ProjectCreateRequest) => {
    try {
      return await api.post<Project>(API_ENDPOINTS.projects, data);
    } catch (error: any) {
      console.error("Create project error:", error);
      throw new Error(error.message || "Failed to create project");
    }
  },

  updateProject: async (id: number, data: ProjectUpdateRequest) => {
    try {
      return await api.put<Project>(API_ENDPOINTS.project(id), data);
    } catch (error: any) {
      console.error(`Update project ${id} error:`, error);
      throw new Error(error.message || `Failed to update project ${id}`);
    }
  },

  updateProjectHistory: async (id: number, historyData: ProjectHistoryUpdateRequest) => {
    try {
      return await api.put<History>(API_ENDPOINTS.updateProjectHistory(id), historyData);
    } catch (error: any) {
      console.error(`Update project ${id} history error:`, error);
      throw new Error(error.message || `Failed to update project ${id} history`);
    }
  },

  archiveProject: async (id: number) => {
    try {
      return await api.post<Project>(API_ENDPOINTS.archiveProject(id), {});
    } catch (error: any) {
      console.error(`Archive project ${id} error:`, error);
      throw new Error(error.message || `Failed to archive project ${id}`);
    }
  },

  deleteProject: async (id: number) => {
    try {
      return await api.delete(API_ENDPOINTS.project(id));
    } catch (error: any) {
      console.error(`Delete project ${id} error:`, error);
      throw new Error(error.message || `Failed to delete project ${id}`);
    }
  },

  getProjectHistory: async (id: number) => {
    try {
      return await api.get<History[]>(API_ENDPOINTS.projectHistory(id));
    } catch (error: any) {
      console.error(`Get project ${id} history error:`, error);
      throw new Error(error.message || `Failed to get project ${id} history`);
    }
  }
};

// Phase specific API functions
export const phaseApi = {
  // Keep existing functions
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
      return await api.get<Phase>(`${API_ENDPOINTS.phases}${id}/`)
    } catch (error: any) {
      console.error("Get phase error:", error)
      throw new Error(error.message || "Failed to get phase")
    }
  },

  // Add new function for creating a phase with history attributes
  createPhase: async (data: PhaseCreateRequest) => {
    try {
      return await api.post<Phase>(API_ENDPOINTS.phases, data)
    } catch (error: any) {
      console.error("Create phase error:", error)
      throw new Error(error.message || "Failed to create phase")
    }
  },

  // Update the existing updatePhase function to handle history attributes
  updatePhase: async (id: number, data: PhaseUpdateRequest) => {
    try {
      return await api.put<Phase>(`${API_ENDPOINTS.phases}${id}/`, data)
    } catch (error: any) {
      console.error("Update phase error:", error)
      throw new Error(error.message || "Failed to update phase")
    }
  },

  // Add new function for updating only history attributes
  updatePhaseHistory: async (phaseId: number, historyData: PhaseHistoryUpdateRequest) => {
    try {
      const endpoint = API_ENDPOINTS.updatePhaseHistory.replace(':phaseId', phaseId.toString());
      return await api.put<History>(endpoint, historyData);
    } catch (error: any) {
      console.error("Update phase history error:", error);
      throw new Error(error.message || "Failed to update phase history");
    }
  },

  // Get phase history records
  getPhaseHistory: async (phaseId: number) => {
    try {
      return await api.get<History[]>(`${API_ENDPOINTS.phases}${phaseId}/history/`);
    } catch (error: any) {
      console.error("Get phase history error:", error);
      throw new Error(error.message || "Failed to get phase history");
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

  getOutputsByPhase: async (phaseId: number) => {
    try {
      return await api.get(`${API_ENDPOINTS.outputs}?phase=${phaseId}`)
    } catch (error: any) {
      console.error("Get outputs by phase error:", error)
      throw new Error(error.message || "Failed to get outputs for phase")
    }
  },

  getOutput: async (id: number) => {
    try {
      return await api.get<Output>(API_ENDPOINTS.output(id))
    } catch (error: any) {
      console.error("Get output error:", error)
      throw new Error(error.message || "Failed to get output")
    }
  },

  createOutput: async (data: OutputCreateRequest) => {
    try {
      return await api.post<Output>(API_ENDPOINTS.outputs, data)
    } catch (error: any) {
      console.error("Create output error:", error)
      throw new Error(error.message || "Failed to create output")
    }
  },

  updateOutput: async (id: number, data: OutputUpdateRequest) => {
    try {
      return await api.put<Output>(API_ENDPOINTS.output(id), data)
    } catch (error: any) {
      console.error("Update output error:", error)
      throw new Error(error.message || "Failed to update output")
    }
  },

  deleteOutput: async (id: number) => {
    try {
      return await api.delete(API_ENDPOINTS.output(id))
    } catch (error: any) {
      console.error("Delete output error:", error)
      throw new Error(error.message || "Failed to delete output")
    }
  },

  getOutputHistory: async (id: number) => {
    try {
      return await api.get<History[]>(API_ENDPOINTS.outputHistory(id))
    } catch (error: any) {
      console.error("Get output history error:", error)
      throw new Error(error.message || "Failed to get output history")
    }
  },

  updateOutputHistory: async (id: number, historyData: OutputHistoryUpdateRequest) => {
    try {
      return await api.put<History>(API_ENDPOINTS.updateOutputHistory(id), historyData)
    } catch (error: any) {
      console.error("Update output history error:", error)
      throw new Error(error.message || "Failed to update output history")
    }
  },
  
  addDocument: async (outputId: number, documentData: any) => {
    try {
      return await api.post(`${API_ENDPOINTS.output(outputId)}/documents/`, documentData)
    } catch (error: any) {
      console.error("Add document error:", error)
      throw new Error(error.message || "Failed to add document")
    }
  }
}

// Document API functions
export const documentApi = {
  // Get all documents
  getAllDocuments: async () => {
    try {
      const response = await api.get<Document[]>(API_ENDPOINTS.documents);
      return response;
    } catch (error: any) {
      console.error("Get all documents error:", error);
      throw new Error(error.message || "Failed to get all documents");
    }
  },
  
  // Get documents by output ID
  getDocumentsByOutput: async (outputId: number) => {
    try {
      const response = await api.get<Document[]>(API_ENDPOINTS.documentsByOutput(outputId));
      return response;
    } catch (error: any) {
      console.error(`Get documents for output ${outputId} error:`, error);
      throw new Error(error.message || `Failed to get documents for output ${outputId}`);
    }
  },
  
  // Get documents by status
  getDocumentsByStatus: async (status: string) => {
    try {
      const response = await api.get<Document[]>(API_ENDPOINTS.documentsByStatus(status));
      return response;
    } catch (error: any) {
      console.error(`Get documents with status ${status} error:`, error);
      throw new Error(error.message || `Failed to get documents with status ${status}`);
    }
  },
  
  // Get a specific document by ID with history details
  getDocument: async (id: number) => {
    try {
      return await api.get<Document>(API_ENDPOINTS.document(id));
    } catch (error: any) {
      console.error(`Get document ${id} error:`, error);
      throw new Error(error.message || `Failed to get document ${id}`);
    }
  },
  
  // Upload a new document with FormData (supports history attributes)
  uploadDocument: async (formData: FormData) => {
    try {
      const token = getAuthToken();
      
      const response = await fetch(API_ENDPOINTS.documents, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Upload failed with status ${response.status}`);
      }
      
      return await response.json() as Document;
    } catch (error: any) {
      console.error("Upload document error:", error);
      throw new Error(error.message || "Failed to upload document");
    }
  },
  
  // Update document metadata with optional history attributes
  updateDocument: async (id: number, data: DocumentUpdateRequest) => {
    try {
      return await api.put<Document>(API_ENDPOINTS.document(id), data);
    } catch (error: any) {
      console.error(`Update document ${id} error:`, error);
      throw new Error(error.message || `Failed to update document ${id}`);
    }
  },
  
  // Update only history attributes
  updateDocumentHistory: async (id: number, historyData: DocumentHistoryUpdateRequest) => {
    try {
      return await api.put<History>(API_ENDPOINTS.updateDocumentHistory(id), historyData);
    } catch (error: any) {
      console.error(`Update document ${id} history error:`, error);
      throw new Error(error.message || `Failed to update document ${id} history`);
    }
  },
  
  // Get document history records
  getDocumentHistory: async (id: number) => {
    try {
      return await api.get<History[]>(API_ENDPOINTS.documentHistory(id));
    } catch (error: any) {
      console.error(`Get document ${id} history error:`, error);
      throw new Error(error.message || `Failed to get document ${id} history`);
    }
  },
  
  // Update document file
  updateDocumentFile: async (id: number, formData: FormData) => {
    try {
      const token = getAuthToken();
      
      const response = await fetch(API_ENDPOINTS.updateDocumentFile(id), {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `File update failed with status ${response.status}`);
      }
      
      return await response.json() as Document;
    } catch (error: any) {
      console.error(`Update document ${id} file error:`, error);
      throw new Error(error.message || `Failed to update document ${id} file`);
    }
  },
  
  // Change document output
  changeDocumentOutput: async (id: number, outputId: number) => {
    try {
      return await api.post<Document>(API_ENDPOINTS.changeDocumentOutput(id), { output_id: outputId });
    } catch (error: any) {
      console.error(`Change document ${id} output error:`, error);
      throw new Error(error.message || `Failed to change document ${id} output`);
    }
  },
  
  // Delete document
  deleteDocument: async (id: number, deleteFile: boolean = true) => {
    try {
      const url = `${API_ENDPOINTS.document(id)}?delete_file=${deleteFile}`;
      return await api.delete(url);
    } catch (error: any) {
      console.error(`Delete document ${id} error:`, error);
      throw new Error(error.message || `Failed to delete document ${id}`);
    }
  }
};

// Helper function for document upload with progress tracking and history support
export const uploadDocumentWithProgress = async (
  file: File, 
  data: {
    name: string;
    output_id?: number;
    uploader?: number;
    version?: string;
    status?: string;
    history?: {
      title?: string;
      deadline?: string;
      started_at?: string;
      finished_at?: string;
    };
  },
  onProgress?: (percent: number) => void
): Promise<Document> => {
  return new Promise<Document>((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', data.name);
    
    if (data.output_id !== undefined) {
      formData.append('output_id', data.output_id.toString());
    }
    
    if (data.uploader !== undefined) {
      formData.append('uploader', data.uploader.toString());
    }
    
    if (data.version) {
      formData.append('version', data.version);
    }
    
    if (data.status) {
      formData.append('status', data.status);
    }
    
    if (data.history) {
      formData.append('history', JSON.stringify(data.history));
    }
    
    const xhr = new XMLHttpRequest();
    xhr.open('POST', API_ENDPOINTS.documents);
    
    const token = getAuthToken();
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }
    
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const percentComplete = Math.round((event.loaded / event.total) * 100);
        onProgress(percentComplete);
      }
    };
    
    xhr.onload = function() {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch (error) {
          reject(new Error('Invalid response format'));
        }
      } else {
        let errorMsg;
        try {
          const errorResponse = JSON.parse(xhr.responseText);
          errorMsg = errorResponse.error || `Upload failed with status ${xhr.status}`;
          
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

// Add this to your existing api-utils.ts file

// File upload with progress tracking
export const uploadDocument = async (
  file: File, 
  outputId: string,
  uploaderId: string | undefined,
  onProgress?: (percent: number) => void
): Promise<DocumentData> => {
  return new Promise<DocumentData>((resolve, reject) => {
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
          const response = JSON.parse(xhr.responseText) as DocumentData;
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
      // Now API returns a direct array of users instead of paginated response
      return await api.get<User[]>(API_ENDPOINTS.users);
    } catch (error: any) {
      console.error("Get all users error:", error);
      throw new Error(error.message || "Failed to get all users");
    }
  },

  // Rest of userApi functions remain the same
  getUser: async (id: number) => {
    try {
      return await api.get<User>(`${API_ENDPOINTS.users}${id}/`);
    } catch (error: any) {
      console.error("Get user error:", error);
      throw new Error(error.message || "Failed to get user");
    }
  },

  createUser: async (data: any) => {
    try {
      return await api.post<User>(API_ENDPOINTS.users, data);
    } catch (error: any) {
      console.error("Create user error:", error);
      throw new Error(error.message || "Failed to create user");
    }
  },

  updateUser: async (id: number, data: any) => {
    try {
      return await api.put<User>(`${API_ENDPOINTS.users}${id}/`, data);
    } catch (error: any) {
      console.error("Update user error:", error);
      throw new Error(error.message || "Failed to update user");
    }
  },

  deleteUser: async (id: number) => {
    try {
      return await api.delete(`${API_ENDPOINTS.users}${id}/`);
    } catch (error: any) {
      console.error("Delete user error:", error);
      throw new Error(error.message || "Failed to delete user");
    }
  },
}

// Client management API functions
export const clientApi = {
  getAllClients: async () => {
    try {
      // Modified to expect a direct array instead of paginated response
      return await api.get<Client[]>(API_ENDPOINTS.clients);
    } catch (error: any) {
      console.error("Get all clients error:", error);
      throw new Error(error.message || "Failed to get all clients");
    }
  },

  // Remove getClientsPage function since pagination is no longer needed

  getClient: async (id: number) => {
    try {
      return await api.get<Client>(`${API_ENDPOINTS.clients}${id}/`);
    } catch (error: any) {
      console.error("Get client error:", error);
      throw new Error(error.message || "Failed to get client");
    }
  },

  createClient: async (data: ClientCreateRequest) => {
    try {
      return await api.post<Client>(API_ENDPOINTS.clients, data);
    } catch (error: any) {
      console.error("Create client error:", error);
      throw new Error(error.message || "Failed to create client");
    }
  },

  updateClient: async (id: number, data: ClientUpdateRequest) => {
    try {
      return await api.put<Client>(`${API_ENDPOINTS.clients}${id}/`, data);
    } catch (error: any) {
      console.error("Update client error:", error);
      throw new Error(error.message || "Failed to update client");
    }
  },

  deleteClient: async (id: number) => {
    try {
      return await api.delete(`${API_ENDPOINTS.clients}${id}/`);
    } catch (error: any) {
      console.error("Delete client error:", error);
      throw new Error(error.message || "Failed to delete client");
    }
  },
}

// Template management API functions
export const templateApi = {
  // Phase templates
  getAllPhaseTemplates: async () => {
    try {
      const response = await api.get<PaginatedResponse<PhaseTemplate>>(API_ENDPOINTS.phaseTemplates);
      // Return the results array from the paginated response
      return response.results || [];
    } catch (error: any) {
      console.error("Get all phase templates error:", error);
      throw new Error(error.message || "Failed to get all phase templates");
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
      return await api.get<OutputTemplate[]>(API_ENDPOINTS.outputTemplates);
    } catch (error: any) {
      console.error("Get all output templates error:", error);
      throw new Error(error.message || "Failed to get all output templates");
    }
  },

  getOutputTemplate: async (id: number) => {
    try {
      return await api.get<OutputTemplate>(`${API_ENDPOINTS.outputTemplates}${id}/`);
    } catch (error: any) {
      console.error(`Get output template ${id} error:`, error);
      throw new Error(error.message || `Failed to get output template ${id}`);
    }
  },

  createOutputTemplate: async (data: OutputTemplateCreateRequest) => {
    try {
      // Convert from frontend form fields to API request format
      const requestData = {
        name: data.name,
        description: data.description,
        phase_id: data.phase_id,
        ppap_element_id: data.ppap_element_id,
        configuration: {
          document_type: data.document_type || "document",
          is_required: data.is_required !== undefined ? data.is_required : true,
          is_active: data.is_active !== undefined ? data.is_active : true,
          ...data.configuration
        }
      };
      
      return await api.post<OutputTemplate>(API_ENDPOINTS.outputTemplates, requestData);
    } catch (error: any) {
      console.error("Create output template error:", error);
      throw new Error(error.message || "Failed to create output template");
    }
  },

  // This should be part of your templateApi object
  updateOutputTemplate: async (id: number, data: any) => {
    try {
      // No need to convert phase or ppap_element - send exactly as received
      // The API expects phase and ppap_element, not phase_id and ppap_element_id
      return await api.put<OutputTemplate>(`${API_ENDPOINTS.outputTemplates}${id}/`, data);
    } catch (error: any) {
      console.error(`Update output template ${id} error:`, error);
      throw new Error(error.message || `Failed to update output template ${id}`);
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
      // If pagination is disabled on the backend, the response will be a direct array
      return await api.get<PPAPElement[]>(API_ENDPOINTS.ppapElements);
    } catch (error: any) {
      console.error("Get all PPAP elements error:", error);
      throw new Error(error.message || "Failed to get all PPAP elements");
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
  getAllHistory: async (): Promise<PaginatedResponse<History>> => {
  try {
    const response = await api.get<PaginatedResponse<History>>(API_ENDPOINTS.history);
    return response;
  } catch (error: any) {
    console.error("Get all history error:", error);
    throw new Error(error.message || "Failed to get all history");
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

  getHistoryByType: async (tableName: string, projectId: string) => {
    try {
      const endpoint = `${API_ENDPOINTS.history}${tableName}/?project_id=${projectId}`;
      const response = await api.get<HistoryEntry[]>(endpoint);
      return response;
    } catch (error: any) {
      console.error(`Get ${tableName} history error:`, error);
      throw new Error(error.message || `Failed to get ${tableName} history`);
    }
  },

  getNestedHistory: async (projectId: string): Promise<NestedHistory> => {
    try {
      const endpoint = API_ENDPOINTS.nestedHistory.replace(':projectId', projectId);
      const response = await api.get<NestedHistory>(endpoint);
      return response;
    } catch (error: any) {
      console.error(`Get nested history error:`, error);
      throw new Error(error.message || `Failed to get nested history for project ${projectId}`);
    }
  },

  // Add new method for all projects
  getAllProjectsNestedHistory: async (page = 1, pageSize = 10): Promise<AllProjectsHistoryResponse> => {
    try {
      console.log(`Fetching history for page ${page} with ${pageSize} items per page`);
      const endpoint = `${API_ENDPOINTS.projectsHistory}?page=${page}&page_size=${pageSize}`;
      
      const response = await api.get<AllProjectsHistoryResponse>(endpoint);
      console.log(`Received history response with ${Object.keys(response?.results || {}).length} projects`);
      return response;
    } catch (error: any) { // Explicitly type as any
      console.error('Error fetching all projects history:', error);
      throw new Error(error.message || 'Failed to fetch history data');
    }
  }
}

// Define an interface for the nested history response
interface AllProjectsHistoryResponse {
  total: number;
  page: number;
  page_size: number;
  pages: number;
  results: Record<string, {
    project_name: string;
    history: any;
  }>;
}

// Team management API functions
export const teamApi = {
  getAllTeams: async () => {
    try {
      return await api.get<Team[]>(API_ENDPOINTS.teams);
    } catch (error: any) {
      console.error("Get all teams error:", error);
      throw new Error(error.message || "Failed to get all teams");
    }
  },

  getUserTeams: async () => {
    try {
      return await api.get<Team[]>(`${API_ENDPOINTS.teams}?is_user_team=true`);
    } catch (error: any) {
      console.error("Get user teams error:", error);
      throw new Error(error.message || "Failed to get user teams");
    }
  },

  getClientTeams: async () => {
    try {
      return await api.get<Team[]>(`${API_ENDPOINTS.teams}?is_user_team=false`);
    } catch (error: any) {
      console.error("Get client teams error:", error);
      throw new Error(error.message || "Failed to get client teams");
    }
  },
  
  getTeamById: async (id: number) => {
    try {
      return await api.get<Team>(`${API_ENDPOINTS.teams}${id}/`);
    } catch (error: any) {
      console.error(`Get team ${id} error:`, error);
      throw new Error(error.message || `Failed to get team ${id}`);
    }
  },
  
  createTeam: async (data: TeamCreateRequest) => {
    try {
      // Format the request body according to the API expectations
      const requestData = {
        name: data.name,
        description: data.description || '',
        is_user_team: data.is_user_team,
        // Format team members for API
        members: data.members?.map(member => {
          if (member.id) {
            // Existing person, just send ID
            return { 
              id: member.id,
              member_type: member.role || 'member' // Include role as member_type
            };
          } else {
            // New person with required fields
            const personData: Record<string, any> = {
              first_name: member.first_name,
              last_name: member.last_name,
              role: member.role || '',
            };
            
            // Add contact details if available
            if (member.contact) {
              personData.contact = {
                email: member.contact.email || '',
                phone: member.contact.phone || '',
                address: member.contact.address || ''
              };
            }
            
            // For user team members, add user-specific fields
            if (data.is_user_team && member.username && member.password) {
              personData.create_user = true;
              personData.username = member.username;
              personData.password = member.password;
              personData.is_active = member.is_active !== undefined ? member.is_active : true;
            }
            
            return personData;
          }
        }) || []
      };
      
      return await api.post<Team>(API_ENDPOINTS.teams, requestData);
    } catch (error: any) {
      console.error("Create team error:", error);
      throw new Error(error.message || "Failed to create team");
    }
  },
  
  updateTeam: async (id: number, data: TeamUpdateRequest) => {
    try {
      // Format the request body according to the API expectations
      const requestData: Record<string, any> = {};
      
      if (data.name !== undefined) requestData.name = data.name;
      if (data.description !== undefined) requestData.description = data.description;
      if (data.is_user_team !== undefined) requestData.is_user_team = data.is_user_team;
      if (data.replace_all_members !== undefined) requestData.replace_all_members = data.replace_all_members;
      
      // Format team members for API if provided
      if (data.members) {
        requestData.members = data.members.map(member => {
          if (member.id) {
            // Existing person, just send ID
            return { 
              id: member.id,
              member_type: member.role || 'member' // Include role as member_type
            };
          } else {
            // New person with required fields
            const personData: Record<string, any> = {
              first_name: member.first_name,
              last_name: member.last_name,
              role: member.role || '',
            };
            
            // Add contact details if available
            if (member.contact) {
              personData.contact = {
                email: member.contact.email || '',
                phone: member.contact.phone || '',
                address: member.contact.address || ''
              };
            }
            
            // For user team members, add user-specific fields
            if (data.is_user_team && member.username && member.password) {
              personData.create_user = true;
              personData.username = member.username;
              personData.password = member.password;
              personData.is_active = member.is_active !== undefined ? member.is_active : true;
            }
            
            return personData;
          }
        });
      }
      
      return await api.put<Team>(`${API_ENDPOINTS.teams}${id}/`, requestData);
    } catch (error: any) {
      console.error(`Update team ${id} error:`, error);
      throw new Error(error.message || `Failed to update team ${id}`);
    }
  },
  
  // Rest of teamApi methods remain unchanged
  deleteTeam: async (id: number) => {
    try {
      return await api.delete(`${API_ENDPOINTS.teams}${id}/`);
    } catch (error: any) {
      console.error(`Delete team ${id} error:`, error);
      throw new Error(error.message || `Failed to delete team ${id}`);
    }
  },
  
  getTeamProjects: async (id: number) => {
    try {
      return await api.get<Project[]>(`${API_ENDPOINTS.teams}${id}/projects/`);
    } catch (error: any) {
      console.error(`Get projects for team ${id} error:`, error);
      throw new Error(error.message || `Failed to get projects for team ${id}`);
    }
  }
};

// Department management API functions
export const departmentApi = {
  // Get all departments (paginated)
  getAllDepartments: async () => {
    try {
      const response = await api.get<PaginatedResponse<Department>>(API_ENDPOINTS.departments);
      return response.results || [];
    } catch (error: any) {
      console.error("Get all departments error:", error);
      throw new Error(error.message || "Failed to get all departments");
    }
  },

  // Get departments with pagination
  getDepartmentsPage: async (url: string) => {
    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch departments: ${response.statusText}`);
      }

      return await response.json() as PaginatedResponse<Department>;
    } catch (error: any) {
      console.error("Get departments page error:", error);
      throw new Error(error.message || "Failed to get departments page");
    }
  },

  // Get department by ID
  getDepartment: async (id: number) => {
    try {
      return await api.get<Department>(`${API_ENDPOINTS.departments}${id}/`);
    } catch (error: any) {
      console.error(`Get department ${id} error:`, error);
      throw new Error(error.message || `Failed to get department ${id}`);
    }
  },

  // Create a new department
  createDepartment: async (data: DepartmentCreateRequest) => {
    try {
      return await api.post<Department>(API_ENDPOINTS.departments, data);
    } catch (error: any) {
      console.error("Create department error:", error);
      throw new Error(error.message || "Failed to create department");
    }
  },

  // Update a department
  updateDepartment: async (id: number, data: DepartmentUpdateRequest) => {
    try {
      return await api.put<Department>(`${API_ENDPOINTS.departments}${id}/`, data);
    } catch (error: any) {
      console.error(`Update department ${id} error:`, error);
      throw new Error(error.message || `Failed to update department ${id}`);
    }
  },

  // Delete a department
  deleteDepartment: async (id: number) => {
    try {
      return await api.delete<{}>(`${API_ENDPOINTS.departments}${id}/`);
    } catch (error: any) {
      console.error(`Delete department ${id} error:`, error);
      throw new Error(error.message || `Failed to delete department ${id}`);
    }
  },

  // Get department members
  getDepartmentMembers: async (id: number) => {
    try {
      return await api.get<Array<{
        id: number;
        first_name: string;
        last_name: string;
        is_user: boolean;
      }>>(`${API_ENDPOINTS.departments}${id}/members/`);
    } catch (error: any) {
      console.error(`Get department ${id} members error:`, error);
      throw new Error(error.message || `Failed to get department ${id} members`);
    }
  },

  // Get department teams
  getDepartmentTeams: async (id: number) => {
    try {
      return await api.get<Array<{
        id: number;
        name: string;
      }>>(`${API_ENDPOINTS.departments}${id}/teams/`);
    } catch (error: any) {
      console.error(`Get department ${id} teams error:`, error);
      throw new Error(error.message || `Failed to get department ${id} teams`);
    }
  },
};

// PPAP API functions
export const ppapApi = {
  // Get all PPAPs
  getAllPPAPs: async () => {
    try {
      const response = await api.get<PPAP[]>(API_ENDPOINTS.ppaps);
      return response;
    } catch (error: any) {
      console.error("Get all PPAPs error:", error);
      throw new Error(error.message || "Failed to get all PPAPs");
    }
  },
  
  // Get PPAPs by project ID
  getPPAPsByProject: async (projectId: number) => {
    try {
      const response = await api.get<PPAP[]>(API_ENDPOINTS.ppapsByProject(projectId));
      return response;
    } catch (error: any) {
      console.error(`Get PPAPs for project ${projectId} error:`, error);
      throw new Error(error.message || `Failed to get PPAPs for project ${projectId}`);
    }
  },
  
  // Get a specific PPAP by ID
  getPPAP: async (id: number) => {
    try {
      return await api.get<PPAP>(API_ENDPOINTS.ppap(id));
    } catch (error: any) {
      console.error(`Get PPAP ${id} error:`, error);
      throw new Error(error.message || `Failed to get PPAP ${id}`);
    }
  },
  
  // Get detailed PPAP information including phases and outputs
  getPPAPDetails: async (id: number) => {
    try {
      return await api.get<PPAPDetails>(API_ENDPOINTS.ppapDetails(id));
    } catch (error: any) {
      console.error(`Get PPAP ${id} details error:`, error);
      throw new Error(error.message || `Failed to get PPAP ${id} details`);
    }
  },
  
  // Create a new PPAP
  createPPAP: async (data: PPAPCreateRequest) => {
    try {
      return await api.post<PPAP>(API_ENDPOINTS.ppaps, data);
    } catch (error: any) {
      console.error("Create PPAP error:", error);
      throw new Error(error.message || "Failed to create PPAP");
    }
  },
  
  // Update an existing PPAP
  updatePPAP: async (id: number, data: PPAPUpdateRequest) => {
    try {
      return await api.put<PPAP>(API_ENDPOINTS.ppap(id), data);
    } catch (error: any) {
      console.error(`Update PPAP ${id} error:`, error);
      throw new Error(error.message || `Failed to update PPAP ${id}`);
    }
  },
  
  // Delete a PPAP
  deletePPAP: async (id: number) => {
    try {
      return await api.delete(API_ENDPOINTS.ppap(id));
    } catch (error: any) {
      console.error(`Delete PPAP ${id} error:`, error);
      throw new Error(error.message || `Failed to delete PPAP ${id}`);
    }
  },
  
  // Get PPAP history records
  getPPAPHistory: async (id: number) => {
    try {
      return await api.get<History[]>(API_ENDPOINTS.ppapHistory(id));
    } catch (error: any) {
      console.error(`Get PPAP ${id} history error:`, error);
      throw new Error(error.message || `Failed to get PPAP ${id} history`);
    }
  },
  
  // Record PPAP customer submission
  recordCustomerSubmission: async (id: number, submissionDate?: string) => {
    try {
      return await api.post<PPAP>(API_ENDPOINTS.ppapCustomerSubmission(id), {
        submission_date: submissionDate || new Date().toISOString()
      });
    } catch (error: any) {
      console.error(`Record customer submission for PPAP ${id} error:`, error);
      throw new Error(error.message || `Failed to record customer submission for PPAP ${id}`);
    }
  },
  
  // Record customer decision on PPAP
  recordCustomerDecision: async (id: number, decision: string, comments?: string) => {
    try {
      return await api.post<PPAP>(API_ENDPOINTS.ppapCustomerDecision(id), {
        decision,
        comments
      });
    } catch (error: any) {
      console.error(`Record customer decision for PPAP ${id} error:`, error);
      throw new Error(error.message || `Failed to record customer decision for PPAP ${id}`);
    }
  }
};

// Todo API functions
export const todoApi = {
  // Get all todos
  getAllTodos: async () => {
    try {
      const response = await api.get<Todo[]>(API_ENDPOINTS.todos);
      return response;
    } catch (error: any) {
      console.error("Get all todos error:", error);
      throw new Error(error.message || "Failed to get all todos");
    }
  },
  
  // Get todos by user ID
  getTodosByUser: async (userId: number) => {
    try {
      const response = await api.get<Todo[]>(API_ENDPOINTS.todosByUser(userId));
      return response;
    } catch (error: any) {
      console.error(`Get todos for user ${userId} error:`, error);
      throw new Error(error.message || `Failed to get todos for user ${userId}`);
    }
  },
  
  // Get todos by output ID
  getTodosByOutput: async (outputId: number) => {
    try {
      const response = await api.get<Todo[]>(API_ENDPOINTS.todosByOutput(outputId));
      return response;
    } catch (error: any) {
      console.error(`Get todos for output ${outputId} error:`, error);
      throw new Error(error.message || `Failed to get todos for output ${outputId}`);
    }
  },
  
  // Get todos by status
  getTodosByStatus: async (status: string) => {
    try {
      const response = await api.get<Todo[]>(API_ENDPOINTS.todosByStatus(status));
      return response;
    } catch (error: any) {
      console.error(`Get todos with status ${status} error:`, error);
      throw new Error(error.message || `Failed to get todos with status ${status}`);
    }
  },
  
  // Get a specific todo by ID
  getTodo: async (id: number) => {
    try {
      return await api.get<Todo>(API_ENDPOINTS.todo(id));
    } catch (error: any) {
      console.error(`Get todo ${id} error:`, error);
      throw new Error(error.message || `Failed to get todo ${id}`);
    }
  },
  
  // Create a new todo
  createTodo: async (data: TodoCreateRequest) => {
    try {
      return await api.post<Todo>(API_ENDPOINTS.todos, data);
    } catch (error: any) {
      console.error("Create todo error:", error);
      throw new Error(error.message || "Failed to create todo");
    }
  },
  
  // Update a todo
  updateTodo: async (id: number, data: TodoUpdateRequest) => {
    try {
      return await api.put<Todo>(API_ENDPOINTS.todo(id), data);
    } catch (error: any) {
      console.error(`Update todo ${id} error:`, error);
      throw new Error(error.message || `Failed to update todo ${id}`);
    }
  },
  
  // Update only history attributes
  updateTodoHistory: async (id: number, historyData: TodoHistoryUpdateRequest) => {
    try {
      return await api.put<History>(API_ENDPOINTS.updateTodoHistory(id), historyData);
    } catch (error: any) {
      console.error(`Update todo ${id} history error:`, error);
      throw new Error(error.message || `Failed to update todo ${id} history`);
    }
  },
  
  // Get todo history
  getTodoHistory: async (id: number) => {
    try {
      return await api.get<History>(API_ENDPOINTS.todoHistory(id));
    } catch (error: any) {
      console.error(`Get todo ${id} history error:`, error);
      throw new Error(error.message || `Failed to get todo ${id} history`);
    }
  },
  
  // Change todo status
  changeTodoStatus: async (id: number, status: string) => {
    try {
      return await api.post<Todo>(API_ENDPOINTS.changeTodoStatus(id), { status });
    } catch (error: any) {
      console.error(`Change todo ${id} status error:`, error);
      throw new Error(error.message || `Failed to change todo ${id} status`);
    }
  },
  
  // Reassign todo to another person
  reassignTodo: async (id: number, personId: number) => {
    try {
      return await api.post<Todo>(API_ENDPOINTS.reassignTodo(id), { person_id: personId });
    } catch (error: any) {
      console.error(`Reassign todo ${id} error:`, error);
      throw new Error(error.message || `Failed to reassign todo ${id}`);
    }
  },
  
  // Delete todo
  deleteTodo: async (id: number) => {
    try {
      return await api.delete(API_ENDPOINTS.todo(id));
    } catch (error: any) {
      console.error(`Delete todo ${id} error:`, error);
      throw new Error(error.message || `Failed to delete todo ${id}`);
    }
  },
  
  // Get user todos (summary format)
  getUserTodos: async (userId: number) => {
    try {
      return await api.get<TodoSummary[]>(`${API_ENDPOINTS.userTodos}?user_id=${userId}`);
    } catch (error: any) {
      console.error(`Get user ${userId} todos error:`, error);
      throw new Error(error.message || `Failed to get user ${userId} todos`);
    }
  },
  
  // Get pending todos (summary format)
  getPendingTodos: async (userId: number) => {
    try {
      return await api.get<TodoSummary[]>(`${API_ENDPOINTS.pendingTodos}?user_id=${userId}`);
    } catch (error: any) {
      console.error(`Get pending todos for user ${userId} error:`, error);
      throw new Error(error.message || `Failed to get pending todos for user ${userId}`);
    }
  },
  
  // Bulk create todos
  bulkCreateTodos: async (data: TodoBulkCreateRequest) => {
    try {
      return await api.post(API_ENDPOINTS.bulkCreateTodos, data);
    } catch (error: any) {
      console.error("Bulk create todos error:", error);
      throw new Error(error.message || "Failed to bulk create todos");
    }
  }
};

// Add this personApi object to your api-utils.ts file
export const personApi = {
  getAllPeople: async () => {
    try {
      return await api.get<Person[]>(API_ENDPOINTS.persons);
    } catch (error: any) {
      console.error("Get all people error:", error);
      throw new Error(error.message || "Failed to get all people");
    }
  },
  
  // Add a method to get all users (people with is_user=true)
  getUserPeople: async () => {
    try {
      return await api.get<Person[]>(`${API_ENDPOINTS.persons}?is_user=true`);
    } catch (error: any) {
      console.error("Get user people error:", error);
      throw new Error(error.message || "Failed to get user people");
    }
  },
  
  // Add a method to get all non-users (people with is_user=false)
  getNonUserPeople: async () => {
    try {
      return await api.get<Person[]>(`${API_ENDPOINTS.persons}?is_user=false`);
    } catch (error: any) {
      console.error("Get non-user people error:", error);
      throw new Error(error.message || "Failed to get non-user people");
    }
  },
  
  getPerson: async (id: number) => {
    try {
      return await api.get<Person>(API_ENDPOINTS.person(id));
    } catch (error: any) {
      console.error(`Get person ${id} error:`, error);
      throw new Error(error.message || `Failed to get person ${id}`);
    }
  },
  
  createPerson: async (data: PersonCreateRequest) => {
    try {
      // Format request data according to the API expectations
      const requestData = {
        first_name: data.first_name,
        last_name: data.last_name,
        role: data.role || '',
        department_id: data.department_id,
        is_user: data.is_user || false,
        contact: data.contact,
        
        // Include user-specific fields if this will be a user
        ...(data.is_user ? {
          username: data.username,
          password: data.password,
          authorization_id: data.authorization_id || 1, // Default to lowest level
          is_active: data.is_active !== undefined ? data.is_active : true
        } : {})
      };
      
      return await api.post<Person>(API_ENDPOINTS.persons, requestData);
    } catch (error: any) {
      console.error("Create person error:", error);
      throw new Error(error.message || "Failed to create person");
    }
  },
  
  updatePerson: async (id: number, data: PersonUpdateRequest) => {
    try {
      // Only send fields that are provided
      const requestData: Record<string, any> = {};
      
      if (data.first_name !== undefined) requestData.first_name = data.first_name;
      if (data.last_name !== undefined) requestData.last_name = data.last_name;
      if (data.role !== undefined) requestData.role = data.role;
      if (data.department_id !== undefined) requestData.department_id = data.department_id;
      if (data.is_user !== undefined) requestData.is_user = data.is_user;
      if (data.contact) requestData.contact = data.contact;
      
      // Include user-specific fields if provided
      if (data.username) requestData.username = data.username;
      if (data.password) requestData.password = data.password;
      if (data.authorization_id) requestData.authorization_id = data.authorization_id;
      if (data.is_active !== undefined) requestData.is_active = data.is_active;
      
      return await api.put<Person>(API_ENDPOINTS.person(id), requestData);
    } catch (error: any) {
      console.error(`Update person ${id} error:`, error);
      throw new Error(error.message || `Failed to update person ${id}`);
    }
  },
  
  deletePerson: async (id: number) => {
    try {
      return await api.delete(API_ENDPOINTS.person(id));
    } catch (error: any) {
      console.error(`Delete person ${id} error:`, error);
      throw new Error(error.message || `Failed to delete person ${id}`);
    }
  }
};
