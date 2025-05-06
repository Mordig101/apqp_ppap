"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { projectApi } from "@/config/api-utils"
import type { Project } from "@/config/api-types"

export default function StatisticsPage() {
  const params = useParams()
  const projectId = Number(params.projectId)

  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const data = await projectApi.getProject(projectId)
        setProject(data)
      } catch (err) {
        console.error("Error fetching project:", err)
        setError("Failed to load project details")
      } finally {
        setLoading(false)
      }
    }

    if (projectId) {
      fetchProject()
    }
  }, [projectId])

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Statistics</h1>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
          </div>
        ) : error ? (
          <div className="p-4 text-red-600 bg-red-100 rounded-md">{error}</div>
        ) : project ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Phase Completion</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">
                  Statistics visualization will be implemented here, showing phase completion rates.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Output Status</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">
                  Statistics visualization will be implemented here, showing output status distribution.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Timeline Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">
                  Statistics visualization will be implemented here, showing project timeline and milestones.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Team Contribution</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">
                  Statistics visualization will be implemented here, showing team member contributions.
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">Project not found</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
