// User related types
export interface User {
  id: number
  username: string
  is_staff: boolean
  is_superuser: boolean
  first_name: string
  last_name: string
  email: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  user: User
}

// Project related types
export interface Client {
  id: number
  name: string
  address: string
  code: Record<string, any>
  description: string
  contact_id: string
  history_id: string
}

export interface Team {
  id: number
  name: string
  description: string
  history_id: string
}

export interface PPAP {
  id: number
  project: number
  level: number
  status: string
  review: string | null
  history_id: string
  phases?: Phase[]
}

export interface Project {
  id: number
  name: string
  description: string
  client: number
  team: number
  status: string
  ppap: number | null
  history_id: string
  client_details?: Client
  team_details?: Team
  ppap_details?: PPAP
}

export interface ProjectCreateRequest {
  name: string
  description?: string
  client_id: number
  team_id: number
  ppap_level?: number
}

export interface ProjectUpdateRequest {
  name?: string
  description?: string
  client_id?: number
  team_id?: number
  status?: string
}

// Phase related types
export interface PhaseTemplate {
  id: number
  name: string
  description: string
  order: number
}

export interface Phase {
  id: number
  template: number
  responsible: number | null
  ppap: number
  status: string
  history_id: string
  template_details?: PhaseTemplate
  outputs?: Output[]
  responsible_details?: User
}

// Output related types
export interface OutputTemplate {
  id: number
  name: string
  configuration: Record<string, any>
  phase: number
  ppap_element: number
}

export interface Output {
  id: number
  template: number
  description: string | null
  document: number | null
  user: number | null
  phase: number
  status: string
  history_id: string
  template_details?: OutputTemplate
  documents?: Document[]
  user_details?: User
}

// Document related types
export interface Document {
  id: number
  name: string
  description: string
  file_path: string
  file_type: string
  file_size: number
  uploader: number
  output: number
  version: string
  status: string
  history_id: string
  uploader_details?: User
}

// History related types
export interface HistoryEvent {
  type: string
  details: string
  timestamp: string
}

export interface History {
  id: string
  title: string
  events: HistoryEvent[]
  table_name: string
  created_at: string
  started_at?: string
  updated_at?: string
  deadline?: string
  finished_at?: string
}

// Dashboard related types
export interface DashboardProject {
  id: number
  name: string
  status: string
  ppap_level: number
  ppap_status: string
  client: string
  team: string
}

export interface DashboardTodo {
  id: number
  output_id: number
  output_name: string
  phase_id: number
  phase_name: string
  project_id: number
  project_name: string
  permission: string
  status: string
}

export interface DashboardResponse {
  projects: DashboardProject[]
  todos: DashboardTodo[]
}

// Permission related types
export interface UserPermissions {
  global_permission: string
  output_permissions: {
    output_id: number
    output_name: string
    phase_id: number
    phase_name: string
    permission: string
  }[]
}

export interface AuthorizationPermissions {
  can_create: string[]
  can_read: string[]
  can_update: string[]
  can_delete: string[]
}

export interface UserAuthorization {
  user_id: number
  username: string
  authorization_level: string
  permissions: AuthorizationPermissions
}

export interface UserPermissionsResponse {
  permissions: UserPermissions
  authorization: UserAuthorization
}

// Status change related types
export interface StatusChangeRequest {
  entity_type: "project" | "ppap" | "phase" | "output"
  entity_id: number
  status: string
}

export interface StatusChangeResponse {
  success: boolean
  message: string
}

// Permission assignment related types
export interface AssignPermissionRequest {
  user_id: number
  output_id: number
  permission_type: "r" | "e"
}

export interface AssignPermissionResponse {
  success: boolean
  message: string
}

// Phase responsible assignment related types
export interface AssignPhaseResponsibleRequest {
  phase_id: number
  responsible_id: number
}

export interface AssignPhaseResponsibleResponse {
  success: boolean
  message: string
}
