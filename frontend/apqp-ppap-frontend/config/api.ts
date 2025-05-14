const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

export const API_ENDPOINTS = {
  // Project endpoints
  projects: `${API_BASE_URL}/projects/`,
  project: (id: number) => `${API_BASE_URL}/projects/${id}/`,
  projectHistory: (id: number) => `${API_BASE_URL}/projects/${id}/history/`,
  updateProjectHistory: (id: number) => `${API_BASE_URL}/projects/${id}/update_history/`,
  projectDetails: (id: number) => `${API_BASE_URL}/projects/${id}/details/`,
  archiveProject: (id: number) => `${API_BASE_URL}/projects/${id}/archive/`,

  ppaps: `${API_BASE_URL}/ppaps/`,
  phases: `${API_BASE_URL}/phases/`,
  
  // Update output endpoints  
  outputs: `${API_BASE_URL}/outputs/`,
  output: (id: number) => `${API_BASE_URL}/outputs/${id}/`,
  outputHistory: (id: number) => `${API_BASE_URL}/outputs/${id}/history/`,
  updateOutputHistory: (id: number) => `${API_BASE_URL}/outputs/${id}/update_history/`,
  
  // Document endpoints
  documents: `${API_BASE_URL}/documents/`,
  document: (id: number) => `${API_BASE_URL}/documents/${id}/`,
  documentHistory: (id: number) => `${API_BASE_URL}/documents/${id}/history/`,
  updateDocumentHistory: (id: number) => `${API_BASE_URL}/documents/${id}/update_history/`,
  documentsByOutput: (outputId: number) => `${API_BASE_URL}/documents/by_output/?output_id=${outputId}`,
  documentsByStatus: (status: string) => `${API_BASE_URL}/documents/by_status/?status=${status}`,
  updateDocumentFile: (id: number) => `${API_BASE_URL}/documents/${id}/update_file/`,
  changeDocumentOutput: (id: number) => `${API_BASE_URL}/documents/${id}/change_output/`,
  
  users: `${API_BASE_URL}/users/`,
  clients: `${API_BASE_URL}/clients/`,
  teams: `${API_BASE_URL}/teams/`,
  history: `${API_BASE_URL}/history/`,
  persons: `${API_BASE_URL}/persons/`,
  contacts: `${API_BASE_URL}/contacts/`,
  departments: `${API_BASE_URL}/departments/`,
  phaseTemplates: `${API_BASE_URL}/phase-templates/`,
  outputTemplates: `${API_BASE_URL}/output-templates/`,
  ppapElements: `${API_BASE_URL}/ppap-elements/`,
  authorizations: `${API_BASE_URL}/authorizations/`,
  todos: `${API_BASE_URL}/todos/`,
  authLogin: `${API_BASE_URL}/auth/login/`,
  authLogout: `${API_BASE_URL}/auth/logout/`,
  authUser: `${API_BASE_URL}/auth/user/`,
  dashboard: `${API_BASE_URL}/dashboard/`,
  userPermissions: `${API_BASE_URL}/user-permissions/`,
  changeStatus: `${API_BASE_URL}/change-status/`,
  assignPermission: `${API_BASE_URL}/assign-permission/`,
  assignPhaseResponsible: `${API_BASE_URL}/assign-phase-responsible/`,
  nestedHistory: `${API_BASE_URL}/projects/:projectId/nested-history/`,
  allNestedHistory: `${API_BASE_URL}/projects/nested-history/`,
  projectsHistory: `${API_BASE_URL}/projects-history/all-projects-history/`,
  
  // Add new endpoint for phase history update
  updatePhaseHistory: `${API_BASE_URL}/phases/:phaseId/update_history/`,

  // PPAP endpoints
  ppap: (id: number) => `${API_BASE_URL}/ppaps/${id}/`,
  ppapHistory: (id: number) => `${API_BASE_URL}/ppaps/${id}/history/`,
  ppapDetails: (id: number) => `${API_BASE_URL}/ppaps/${id}/details/`,
  ppapCustomerSubmission: (id: number) => `${API_BASE_URL}/ppaps/${id}/customer_submission/`,
  ppapCustomerDecision: (id: number) => `${API_BASE_URL}/ppaps/${id}/customer_decision/`,
  ppapsByProject: (projectId: number) => `${API_BASE_URL}/ppaps/?project=${projectId}`,

  // Todo endpoints
  todo: (id: number) => `${API_BASE_URL}/todos/${id}/`,
  todoHistory: (id: number) => `${API_BASE_URL}/todos/${id}/history/`,
  updateTodoHistory: (id: number) => `${API_BASE_URL}/todos/${id}/update_history/`,
  todosByUser: (userId: number) => `${API_BASE_URL}/todos/?user_id=${userId}`,
  todosByOutput: (outputId: number) => `${API_BASE_URL}/todos/by_output/?output_id=${outputId}`,
  todosByStatus: (status: string) => `${API_BASE_URL}/todos/by_status/?status=${status}`,
  changeTodoStatus: (id: number) => `${API_BASE_URL}/todos/${id}/change_status/`,
  reassignTodo: (id: number) => `${API_BASE_URL}/todos/${id}/reassign/`,
  userTodos: `${API_BASE_URL}/todos/user_todos/`,
  pendingTodos: `${API_BASE_URL}/todos/pending_todos/`,
  bulkCreateTodos: `${API_BASE_URL}/todos/bulk_create/`,
}
