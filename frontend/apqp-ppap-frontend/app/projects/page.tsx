"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { PlusCircle, Search } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { projectApi } from "@/config/api-utils"
import type { Project } from "@/config/api-types"
import { formatDate, getStatusColor } from "@/lib/utils"

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await projectApi.getAllProjects()
        setProjects(data)
      } catch (err) {
        console.error("Error fetching projects:", err)
        setError("Failed to load projects")
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [])

  const filteredProjects = projects.filter(
    (project) =>
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.client_details?.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-3xl font-bold">Projects</h1>

          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="text"
                placeholder="Search projects..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Projects</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
              </div>
            ) : error ? (
              <div className="p-4 text-red-600 bg-red-100 rounded-md">{error}</div>
            ) : filteredProjects.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No projects found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Phase</TableHead>
                      <TableHead>Progression</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>PPAP</TableHead>
                      <TableHead>Team</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>Deadline</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProjects.map((project) => (
                      <TableRow key={project.id}>
                        <TableCell>
                          <Link href={`/projects/${project.id}`} className="text-blue-600 hover:underline font-medium">
                            {project.name}
                          </Link>
                        </TableCell>
                        <TableCell>{project.client_details?.name || "N/A"}</TableCell>
                        <TableCell>
                          {project.ppap_details?.phases && project.ppap_details.phases.length > 0
                            ? project.ppap_details.phases[0].template_details?.name
                            : "Not started"}
                        </TableCell>
                        <TableCell className="w-32">
                          <Progress value={getProjectProgress(project)} className="h-2" />
                          <span className="text-xs text-gray-500 mt-1 block">{getProjectProgress(project)}%</span>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(project.status)}>{project.status}</Badge>
                        </TableCell>
                        <TableCell>{project.ppap_details ? `Level ${project.ppap_details.level}` : "N/A"}</TableCell>
                        <TableCell>{project.team_details?.name || "N/A"}</TableCell>
                        <TableCell>{formatDate(project.ppap_details?.phases?.[0]?.started_at)}</TableCell>
                        <TableCell>{formatDate(project.ppap_details?.phases?.[0]?.deadline)}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                              Edit
                            </Button>
                            <Button variant="outline" size="sm" className="text-red-600">
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
