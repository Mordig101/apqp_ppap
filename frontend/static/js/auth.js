/**
 * APQP/PPAP Manager Authentication Module
 *
 * This module handles authentication-related functionality.
 */

// Import the api module (assuming it's in a separate file)
import * as api from "./api.js"

class AuthManager {
  /**
   * Create a new authentication manager
   */
  constructor() {
    this.currentUser = null
    this.isAuthenticated = false
    this.checkAuthStatus()
  }

  /**
   * Check if user is authenticated
   * @returns {Promise} Promise resolving to authentication status
   */
  async checkAuthStatus() {
    try {
      // Try to get user permissions as a way to check auth status
      const response = await api.getUserPermissions()
      this.isAuthenticated = true
      this.currentUser = {
        permissions: response.permissions,
        authorization: response.authorization,
      }
      return true
    } catch (error) {
      this.isAuthenticated = false
      this.currentUser = null
      return false
    }
  }

  /**
   * Log in user
   * @param {string} username - Username
   * @param {string} password - Password
   * @returns {Promise} Promise resolving to login result
   */
  async login(username, password) {
    try {
      const formData = new FormData()
      formData.append("username", username)
      formData.append("password", password)

      const response = await fetch("/login/", {
        method: "POST",
        body: formData,
        headers: {
          "X-CSRFToken": api.getCookie("csrftoken"),
        },
      })

      if (response.ok) {
        // Check if redirected to login page (failed login)
        if (response.url.includes("login")) {
          throw new Error("Invalid credentials")
        }

        // Successfully logged in
        await this.checkAuthStatus()
        return true
      } else {
        throw new Error("Login failed")
      }
    } catch (error) {
      console.error("Login error:", error)
      throw error
    }
  }

  /**
   * Log out user
   * @returns {Promise} Promise resolving to logout result
   */
  async logout() {
    try {
      const response = await fetch("/logout/", {
        method: "POST",
        headers: {
          "X-CSRFToken": api.getCookie("csrftoken"),
        },
      })

      if (response.ok) {
        this.isAuthenticated = false
        this.currentUser = null
        return true
      } else {
        throw new Error("Logout failed")
      }
    } catch (error) {
      console.error("Logout error:", error)
      throw error
    }
  }

  /**
   * Check if user has permission for an action
   * @param {string} action - Action (create, read, update, delete)
   * @param {string} entityType - Entity type (project, ppap, phase, output, etc.)
   * @param {number} entityId - Entity ID (optional)
   * @returns {boolean} Whether user has permission
   */
  hasPermission(action, entityType, entityId = null) {
    if (!this.isAuthenticated || !this.currentUser) {
      return false
    }

    const { authorization } = this.currentUser

    // Admin can do anything
    if (authorization.authorization_level === "admin") {
      return true
    }

    // Check permissions
    const permissions = authorization.permissions

    if (action === "create" && permissions.can_create.includes(entityType)) {
      return true
    }

    if (action === "read" && permissions.can_read.includes(entityType)) {
      return true
    }

    if (action === "update" && permissions.can_update.includes(entityType)) {
      return true
    }

    if (action === "delete" && permissions.can_delete.includes(entityType)) {
      return true
    }

    return false
  }
}

// Create global auth manager instance
const auth = new AuthManager()

// Add login form handler
document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.querySelector('form[action*="login"]')

  if (loginForm) {
    loginForm.addEventListener("submit", async function (e) {
      e.preventDefault()

      const username = this.querySelector('input[name="username"]').value
      const password = this.querySelector('input[name="password"]').value

      try {
        await auth.login(username, password)
        window.location.href = "/"
      } catch (error) {
        alert("Login failed: " + error.message)
      }
    })
  }
})
