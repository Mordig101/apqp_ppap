"use client"

import { Progress } from "@/components/ui/progress"

import { useEffect, useState } from "react"
import Link from "next/link"
import { fetchApi } from "@/config/api-utils"
import type { Project } from "@/config/api-types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Calendar, Users, Settings, BarChart3, History } from "lucide-react"

interface ProjectDetailsPageProps {
  params: {
    projectId: string
  }
}

export default function ProjectDetailsPage({ params }: ProjectDetailsPageProps) {
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true)
        const data = await fetchApi<Project>(`/projects/${params.projectId}/`)
        setProject(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch project")
        console.error("Error fetching project:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchProject()
  }, [params.projectId])

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
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return <div className="text-center py-10">Loading project details...</div>
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">{error}</div>
  }

  if (!project) {
    return <div className="text-center py-10">Project not found</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/projects">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">{project.name}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <Progress value={50} className="h-2" />
            <span className="text-xs text-gray-500 mt-1 block">50% Complete</span>
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
                <h3 className="text-sm font-medium text-gray-500">PPAP Status</h3>
                {project.ppap_details ? (
                  <Badge className={getStatusColor(project.ppap_details.status)}>{project.ppap_details.status}</Badge>
                ) : (
                  <p>No PPAP</p>
                )}
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Created</h3>
                <p className="mt-1">
                  {project.ppap_details?.phases && project.ppap_details.phases.length > 0
                    ? project.ppap_details.phases[0].template_details?.name
                    : "No phases started"}
                </p>
              </div>
            </div>
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
    </div>
  )
}
