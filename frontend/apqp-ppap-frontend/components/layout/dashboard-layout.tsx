"use client"

import type React from "react"

import { useState } from "react"
import { MainSidebar } from "@/components/sidebar/main-sidebar"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useMobile } from "@/hooks/use-mobile"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const isMobile = useMobile()
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile)

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Fixed Sidebar */}
      {(sidebarOpen || !isMobile) && <MainSidebar />}

      {/* Mobile Sidebar Toggle */}
      {isMobile && (
        <Button onClick={toggleSidebar} variant="outline" size="icon" className="fixed top-4 left-4 z-50 md:hidden">
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </Button>
      )}

      {/* Main Content */}
      <div
        className={`${isMobile ? "pt-16" : ""} ${sidebarOpen ? "md:ml-64" : ""} transition-all duration-300 min-h-screen`}
      >
        <main className="container mx-auto py-6 px-4 md:px-6">{children}</main>
      </div>

      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={toggleSidebar} />}
    </div>
  )
}
