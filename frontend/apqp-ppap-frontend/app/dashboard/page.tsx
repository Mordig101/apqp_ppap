"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { fetchApi } from "@/config/api-utils"
import type { DashboardResponse } from "@/config/api-types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true)
        const data = await fetchApi<DashboardResponse>("/dashboard/")
        setDashboardData(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch dashboard data")
        console.error("Error fetching dashboard data:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboard()
  }, [])

  // Get appropriate color for status badge
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Planning":
        return "bg-blue-100 text-blue-800"
      case "In Progress":
        return "bg-yellow-100 text-yellow-800"
      case "On Hold":
        return "bg-orange-100 text-orange-800"
      case "Completed":
        return "bg-green-100 text-green-800"
      case "Archived":
        return "bg-gray-100 text-gray-800"
      case "Not Started":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Prepare the content that will go inside the layout
  const dashboardContent = (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Projects</CardTitle>
          </CardHeader>
          <CardContent>
            {!dashboardData || !dashboardData.projects || dashboardData.projects.length === 0 ? (
              <p>No projects available</p>
            ) : (
              <div className="space-y-4">
                {dashboardData.projects.slice(0, 5).map((project) => (
                  <div key={project.id} className="flex justify-between items-center">
                    <div>
                      <Link href={`/projects/${project.id}`} className="font-medium hover:underline">
                        {project.name}
                      </Link>
                      <p className="text-sm text-gray-500">{project.client_details?.name}</p>
                    </div>
                    <Badge className={getStatusColor(project.status)}>{project.status}</Badge>
                  </div>
                ))}
                <div className="pt-2">
                  <Link href="/projects">
                    <Button variant="outline" className="w-full">
                      View All Projects
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>My Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            {!dashboardData || !dashboardData.todos || dashboardData.todos.length === 0 ? (
              <p>No tasks assigned to you</p>
            ) : (
              <div className="space-y-4">
                {dashboardData.todos.slice(0, 5).map((todo) => (
                  <div key={todo.id} className="flex justify-between items-center">
                    <div>
                      <Link href={`/projects/${todo.project_id}/workspace`} className="font-medium hover:underline">
                        {todo.output_name}
                      </Link>
                      <p className="text-sm text-gray-500">{todo.project_name}</p>
                    </div>
                    <Badge className={getStatusColor(todo.status)}>{todo.status}</Badge>
                  </div>
                ))}
                <div className="pt-2">
                  <Link href="/tasks">
                    <Button variant="outline" className="w-full">
                      View All Tasks
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {dashboardData?.projects?.length || 0}
            </div>
            <p className="text-sm text-gray-500">Total projects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {dashboardData?.projects?.filter((p) => p.status === "In Progress").length || 0}
            </div>
            <p className="text-sm text-gray-500">Projects in progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {dashboardData?.todos?.length || 0}
            </div>
            <p className="text-sm text-gray-500">Assigned to you</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  // Display loading or error states inside the layout too
  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-10">Loading dashboard...</div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="text-center py-10 text-red-500">{error}</div>
      </DashboardLayout>
    )
  }

  // Return the dashboard content wrapped in the layout
  return <DashboardLayout>{dashboardContent}</DashboardLayout>
}