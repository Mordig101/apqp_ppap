"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { projectApi } from "@/config/api-utils"
import type { Project, Phase } from "@/config/api-types"
import { formatDate, getStatusColor, calculateProgress } from "@/lib/utils"

export default function ProgressPage() {
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

  // Calculate phase progress based on completed outputs
  const getPhaseProgress = (phase: Phase) => {
    if (!phase.outputs || phase.outputs.length === 0) {
      return 0
    }

    const completedOutputs = phase.outputs.filter(
      (output) => output.status === "Completed" || output.status === "Approved",
    ).length

    return calculateProgress(completedOutputs, phase.outputs.length)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Progress</h1>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
          </div>
        ) : error ? (
          <div className="p-4 text-red-600 bg-red-100 rounded-md">{error}</div>
        ) : project ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Project Progress Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Overall Progress</span>
                      <span className="text-sm font-medium">
                        {project.ppap_details?.phases
                          ? `${project.ppap_details.phases.filter((p) => p.status === "Completed").length} / ${project.ppap_details.phases.length} Phases`
                          : "0 / 0 Phases"}
                      </span>
                    </div>
                    <Progress
                      value={
                        project.ppap_details?.phases
                          ? calculateProgress(
                              project.ppap_details.phases.filter((p) => p.status === "Completed").length,
                              project.ppap_details.phases.length,
                            )
                          : 0
                      }
                      className="h-2"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Current Status</span>
                      <Badge className={getStatusColor(project.status)}>{project.status}</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {project.ppap_details?.phases && project.ppap_details.phases.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Phase Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Phase</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Progress</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>Deadline</TableHead>
                        <TableHead>Responsible</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {project.ppap_details.phases.map((phase) => (
                        <TableRow key={phase.id}>
                          <TableCell className="font-medium">
                            {phase.template_details?.name || `Phase ${phase.id}`}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(phase.status)}>{phase.status}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="w-32">
                              <Progress value={getPhaseProgress(phase)} className="h-2" />
                              <span className="text-xs text-gray-500 mt-1 block">{getPhaseProgress(phase)}%</span>
                            </div>
                          </TableCell>
                          <TableCell>{formatDate(phase.started_at)}</TableCell>
                          <TableCell>{formatDate(phase.deadline)}</TableCell>
                          <TableCell>{phase.responsible_details?.username || "Unassigned"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No phases found for this project</p>
              </div>
            )}

            {/* Alerts and Notifications */}
            <Card>
              <CardHeader>
                <CardTitle>Alerts & Notifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                    <h3 className="font-medium text-yellow-800">Approaching Deadline</h3>
                    <p className="text-yellow-700 mt-1">Phase "Product Design and Development" is due in 5 days</p>
                  </div>

                  <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                    <h3 className="font-medium text-red-800">Overdue Task</h3>
                    <p className="text-red-700 mt-1">Output "Design FMEA" is overdue by 2 days</p>
                  </div>

                  <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                    <h3 className="font-medium text-green-800">Completed Recently</h3>
                    <p className="text-green-700 mt-1">Output "Product/Process Benchmark" was completed yesterday</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">Project not found</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
