// User related types
export interface User {
  id: number
  username: string
  is_staff: boolean
  is_superuser: boolean
  person: number
  authorization: number
  last_login: string | null
  is_active: boolean
  history_id: string
  person_details?: {
    id: number
    first_name: string
    last_name: string
    contact_id: string
    is_user: boolean
    history_id: string
  }
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
// Update the Project interface to match the actual API response structure
export interface Project {
  id: number;
  name: string;
  description?: string;
  status: string;
  history_id: string;
  client: number;
  team: number | null;
  ppap: number | null;
  client_details?: {
    id: number;
    name: string;
    address: string;
    code: {
      duns?: string;
      fiscal?: string;
    };
    description?: string;
    contact_id?: string;
    history_id?: string;
    team?: number | null;
  };
  team_details?: {
    id: number;
    name: string;
    description?: string;
    history_id?: string;
    members?: {
      id: number;
      first_name?: string;
      last_name?: string;
      contact_id?: string;
      is_user?: boolean;
      history_id?: string;
      department?: number;
    }[];
  };
  ppap_details?: {
    id: number;
    level: number;
    status?: string;
    review?: string | null;
    history_id?: string;
    project: number;
    phases?: Phase[];
  };
}

// Update the Client interface to match the actual API response structure
export interface Client {
  id: number
  name: string
  address: string
  code: Record<string, any>
  description: string
  contact_id: string
  history_id: string
  team?: number
  contact_details?: {
    id: string
    email: string
    phone: string
    address: string
    type: string
  }
  team_details?: Team
}

// Update the Team interface to match the actual API response structure
export interface Team {
  id: number
  name: string
  description: string
  history_id: string
  members?: Array<{
    id: number
    teams?: Array<{
      id: number
      name: string
    }>
    first_name: string
    last_name: string
    contact_id: string
    is_user: boolean
    history_id: string
    department: number
    contact_details?: {
      id: string
      email: string
      phone: string
      address: string
    }
  }>
}

// Update the PPAP interface to match the actual API response structure
export interface PPAP {
  id: number
  project: number
  level: number
  status: string
  review: string | null
  history_id: string
  phases?: Phase[]
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
export interface PhaseTemplateResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: PhaseTemplate[];
}

// Update the PhaseTemplate interface to match the API response
export interface PhaseTemplate {
  id: number;
  name: string;
  description: string;
  order: number;
  is_active?: boolean; // Add this field to match your component state
  output_templates?: OutputTemplate[]; // Add this to include output templates
}

// Update the Phase interface to match the actual API response structure
export interface Phase {
  id: number;
  template: number;
  ppap: number;
  status: string;
  history_id: string;
  responsible: number | null;
  template_details?: {
    id: number;
    name: string;
    description: string;
    order: number;
    output_templates?: OutputTemplate[];
  };
  outputs?: Output[];
  responsible_details?: User;
  history_details?: History; // Add this to match your updated backend response
}

// Add or update these interfaces for Phase requests

// For creating a new Phase
export interface PhaseCreateRequest {
  template_id: number;
  ppap_id: number;
  responsible_id?: number | null;
  status?: string;
  history?: {
    title?: string;
    deadline?: string;
    started_at?: string;
    finished_at?: string;
  };
}

// For updating an existing Phase
export interface PhaseUpdateRequest {
  responsible_id?: number | null;
  status?: string;
  history?: {
    title?: string;
    deadline?: string;
    started_at?: string;
    finished_at?: string;
  };
}

// For updating only history attributes
export interface PhaseHistoryUpdateRequest {
  title?: string;
  deadline?: string;
  started_at?: string;
  finished_at?: string;
}

// Output related types
export interface OutputTemplate {
  id: number
  name: string
  description?: string
  configuration: Record<string, any>
  phase: number
  ppap_element: number
  document_type: string
  is_required: boolean
  is_active: boolean
  ppap_element_details?: {
    id: number
    name: string
    level: string
  }
  phase_name?: string
}

// Output related interfaces
export interface OutputCreateRequest {
  template_id: number;
  phase_id: number;
  description?: string;
  status?: string;
  user_id?: number | null;
  history?: {
    title?: string;
    deadline?: string;
    started_at?: string;
    finished_at?: string;
  };
}

export interface OutputUpdateRequest {
  description?: string;
  status?: string;
  user_id?: number | null;
  history?: {
    title?: string;
    deadline?: string;
    started_at?: string;
    finished_at?: string;
  };
}

export interface OutputHistoryUpdateRequest {
  title?: string;
  deadline?: string;
  started_at?: string;
  finished_at?: string;
}

// Update the Output interface to include history details
export interface Output {
  id: number;
  template: number;
  phase: number;
  description?: string;
  status: string;
  user?: number | null;
  document?: number | null;
  history_id: string;
  template_details?: OutputTemplate;
  user_details?: User;
  documents?: Document[];
  history_details?: History;
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
  event: string // Raw event data as saved in DB
  table_name: string
  created_at: string
  started_at?: string | null
  updated_at?: string | null
  deadline?: string | null
  finished_at?: string | null
  events?: Array<HistoryEvent> // Parsed events
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
  projects: Project[]
  todos: {
    id: number
    output_id: number
    output_name: string
    phase_id: number
    phase_name: string
    project_id: number
    project_name: string
    permission: string
    status: string
  }[]
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

export interface AuthResponse {
  token: string
  user: {
    id: number
    username: string
    is_staff: boolean
    is_superuser: boolean
    first_name: string
    last_name: string
    email: string
  }
}

export interface ApiError {
  error: string
}

// Add PaginatedResponse interface for handling paginated API responses
export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface PPAPElement {
  id: number
  name: string
  description?: string
  level: string
  level_1_required?: boolean
  level_2_required?: boolean
  level_3_required?: boolean
  level_4_required?: boolean
  level_5_required?: boolean
  is_active?: boolean
}

export interface PPAPElementResponse {
  count: number
  next: string | null
  previous: string | null
  results: PPAPElement[]
}

// Department related types
export interface Department {
  id: number
  name: string
  history_id: string
  responsible: number | null
  responsible_details?: User
  members?: Array<{
    id: number
    first_name: string
    last_name: string
    is_user: boolean
  }>
  teams?: Array<{
    id: number
    name: string
  }>
}

export interface DepartmentCreateRequest {
  name: string
  responsible?: number | null
}

export interface DepartmentUpdateRequest {
  name?: string
  responsible?: number | null
}
