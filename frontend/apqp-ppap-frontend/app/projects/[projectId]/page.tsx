"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { projectApi } from "@/config/api-utils"
import type { Project } from "@/config/api-types"
import { formatDate, getStatusColor } from "@/lib/utils"

export default function ProjectDetailsPage() {
  const params = useParams()
  const router = useRouter()
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

  // Calculate project progress (simplified for now)
  const getProjectProgress = (project: Project) => {
    // This is a placeholder - in a real app, you'd calculate based on completed phases/outputs
    const statusMap: Record<string, number> = {
      Planning: 10,
      "In Progress": 50,
      "On Hold": 30,
      Completed: 100,
      Archived: 100,
    }

    return statusMap[project.status] || 0
  }

  const navigateToTab = (tab: string) => {
    router.push(`/projects/${projectId}/${tab}`)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
          </div>
        ) : error ? (
          <div className="p-4 text-red-600 bg-red-100 rounded-md">{error}</div>
        ) : project ? (
          <>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold">{project.name}</h1>
                <div className="flex items-center mt-2 space-x-4">
                  <Badge className={getStatusColor(project.status)}>{project.status}</Badge>
                  {project.ppap_details && (
                    <span className="text-sm text-gray-500">PPAP Level {project.ppap_details.level}</span>
                  )}
                </div>
              </div>

              <div className="flex space-x-2">
                <Button variant="outline">Edit Project</Button>
                <Button>Start Phase</Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Client</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium">{project.client_details?.name || "N/A"}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Team</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium">{project.team_details?.name || "N/A"}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <Progress value={getProjectProgress(project)} className="h-2" />
                  <span className="text-xs text-gray-500 mt-1 block">{getProjectProgress(project)}% Complete</span>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Description</h3>
                    <p className="mt-1">{project.description || "No description provided"}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">PPAP Status</h3>
                      <p className="mt-1">
                        {project.ppap_details ? (
                          <Badge className={getStatusColor(project.ppap_details.status)}>
                            {project.ppap_details.status}
                          </Badge>
                        ) : (
                          "No PPAP"
                        )}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Created</h3>
                      <p className="mt-1">{formatDate(project.ppap_details?.phases?.[0]?.created_at) || "Unknown"}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="mt-8">
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="workspace" onClick={() => navigateToTab("workspace")}>
                    Workspace
                  </TabsTrigger>
                  <TabsTrigger value="statistics" onClick={() => navigateToTab("statistics")}>
                    Statistics
                  </TabsTrigger>
                  <TabsTrigger value="progress" onClick={() => navigateToTab("progress")}>
                    Progress
                  </TabsTrigger>
                  <TabsTrigger value="settings" onClick={() => navigateToTab("settings")}>
                    Settings
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Project Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-medium">Current Phase</h3>
                          <p className="text-gray-600 mt-1">
                            {project.ppap_details?.phases && project.ppap_details.phases.length > 0
                              ? project.ppap_details.phases[0].template_details?.name
                              : "No phases started"}
                          </p>
                        </div>

                        <div>
                          <h3 className="font-medium">Next Steps</h3>
                          <ul className="list-disc list-inside text-gray-600 mt-1">
                            <li>Complete current phase outputs</li>
                            <li>Review documentation with team</li>
                            <li>Prepare for next phase transition</li>
                          </ul>
                        </div>

                        <div className="flex justify-end">
                          <Button onClick={() => navigateToTab("workspace")}>Go to Workspace</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">Project not found</p>
            <Link href="/projects" className="text-blue-600 hover:underline mt-2 inline-block">
              Back to Projects
            </Link>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
