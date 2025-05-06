"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, FolderKanban, Settings, ChevronDown, ChevronRight, Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useMobile } from "@/hooks/use-mobile"

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const isMobile = useMobile()
  const [isOpen, setIsOpen] = useState(!isMobile)
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({
    projects: pathname.includes("/projects"),
    settings: pathname.includes("/settings"),
  })

  const toggleSidebar = () => {
    setIsOpen(!isOpen)
  }

  const toggleItem = (item: string) => {
    setExpandedItems({
      ...expandedItems,
      [item]: !expandedItems[item],
    })
  }

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(`${path}/`)
  }

  return (
    <>
      {isMobile && (
        <button onClick={toggleSidebar} className="fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow-md">
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      )}

      <div
        className={cn(
          "fixed top-0 left-0 z-40 h-full bg-white border-r transition-all duration-300 ease-in-out",
          isOpen ? "w-64" : "w-0",
          isMobile && isOpen ? "shadow-xl" : "",
          className,
        )}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b">
            <h2 className="text-xl font-bold">APQP/PPAP Manager</h2>
          </div>

          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            <Link
              href="/dashboard"
              className={cn(
                "flex items-center p-2 rounded-md hover:bg-gray-100",
                isActive("/dashboard") && "bg-gray-100 font-medium",
              )}
            >
              <LayoutDashboard className="mr-2 h-5 w-5" />
              <span>Dashboard</span>
            </Link>

            <div>
              <button
                onClick={() => toggleItem("projects")}
                className={cn(
                  "flex items-center justify-between w-full p-2 rounded-md hover:bg-gray-100",
                  (isActive("/projects") || expandedItems.projects) && "bg-gray-100 font-medium",
                )}
              >
                <div className="flex items-center">
                  <FolderKanban className="mr-2 h-5 w-5" />
                  <span>Projects</span>
                </div>
                {expandedItems.projects ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>

              {expandedItems.projects && (
                <div className="ml-6 mt-1 space-y-1">
                  <Link
                    href="/projects"
                    className={cn(
                      "block p-2 rounded-md hover:bg-gray-100",
                      isActive("/projects") && !pathname.includes("/projects/") && "bg-gray-100 font-medium",
                    )}
                  >
                    All Projects
                  </Link>
                  {pathname.includes("/projects/") && pathname !== "/projects" && (
                    <div className="space-y-1">
                      <Link
                        href={pathname.split("/").slice(0, 3).join("/")}
                        className={cn(
                          "block p-2 rounded-md hover:bg-gray-100",
                          pathname.split("/").length === 3 && "bg-gray-100 font-medium",
                        )}
                      >
                        Project Overview
                      </Link>
                      <Link
                        href={`${pathname.split("/").slice(0, 3).join("/")}/workspace`}
                        className={cn(
                          "block p-2 rounded-md hover:bg-gray-100",
                          pathname.includes("/workspace") && "bg-gray-100 font-medium",
                        )}
                      >
                        Workspace
                      </Link>
                      <Link
                        href={`${pathname.split("/").slice(0, 3).join("/")}/statistics`}
                        className={cn(
                          "block p-2 rounded-md hover:bg-gray-100",
                          pathname.includes("/statistics") && "bg-gray-100 font-medium",
                        )}
                      >
                        Statistics
                      </Link>
                      <Link
                        href={`${pathname.split("/").slice(0, 3).join("/")}/progress`}
                        className={cn(
                          "block p-2 rounded-md hover:bg-gray-100",
                          pathname.includes("/progress") && "bg-gray-100 font-medium",
                        )}
                      >
                        Progress
                      </Link>
                      <Link
                        href={`${pathname.split("/").slice(0, 3).join("/")}/settings`}
                        className={cn(
                          "block p-2 rounded-md hover:bg-gray-100",
                          pathname.includes("/settings") && "bg-gray-100 font-medium",
                        )}
                      >
                        Settings
                      </Link>
                      <Link
                        href={`${pathname.split("/").slice(0, 3).join("/")}/history`}
                        className={cn(
                          "block p-2 rounded-md hover:bg-gray-100",
                          pathname.includes("/history") && "bg-gray-100 font-medium",
                        )}
                      >
                        History
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <button
                onClick={() => toggleItem("settings")}
                className={cn(
                  "flex items-center justify-between w-full p-2 rounded-md hover:bg-gray-100",
                  (isActive("/settings") || expandedItems.settings) && "bg-gray-100 font-medium",
                )}
              >
                <div className="flex items-center">
                  <Settings className="mr-2 h-5 w-5" />
                  <span>Settings</span>
                </div>
                {expandedItems.settings ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>

              {expandedItems.settings && (
                <div className="ml-6 mt-1 space-y-1">
                  <Link
                    href="/settings/users"
                    className={cn(
                      "block p-2 rounded-md hover:bg-gray-100",
                      isActive("/settings/users") && "bg-gray-100 font-medium",
                    )}
                  >
                    Users
                  </Link>
                  <Link
                    href="/settings/teams"
                    className={cn(
                      "block p-2 rounded-md hover:bg-gray-100",
                      isActive("/settings/teams") && "bg-gray-100 font-medium",
                    )}
                  >
                    Teams
                  </Link>
                  <Link
                    href="/settings/clients"
                    className={cn(
                      "block p-2 rounded-md hover:bg-gray-100",
                      isActive("/settings/clients") && "bg-gray-100 font-medium",
                    )}
                  >
                    Clients
                  </Link>
                  <Link
                    href="/settings/templates"
                    className={cn(
                      "block p-2 rounded-md hover:bg-gray-100",
                      pathname.includes("/settings/templates") && "bg-gray-100 font-medium",
                    )}
                  >
                    Templates
                  </Link>
                </div>
              )}
            </div>
          </nav>

          <div className="p-4 border-t">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-gray-300 mr-2"></div>
              <div>
                <p className="text-sm font-medium">User Name</p>
                <p className="text-xs text-gray-500">user@example.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isMobile && isOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-30" onClick={toggleSidebar} />}
    </>
  )
}
