"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Calendar, Users, Settings, BarChart3, History } from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { projectApi } from "@/config/api-utils"
import type { Project } from "@/config/api-types"
import { calculateProgress } from "@/lib/utils"

export default function ProjectDetailsPage() {
  const params = useParams()
  const projectId = Number(params.projectId)

  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        setLoading(true)

        // Fetch project details
        const projectData = await projectApi.getProject(projectId)
        setProject(projectData)
      } catch (err) {
        console.error("Error fetching project:", err)
        setError(err instanceof Error ? err.message : "Failed to load project details")
      } finally {
        setLoading(false)
      }
    }

    if (projectId) {
      fetchProjectData()
    }
  }, [projectId])

  // Get appropriate color for status badge
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800"
      case "Planning":
        return "bg-blue-100 text-blue-800"
      case "In Progress":
        return "bg-yellow-100 text-yellow-800"
      case "On Hold":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Calculate overall project progress based on phases
  const getProjectProgress = () => {
    if (!project?.ppap_details?.phases || project.ppap_details.phases.length === 0) return 0

    const phases = project.ppap_details.phases
    const completedPhases = phases.filter((phase) => phase.status === "Completed").length
    return calculateProgress(completedPhases, phases.length)
  }

  // Get team members list
  const getTeamMembers = () => {
    if (!project?.team_details?.members) return []
    return project.team_details.members
  }

  // Get current phase
  const getCurrentPhase = () => {
    if (!project?.ppap_details?.phases || project.ppap_details.phases.length === 0) return null

    const inProgressPhase = project.ppap_details.phases.find((phase) => phase.status === "In Progress")
    if (inProgressPhase) return inProgressPhase

    // If no in-progress phase, return the first non-completed phase
    return project.ppap_details.phases.find((phase) => phase.status !== "Completed") || null
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/projects">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">
            {loading ? "Loading..." : project ? project.name : "Project Not Found"}
          </h1>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
          </div>
        ) : error ? (
          <div className="p-4 text-red-600 bg-red-100 rounded-md">
            {error}
            <div className="mt-2">
              <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          </div>
        ) : project ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Client</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium">{project.client_details?.name || "N/A"}</p>
                  {project.client_details?.contact_details && (
                    <div className="mt-2 text-sm text-gray-500">
                      <p>{project.client_details.contact_details.email}</p>
                      <p>{project.client_details.contact_details.phone}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Team</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium">{project.team_details?.name || "N/A"}</p>
                  {project.team_details?.members && project.team_details.members.length > 0 && (
                    <div className="mt-2 text-sm text-gray-500">
                      <p>{project.team_details.members.length} team members</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <Progress value={getProjectProgress()} className="h-2" />
                  <span className="text-xs text-gray-500 mt-1 block">{getProjectProgress()}% Complete</span>
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
                    <p className="mt-1">{project.description || "No description provided."}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Project Status</h3>
                      <Badge className={getStatusColor(project.status)}>{project.status}</Badge>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500">PPAP Level</h3>
                      <p className="mt-1">{project.ppap_details ? `Level ${project.ppap_details.level}` : "No PPAP"}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">PPAP Status</h3>
                      {project.ppap_details ? (
                        <Badge className={getStatusColor(project.ppap_details.status)}>
                          {project.ppap_details.status}
                        </Badge>
                      ) : (
                        <p>No PPAP</p>
                      )}
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Current Phase</h3>
                      <p className="mt-1">{getCurrentPhase()?.template_details?.name || "No active phase"}</p>
                    </div>
                  </div>

                  {project.ppap_details?.phases && project.ppap_details.phases.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Phases</h3>
                      <div className="space-y-2">
                        {project.ppap_details.phases.map((phase) => (
                          <div key={phase.id} className="flex items-center justify-between p-2 border rounded-md">
                            <div>
                              <p className="font-medium">{phase.template_details?.name || `Phase ${phase.id}`}</p>
                              <p className="text-xs text-gray-500">
                                Responsible:{" "}
                                {phase.responsible_details
                                  ? `${phase.responsible_details.person_details?.first_name} ${phase.responsible_details.person_details?.last_name}`
                                  : "Not assigned"}
                              </p>
                            </div>
                            <Badge className={getStatusColor(phase.status)}>{phase.status}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="workspace">
              <TabsList className="grid grid-cols-5 w-full">
                <TabsTrigger value="workspace" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Workspace</span>
                </TabsTrigger>
                <TabsTrigger value="statistics" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Statistics</span>
                </TabsTrigger>
                <TabsTrigger value="progress" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span className="hidden sm:inline">Progress</span>
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Settings</span>
                </TabsTrigger>
                <TabsTrigger value="history" className="flex items-center gap-2">
                  <History className="h-4 w-4" />
                  <span className="hidden sm:inline">History</span>
                </TabsTrigger>
              </TabsList>
              <TabsContent value="workspace" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Workspace</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>Navigate to the workspace to view and manage project phases and outputs.</p>
                    <div className="mt-4">
                      <Link href={`/projects/${project.id}/workspace`}>
                        <Button>Go to Workspace</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="statistics">
                <Card>
                  <CardHeader>
                    <CardTitle>Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>View project statistics and analytics.</p>
                    <div className="mt-4">
                      <Link href={`/projects/${project.id}/statistics`}>
                        <Button>View Statistics</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="progress">
                <Card>
                  <CardHeader>
                    <CardTitle>Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>Track project progress and timelines.</p>
                    <div className="mt-4">
                      <Link href={`/projects/${project.id}/progress`}>
                        <Button>View Progress</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="settings">
                <Card>
                  <CardHeader>
                    <CardTitle>Settings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>Manage project settings and configuration.</p>
                    <div className="mt-4">
                      <Link href={`/projects/${project.id}/settings`}>
                        <Button>Project Settings</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="history">
                <Card>
                  <CardHeader>
                    <CardTitle>History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>View project history and activity log.</p>
                    <div className="mt-4">
                      <Link href={`/projects/${project.id}/history`}>
                        <Button>View History</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">Project not found</p>
            <div className="mt-4">
              <Link href="/projects">
                <Button variant="outline">Back to Projects</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
