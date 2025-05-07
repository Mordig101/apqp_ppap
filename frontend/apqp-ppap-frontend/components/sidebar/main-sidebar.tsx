"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Calendar, ClipboardList, LayoutDashboard, Settings, ChevronDown, ChevronRight, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { authApi, projectApi } from "@/config/api-utils"
import type { Project } from "@/config/api-types"

export function MainSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({
    dashboard: true,
    projects: true,
    settings: true,
  })
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch projects
    const fetchProjects = async () => {
      try {
        setLoading(true)
        const projectsData = await projectApi.getAllProjects()
        setProjects(Array.isArray(projectsData) ? projectsData : [])
      } catch (error) {
        console.error("Error fetching projects:", error)
      } finally {
        setLoading(false)
      }
    }

    // Fetch current user
    const fetchUser = async () => {
      try {
        const userData = await authApi.getCurrentUser()
        setUser(userData)
      } catch (error) {
        console.error("Error fetching user:", error)
      }
    }

    fetchProjects()
    fetchUser()
  }, [])

  useEffect(() => {
    // Check if we're on a project page and set the selected project
    const projectMatch = pathname.match(/\/projects\/([^/]+)/)
    if (projectMatch) {
      const projectId = Number.parseInt(projectMatch[1], 10)
      const project = projects.find((p) => p.id === projectId)
      if (project && (!selectedProject || selectedProject.id !== project.id)) {
        setSelectedProject(project)
      }
    } else if ((pathname === "/projects" || pathname === "/projects/prepare-apqp") && selectedProject) {
      setSelectedProject(null)
    }

    // Open the relevant section based on the pathname without updating state unnecessarily
    const newOpenItems = { ...openItems }
    let hasChanges = false

    if (pathname.startsWith("/dashboard") && !openItems.dashboard) {
      newOpenItems.dashboard = true
      hasChanges = true
    } else if (pathname.startsWith("/projects") && !openItems.projects) {
      newOpenItems.projects = true
      hasChanges = true
    } else if (pathname.startsWith("/settings") && !openItems.settings) {
      newOpenItems.settings = true
      hasChanges = true
    }

    if (hasChanges) {
      setOpenItems(newOpenItems)
    }
  }, [pathname, projects, selectedProject, openItems])

  const toggleSubmenu = (title: string) => {
    setOpenItems((prev) => ({
      ...prev,
      [title]: !prev[title],
    }))
  }

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(path + "/")
  }

  const isProjectSubtabActive = (subtab: string) => {
    if (!selectedProject) return false
    return pathname === `/projects/${selectedProject.id}/${subtab}`
  }

  return (
    <div className="h-screen w-64 bg-background border-r flex flex-col fixed left-0 top-0 z-40">
      <div className="h-16 flex items-center px-4 border-b">
        <ClipboardList className="h-6 w-6 mr-2" />
        <span className="font-bold text-xl">APQP Manager</span>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">Main Navigation</h2>

          {/* Dashboard */}
          <div className="space-y-1">
            <button
              onClick={() => toggleSubmenu("dashboard")}
              className={cn(
                "flex w-full items-center justify-between rounded-md px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                isActive("/dashboard") && "bg-accent text-accent-foreground",
              )}
            >
              <div className="flex items-center">
                <LayoutDashboard className="h-4 w-4 mr-2" />
                <span>Dashboard</span>
              </div>
              {openItems.dashboard ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>

            {openItems.dashboard && (
              <div className="pl-6 space-y-1">
                <Link
                  href="/dashboard"
                  className={cn(
                    "flex w-full items-center rounded-md px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground",
                    pathname === "/dashboard" && "bg-muted font-medium",
                  )}
                >
                  Overview
                </Link>
                <Link
                  href="/dashboard/statistics"
                  className={cn(
                    "flex w-full items-center rounded-md px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground",
                    pathname === "/dashboard/statistics" && "bg-muted font-medium",
                  )}
                >
                  General Statistics
                </Link>
                <Link
                  href="/dashboard/analysis"
                  className={cn(
                    "flex w-full items-center rounded-md px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground",
                    pathname === "/dashboard/analysis" && "bg-muted font-medium",
                  )}
                >
                  General Analysis
                </Link>
              </div>
            )}
          </div>

          {/* Projects */}
          <div className="space-y-1 mt-2">
            <button
              onClick={() => toggleSubmenu("projects")}
              className={cn(
                "flex w-full items-center justify-between rounded-md px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                isActive("/projects") && "bg-accent text-accent-foreground",
              )}
            >
              <div className="flex items-center">
                <ClipboardList className="h-4 w-4 mr-2" />
                <span>Projects</span>
              </div>
              {openItems.projects ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>

            {openItems.projects && !selectedProject && (
              <div className="pl-6 space-y-1">
                <Link
                  href="/projects"
                  className={cn(
                    "flex w-full items-center rounded-md px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground",
                    pathname === "/projects" && "bg-muted font-medium",
                  )}
                >
                  All Projects
                </Link>
                <Link
                  href="/projects/prepare-apqp"
                  className={cn(
                    "flex w-full items-center rounded-md px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground",
                    pathname === "/projects/prepare-apqp" && "bg-muted font-medium",
                  )}
                >
                  Prepare for APQP
                </Link>
              </div>
            )}

            {openItems.projects && selectedProject && (
              <div className="pl-6 space-y-1">
                <div className="px-4 py-2 text-sm font-medium text-muted-foreground">{selectedProject.name}</div>
                <Link
                  href={`/projects/${selectedProject.id}/workspace`}
                  className={cn(
                    "flex w-full items-center rounded-md px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground",
                    isProjectSubtabActive("workspace") && "bg-muted font-medium",
                  )}
                >
                  Workspace
                </Link>
                <Link
                  href={`/projects/${selectedProject.id}/statistics`}
                  className={cn(
                    "flex w-full items-center rounded-md px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground",
                    isProjectSubtabActive("statistics") && "bg-muted font-medium",
                  )}
                >
                  Statistics
                </Link>
                <Link
                  href={`/projects/${selectedProject.id}/progress`}
                  className={cn(
                    "flex w-full items-center rounded-md px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground",
                    isProjectSubtabActive("progress") && "bg-muted font-medium",
                  )}
                >
                  Progress
                </Link>
                <Link
                  href={`/projects/${selectedProject.id}/settings`}
                  className={cn(
                    "flex w-full items-center rounded-md px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground",
                    isProjectSubtabActive("settings") && "bg-muted font-medium",
                  )}
                >
                  Settings
                </Link>
                <Link
                  href={`/projects/${selectedProject.id}/history`}
                  className={cn(
                    "flex w-full items-center rounded-md px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground",
                    isProjectSubtabActive("history") && "bg-muted font-medium",
                  )}
                >
                  History
                </Link>
              </div>
            )}
          </div>

          {/* Calendar */}
          <div className="space-y-1 mt-2">
            <Link
              href="/calendar"
              className={cn(
                "flex w-full items-center rounded-md px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                isActive("/calendar") && "bg-accent text-accent-foreground",
              )}
            >
              <Calendar className="h-4 w-4 mr-2" />
              <span>Calendar</span>
            </Link>
          </div>

          {/* Settings */}
          <div className="space-y-1 mt-2">
            <button
              onClick={() => toggleSubmenu("settings")}
              className={cn(
                "flex w-full items-center justify-between rounded-md px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                isActive("/settings") && "bg-accent text-accent-foreground",
              )}
            >
              <div className="flex items-center">
                <Settings className="h-4 w-4 mr-2" />
                <span>Settings</span>
              </div>
              {openItems.settings ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>

            {openItems.settings && (
              <div className="pl-6 space-y-1">
                <Link
                  href="/settings/general"
                  className={cn(
                    "flex w-full items-center rounded-md px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground",
                    pathname === "/settings/general" && "bg-muted font-medium",
                  )}
                >
                  General
                </Link>
                <Link
                  href="/settings/users"
                  className={cn(
                    "flex w-full items-center rounded-md px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground",
                    pathname === "/settings/users" && "bg-muted font-medium",
                  )}
                >
                  Users & Clients
                </Link>
                <Link
                  href="/settings/templates"
                  className={cn(
                    "flex w-full items-center rounded-md px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground",
                    pathname === "/settings/templates" && "bg-muted font-medium",
                  )}
                >
                  Templates
                </Link>

                <Link
                  href="/settings/history"
                  className={cn(
                    "flex w-full items-center rounded-md px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground",
                    pathname === "/settings/history" && "bg-muted font-medium",
                  )}
                >
                  History
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="border-t p-4">
        {user ? (
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center mr-2">
              <User className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium">{user.username || "User"}</p>
              <p className="text-xs text-muted-foreground">{user.email || ""}</p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">APQP Manager v1.0</p>
        )}
      </div>
    </div>
  )
}
