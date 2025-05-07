/**
 * APQP/PPAP Manager API Client
 *
 * This module provides a client for interacting with the APQP/PPAP Manager API.
 */

class ApiClient {
  /**
   * Create a new API client
   */
  constructor() {
    this.baseUrl = ""
    this.csrfToken = this.getCookie("csrftoken")
  }

  /**
   * Get CSRF token from cookies
   * @param {string} name - Cookie name
   * @returns {string} Cookie value
   */
  getCookie(name) {
    let cookieValue = null
    if (document.cookie && document.cookie !== "") {
      const cookies = document.cookie.split(";")
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim()
        if (cookie.substring(0, name.length + 1) === name + "=") {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1))
          break
        }
      }
    }
    return cookieValue
  }

  /**
   * Make an API request
   * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request data (for POST, PUT)
   * @returns {Promise} Promise resolving to response data
   */
  async request(method, endpoint, data = null) {
    const url = this.baseUrl + endpoint
    const options = {
      method: method,
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": this.csrfToken,
      },
    }

    if (data && (method === "POST" || method === "PUT")) {
      options.body = JSON.stringify(data)
    }

    try {
      const response = await fetch(url, options)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP error ${response.status}`)
      }

      return await response.json().catch(() => ({}))
    } catch (error) {
      console.error("API request failed:", error)
      throw error
    }
  }

  // Project API methods
  async getProjects() {
    return this.request("GET", "/api/projects/")
  }

  async getProject(id) {
    return this.request("GET", `/api/projects/${id}/`)
  }

  async createProject(data) {
    return this.request("POST", "/api/projects/", data)
  }

  async updateProject(id, data) {
    return this.request("PUT", `/api/projects/${id}/`, data)
  }

  async deleteProject(id) {
    return this.request("DELETE", `/api/projects/${id}/`)
  }

  // PPAP API methods
  async getPPAPs() {
    return this.request("GET", "/api/ppaps/")
  }

  async getPPAP(id) {
    return this.request("GET", `/api/ppaps/${id}/`)
  }

  async createPPAP(data) {
    return this.request("POST", "/api/ppaps/", data)
  }

  async updatePPAP(id, data) {
    return this.request("PUT", `/api/ppaps/${id}/`, data)
  }

  // Phase API methods
  async getPhases() {
    return this.request("GET", "/api/phases/")
  }

  async getPhase(id) {
    return this.request("GET", `/api/phases/${id}/`)
  }

  async createPhase(data) {
    return this.request("POST", "/api/phases/", data)
  }

  async updatePhase(id, data) {
    return this.request("PUT", `/api/phases/${id}/`, data)
  }

  // Output API methods
  async getOutputs() {
    return this.request("GET", "/api/outputs/")
  }

  async getOutput(id) {
    return this.request("GET", `/api/outputs/${id}/`)
  }

  async createOutput(data) {
    return this.request("POST", "/api/outputs/", data)
  }

  async updateOutput(id, data) {
    return this.request("PUT", `/api/outputs/${id}/`, data)
  }

  // Document API methods
  async getDocuments() {
    return this.request("GET", "/api/documents/")
  }

  async getDocument(id) {
    return this.request("GET", `/api/documents/${id}/`)
  }

  async createDocument(data) {
    return this.request("POST", "/api/documents/", data)
  }

  async updateDocument(id, data) {
    return this.request("PUT", `/api/documents/${id}/`, data)
  }

  // Team API methods
  async getTeams() {
    return this.request("GET", "/api/teams/")
  }

  async getTeam(id) {
    return this.request("GET", `/api/teams/${id}/`)
  }

  async createTeam(data) {
    return this.request("POST", "/api/teams/", data)
  }

  async updateTeam(id, data) {
    return this.request("PUT", `/api/teams/${id}/`, data)
  }

  async addTeamMember(teamId, personId) {
    return this.request("POST", `/api/teams/${teamId}/add_member/`, { person_id: personId })
  }

  async removeTeamMember(teamId, personId) {
    return this.request("POST", `/api/teams/${teamId}/remove_member/`, { person_id: personId })
  }

  // Person API methods
  async getPersons() {
    return this.request("GET", "/api/persons/")
  }

  async getPerson(id) {
    return this.request("GET", `/api/persons/${id}/`)
  }

  async createPerson(data) {
    return this.request("POST", "/api/persons/", data)
  }

  async updatePerson(id, data) {
    return this.request("PUT", `/api/persons/${id}/`, data)
  }

  async addPersonToTeam(personId, teamId) {
    return this.request("POST", `/api/persons/${personId}/add_to_team/`, { team_id: teamId })
  }

  async removePersonFromTeam(personId, teamId) {
    return this.request("POST", `/api/persons/${personId}/remove_from_team/`, { team_id: teamId })
  }

  async deletePerson(id) {
    return this.request("DELETE", `/api/persons/${id}/`)
  }

  // Department API methods
  async getDepartments() {
    return this.request("GET", "/api/departments/")
  }

  async getDepartment(id) {
    return this.request("GET", `/api/departments/${id}/`)
  }

  async createDepartment(data) {
    return this.request("POST", "/api/departments/", data)
  }

  async updateDepartment(id, data) {
    return this.request("PUT", `/api/departments/${id}/`, data)
  }

  async getDepartmentMembers(id) {
    return this.request("GET", `/api/departments/${id}/members/`)
  }

  async deleteDepartment(id) {
    return this.request("DELETE", `/api/departments/${id}/`)
  }

  async getDepartmentTeams(id) {
    return this.request("GET", `/api/departments/${id}/teams/`)
  }

  // Contact API methods
  async getContacts() {
    return this.request("GET", "/api/contacts/")
  }

  async getContact(id) {
    return this.request("GET", `/api/contacts/${id}/`)
  }

  async createContact(data) {
    return this.request("POST", "/api/contacts/", data)
  }

  async updateContact(id, data) {
    return this.request("PUT", `/api/contacts/${id}/`, data)
  }

  async deleteContact(id) {
    return this.request("DELETE", `/api/contacts/${id}/`)
  }

  async getContactsByType(type) {
    return this.request("GET", `/api/contacts/by_type/?type=${type}`)
  }

  // Client API methods
  async getClients() {
    return this.request("GET", "/api/clients/")
  }

  async getClient(id) {
    return this.request("GET", `/api/clients/${id}/`)
  }

  async createClient(data) {
    return this.request("POST", "/api/clients/", data)
  }

  async updateClient(id, data) {
    return this.request("PUT", `/api/clients/${id}/`, data)
  }

  async deleteClient(id) {
    return this.request("DELETE", `/api/clients/${id}/`)
  }

  async getClientProjects(id) {
    return this.request("GET", `/api/clients/${id}/projects/`)
  }

  // Template API methods
  async getPhaseTemplates() {
    return this.request("GET", "/api/phase-templates/")
  }

  async getPhaseTemplate(id) {
    return this.request("GET", `/api/phase-templates/${id}/`)
  }

  async createPhaseTemplate(data) {
    return this.request("POST", "/api/phase-templates/", data)
  }

  async updatePhaseTemplate(id, data) {
    return this.request("PUT", `/api/phase-templates/${id}/`, data)
  }

  async deletePhaseTemplate(id) {
    return this.request("DELETE", `/api/phase-templates/${id}/`)
  }

  async getPhaseTemplatesByLevel(level) {
    return this.request("GET", `/api/phase-templates/by_level/?level=${level}`)
  }

  async clonePhaseTemplate(id, data) {
    return this.request("POST", `/api/phase-templates/${id}/clone/`, data)
  }

  async getOutputTemplates() {
    return this.request("GET", "/api/output-templates/")
  }

  async getOutputTemplate(id) {
    return this.request("GET", `/api/output-templates/${id}/`)
  }

  async createOutputTemplate(data) {
    return this.request("POST", "/api/output-templates/", data)
  }

  async updateOutputTemplate(id, data) {
    return this.request("PUT", `/api/output-templates/${id}/`, data)
  }

  async deleteOutputTemplate(id) {
    return this.request("DELETE", `/api/output-templates/${id}/`)
  }

  async getOutputTemplatesByPhase(phaseId) {
    return this.request("GET", `/api/output-templates/by_phase/?phase_id=${phaseId}`)
  }

  async getOutputTemplatesByElement(elementId) {
    return this.request("GET", `/api/output-templates/by_element/?element_id=${elementId}`)
  }

  async cloneOutputTemplate(id, data) {
    return this.request("POST", `/api/output-templates/${id}/clone/`, data)
  }

  // PPAP Element API methods
  async getPPAPElements() {
    return this.request("GET", "/api/ppap-elements/")
  }

  async getPPAPElement(id) {
    return this.request("GET", `/api/ppap-elements/${id}/`)
  }

  async createPPAPElement(data) {
    return this.request("POST", "/api/ppap-elements/", data)
  }

  async updatePPAPElement(id, data) {
    return this.request("PUT", `/api/ppap-elements/${id}/`, data)
  }

  async deletePPAPElement(id) {
    return this.request("DELETE", `/api/ppap-elements/${id}/`)
  }
  
  async getPPAPElementsByLevel(level) {
    return this.request("GET", `/api/ppap-elements/by_level/?level=${level}`)
  }

  async seedPPAPElements() {
    return this.request("POST", "/api/ppap-elements/seed/")
  }

  // Todo API methods
  async getTodos() {
    return this.request("GET", "/api/todos/")
  }

  async getTodo(id) {
    return this.request("GET", `/api/todos/${id}/`)
  }

  async createTodo(data) {
    return this.request("POST", "/api/todos/", data)
  }

  async updateTodo(id, data) {
    return this.request("PUT", `/api/todos/${id}/`, data)
  }

  async deleteTodo(id) {
    return this.request("DELETE", `/api/todos/${id}/`)
  }

  async changeTodoStatus(id, status) {
    return this.request("POST", `/api/todos/${id}/change_status/`, { status: status })
  }

  async reassignTodo(id, personId) {
    return this.request("POST", `/api/todos/${id}/reassign/`, { person_id: personId })
  }

  async getTodosByPerson(personId) {
    return this.request("GET", `/api/todos/by_person/?person_id=${personId}`)
  }

  async getTodosByOutput(outputId) {
    return this.request("GET", `/api/todos/by_output/?output_id=${outputId}`)
  }

  async getTodosByStatus(status) {
    return this.request("GET", `/api/todos/by_status/?status=${status}`)
  }

  // History API methods
  async getHistory() {
    return this.request("GET", "/api/history/")
  }

  async getProjectHistory(projectId) {
    return this.request("GET", `/api/history/project/?project_id=${projectId}`)
  }

  async getHistoryRecord(id) {
    return this.request("GET", `/api/history/${id}/`)
  }

  async getUserHistory(userId) {
    return this.request("GET", `/api/history/user/?user_id=${userId}`)
  }

  async getPpapHistory(ppapId) {
    return this.request("GET", `/api/history/ppap/?ppap_id=${ppapId}`)
  }

  async getUserPermissions() {
    return this.request("GET", `/api/user_permissions/`)
  }

  // User API methods
  async getUsers() {
    return this.request("GET", "/api/users/")
  }

  async getUser(id) {
    return this.request("GET", `/api/users/${id}/`)
  }

  async createUser(data) {
    return this.request("POST", "/api/users/", data)
  }

  async updateUser(id, data) {
    return this.request("PUT", `/api/users/${id}/`, data)
  }

  async deleteUser(id) {
    return this.request("DELETE", `/api/users/${id}/`)
  }

  // Add these methods to your ApiClient class in frontend/static/js/api.js

// Authorization API methods
async getAuthorizations() {
  return this.request("GET", "/api/authorizations/")
}

async getAuthorization(id) {
  return this.request("GET", `/api/authorizations/${id}/`)
}

async createAuthorization(data) {
  return this.request("POST", "/api/authorizations/", data)
}

async updateAuthorization(id, data) {
  return this.request("PUT", `/api/authorizations/${id}/`, data)
}

async deleteAuthorization(id) {
  return this.request("DELETE", `/api/authorizations/${id}/`)
}

async assignUserAuthorization(userId, authorizationId) {
  return this.request("POST", "/api/authorizations/assign/", {
    user_id: userId,
    authorization_id: authorizationId
  })
}

}

// Create and export API client instance
const api = new ApiClient()

// Make API client available globally
window.api = api

export { api }
