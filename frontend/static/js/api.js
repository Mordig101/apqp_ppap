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

  async updateOutput(id, data) {
    return this.request("PUT", `/api/outputs/${id}/`, data)
  }

  // Document API methods
  async getDocuments() {
    return this.request("GET", "/api/documents/")
  }

  async uploadDocument(data) {
    return this.request("POST", "/api/documents/", data)
  }

  // User API methods
  async getUsers() {
    return this.request("GET", "/api/users/")
  }

  async createUser(data) {
    return this.request("POST", "/api/users/", data)
  }

  // Custom API methods
  async getDashboard() {
    return this.request("GET", "/api/dashboard/")
  }

  async getUserPermissions() {
    return this.request("GET", "/api/user-permissions/")
  }

  async changeStatus(data) {
    return this.request("POST", "/api/change-status/", data)
  }

  async assignPermission(data) {
    return this.request("POST", "/api/assign-permission/", data)
  }

  async assignPhaseResponsible(data) {
    return this.request("POST", "/api/assign-phase-responsible/", data)
  }

  // Timeline API methods
  async setProjectTimeline(data) {
    return this.request("POST", "/api/set-project-timeline/", data)
  }

  async setPhaseTimeline(data) {
    return this.request("POST", "/api/set-phase-timeline/", data)
  }

  async getTimeline(projectId) {
    return this.request("GET", `/api/timeline/${projectId}/`)
  }
}

// Create global API client instance
const api = new ApiClient()

export { api }
