// User related types
export interface User {
  id: number;
  username: string;
  authorization: number;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  person: number;
  person_details?: {
    id: number;
    first_name: string;
    last_name: string;
    contact_id: string;
    is_user: boolean;
    role: string | null;
    department: number | null;
    replacer: number | null;
    history_id: string;
    teams?: Array<{
      id: number;
      name: string;
    }>;
    replacer_details?: {
      id: number;
      first_name: string;
      last_name: string;
    } | null;
    history_details?: {
      id: string;
      title: string;
      table_name: string;
      created_at: string;
      started_at: string | null;
      updated_at: string | null;
      deadline: string | null;
      finished_at: string | null;
      events: Array<{
        type: string;
        details: string;
        timestamp: string;
      }>;
    } | null;
  };
  role?: string | null;
  replacer_id?: number | null;
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
export interface Project {
  id: number;
  name: string;
  description?: string;
  client: number;
  team: number;
  status: string;
  ppap?: number;
  history_id: string;
  client_details?: {
    id: number;
    name: string;
  };
  team_details?: {
    id: number;
    name: string;
  };
  ppap_details?: {
    id: number;
    level: number;
    status: string;
    review?: string;
    history_id?: string;
  };
  history_details?: History;
}

export interface ProjectCreateRequest {
  name: string;
  description?: string;
  client_id: number;
  team_id: number;
  ppap_level?: number;
  history?: {
    title?: string;
    deadline?: string;
    started_at?: string;
    finished_at?: string;
  };
}

export interface ProjectUpdateRequest {
  name?: string;
  description?: string;
  client_id?: number;
  team_id?: number;
  status?: string;
  history?: {
    title?: string;
    deadline?: string;
    started_at?: string;
    finished_at?: string;
  };
}

export interface ProjectHistoryUpdateRequest {
  title?: string;
  deadline?: string;
  started_at?: string;
  finished_at?: string;
}

export interface ProjectDetails {
  id: number;
  name: string;
  description: string;
  status: string;
  client: {
    id: number;
    name: string;
  };
  team: {
    id: number;
    name: string;
  };
  ppap: {
    id: number;
    level: number;
    status: string;
    review: string | null;
  } | null;
  phases: PhaseInProject[];
  history: HistoryEvent[];
}

export interface PhaseInProject {
  id: number;
  name: string;
  status: string;
  responsible: string | null;
  responsible_details?: {
    id: number;
    username: string;
    person?: number;
    person_details?: {
      first_name: string;
      last_name: string;
      role: string;
    };
  };
  history_details?: History;
  outputs: OutputInPhase[];
}

export interface OutputInPhase {
  id: number;
  name: string;
  description: string;
  status: string;
  user: number;
  user_details?: {
    id: number;
    username: string;
  };
  history_details?: History;
  documents: DocumentInOutput[];
}

export interface DocumentInOutput {
  id: number;
  name: string;
  version: string;
  status: string;
}

export interface HistoryEvent {
  type: string;
  details: string;
  timestamp: string;
}

// Update the Client interface to match the actual API response structure
export interface Client {
  id: number;
  name: string;
  address: string | null;
  description: string | null;
  code: Record<string, any>;
  contact_id: string;
  history_id: string;
  team?: number | null;
  contact_details?: {
    id: string;
    email: string;
    phone: string;
    address: string;
    type: string;
  } | null;
  team_details?: {
    id: number;
    name: string;
    description: string;
    history_id: string;
    members?: Array<{
      id: number;
      first_name: string;
      last_name: string;
      role: string;
      contact_details?: {
        id: string;
        email: string;
        phone: string;
        address: string;
      } | null;
    }>;
  } | null;
  history_details?: {
    id: string;
    title: string;
    table_name: string;
    created_at: string;
    updated_at: string | null;
    deadline: string | null;
    finished_at: string | null;
    events: Array<{
      type: string;
      details: string;
      timestamp: string;
    }>;
  } | null;
}

export interface Person {
  id: number;
  first_name: string;
  last_name: string;
  contact_id: string;
  is_user: boolean;
  history_id: string;
  department: number | null;
  role?: string; // Add role field
  contact_details?: {
    id?: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  teams?: Array<{
    id: number;
    name: string;
  }>;
}

// Add request interfaces for Person operations
export interface PersonCreateRequest {
  first_name: string;
  last_name: string;
  role?: string;
  department_id?: number;
  is_user?: boolean;
  contact?: {
    email?: string;
    phone?: string;
    address?: string;
  };
  // For user-type persons
  username?: string;
  password?: string;
  authorization_id?: number;
  is_active?: boolean;
}

export interface PersonUpdateRequest {
  first_name?: string;
  last_name?: string;
  role?: string;
  department_id?: number;
  is_user?: boolean;
  contact?: {
    email?: string;
    phone?: string;
    address?: string;
  };
  // For user-type persons
  username?: string;
  password?: string;
  authorization_id?: number;
  is_active?: boolean;
}

// Add new interface for team member
export interface TeamMember {
  id?: number;
  first_name: string;
  last_name: string;
  role: string;
  contact: {
    email: string;
    phone: string;
    address: string;
  };
  // For user creation (user teams only)
  username?: string;
  password?: string;
  is_active?: boolean;
  authorization_id?: number;
}

// Add request interfaces for client operations
export interface ClientCreateRequest {
  name: string;
  address?: string;
  description?: string;
  code?: Record<string, any>;
  contact?: {
    email?: string;
    phone?: string;
    address?: string;
  };
  team?: {
    name: string;
    description?: string;
    is_user_team?: boolean; // Add this property
  };
  team_id?: number;
  team_members?: TeamMember[];
}

export interface ClientUpdateRequest {
  name?: string;
  address?: string;
  description?: string;
  code?: Record<string, any>;
  contact?: {
    email?: string;
    phone?: string;
    address?: string;
  };
  team?: {
    name: string;
    description?: string;
  };
  team_id?: number | null;
  team_members?: TeamMember[];
  replace_all_members?: boolean;
}

// Add or update these interfaces
export interface TeamCreateRequest {
  name: string;
  description?: string;
  is_user_team: boolean;
  members?: TeamMember[];
  replace_all_members?: boolean;
}

export interface TeamUpdateRequest {
  name?: string;
  description?: string;
  is_user_team?: boolean;
  members?: TeamMember[];
  replace_all_members?: boolean;
}

// Update the Team interface to match the actual API response structure
export interface Team {
  id: number;
  name: string;
  description: string;
  history_id: string;
  is_user_team: boolean; // Add this field to match the backend model
  members?: Array<{
    id: number;
    teams?: Array<{
      id: number;
      name: string;
    }>;
    first_name: string;
    last_name: string;
    contact_id: string;
    is_user: boolean;
    history_id: string;
    department: number;
    contact_details?: {
      id: string;
      email: string;
      phone: string;
      address: string;
    };
  }>;
}

// PPAP related types
export interface PPAP {
  id: number;
  project: number;
  level: number;
  status: string;
  review?: string;
  history_id: string;
  history_details?: History;
}

export interface PPAPCreateRequest {
  project: number;
  level: number;
  status?: string;
  history?: {
    title?: string;
    deadline?: string;
    started_at?: string;
    finished_at?: string;
  };
}

export interface PPAPUpdateRequest {
  level?: number;
  status?: string;
  review?: string;
  history?: {
    title?: string;
    deadline?: string;
    started_at?: string;
    finished_at?: string;
  };
}

export interface PPAPHistoryUpdateRequest {
  title?: string;
  deadline?: string;
  started_at?: string;
  finished_at?: string;
}

export interface PPAPDetails {
  id: number;
  project_id: number;
  level: number;
  status: string;
  review: string | null;
  phases: PPAPPhaseDetail[];
}

export interface PPAPPhaseDetail {
  id: number;
  name: string;
  status: string;
  responsible: string | null;
  outputs: PPAPOutputDetail[];
}

export interface PPAPOutputDetail {
  id: number;
  name: string;
  description: string;
  status: string;
  responsible: string | null;
  documents: PPAPDocumentDetail[];
}

export interface PPAPDocumentDetail {
  id: number;
  name: string;
  version: string;
  status: string;
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
// Update the OutputTemplate interface to match the API response
export interface OutputTemplate {
  id: number;
  name: string;
  description?: string;
  configuration: Record<string, any>;
  phase: number;
  ppap_element: number;
  ppap_element_details?: {
    id: number;
    name: string;
    level: string;
  };
  document_type?: string; 
  is_required?: boolean;  
  is_active?: boolean;    
}

// Add this interface for creating output templates
export interface OutputTemplateCreateRequest {
  name: string;
  description?: string;
  phase_id: number;
  ppap_element_id: number;
  document_type?: string;
  is_required?: boolean;
  is_active?: boolean;
  configuration?: Record<string, any>;
}

// Add this interface for updating output templates
export interface OutputTemplateUpdateRequest {
  name?: string;
  description?: string;
  phase_id?: number;
  ppap_element_id?: number;
  phase?: number; // Allow both naming conventions
  ppap_element?: number; // Allow both naming conventions
  document_type?: string;
  is_required?: boolean;
  is_active?: boolean;
  configuration?: Record<string, any>;
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
  id: number;
  name: string;
  description?: string;
  file_path: string;
  file_type: string;
  file_size: number;
  uploader?: number;
  output?: number;
  version: string;
  status: string;
  history_id?: string;
  uploader_details?: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
  };
  history_details?: History;
}

// Document request interfaces
export interface DocumentCreateRequest {
  name: string;
  file: File;  // For FormData
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
}

export interface DocumentUpdateRequest {
  name?: string;
  description?: string;
  version?: string;
  status?: string;
  history?: {
    title?: string;
    deadline?: string;
    started_at?: string;
    finished_at?: string;
  };
}

export interface DocumentHistoryUpdateRequest {
  title?: string;
  deadline?: string;
  started_at?: string;
  finished_at?: string;
}

// History related types
export interface HistoryEvent {
  type: string
  details: string
  timestamp: string
}

export interface History {
  id: string;
  title: string;
  event: string; // Raw event data as saved in DB
  table_name: string;
  created_at: string;
  started_at?: string | null;
  updated_at?: string | null;
  deadline?: string | null;
  finished_at?: string | null;
  events?: Array<HistoryEvent>; // Parsed events
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
  id: number;
  name: string;
  description?: string;
  level: string;
  is_active?: boolean;
  // These fields are added on the frontend for UI convenience
  level_1_required?: boolean;
  level_2_required?: boolean;
  level_3_required?: boolean;
  level_4_required?: boolean;
  level_5_required?: boolean;
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

// Todo related types
export interface Todo {
  id: number;
  user: number;
  output: number;
  permission: number;
  role: string;
  history_id?: string;
  user_details?: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
  };
  output_details?: {
    id: number;
    name: string;
    status: string;
  };
  permission_details?: {
    id: number;
    name: string;
    description: string;
  };
  role_display?: string;
  history_details?: History;
}

export interface TodoCreateRequest {
  user_id: number;
  output_id: number;
  permission_name?: string;
  role?: string;
  history?: {
    title?: string;
    deadline?: string;
    started_at?: string;
    finished_at?: string;
  };
}

export interface TodoUpdateRequest {
  user_id?: number;
  output_id?: number;
  permission_name?: string;
  role?: string;
  history?: {
    title?: string;
    deadline?: string;
    started_at?: string;
    finished_at?: string;
  };
}

export interface TodoHistoryUpdateRequest {
  title?: string;
  deadline?: string;
  started_at?: string;
  finished_at?: string;
}

export interface TodoBulkCreateRequest {
  todos: Array<{
    user_id: number;
    output_id: number;
    permission_name?: string;
    role?: string;
  }>;
}

export interface TodoSummary {
  id: number;
  output_id: number;
  output_name: string;
  phase_id: number;
  phase_name: string;
  project_id: number;
  project_name: string;
  permission: string;
  status: string;
  role: string;
  role_display: string;
}
