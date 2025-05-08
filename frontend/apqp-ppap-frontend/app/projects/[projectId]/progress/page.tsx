"use client"

import { useEffect, useState, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { projectApi, changeStatus } from "@/config/api-utils"
import type { Project, Phase } from "@/config/api-types"
import { formatDate, getStatusColor, calculateProgress } from "@/lib/utils"
import {
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronRight,
  BarChart4,
  Calendar,
  Users,
  Filter,
  CheckSquare, 
  UploadCloud,
} from "lucide-react"

export default function ProgressPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = Number(params.projectId)

  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [alerts, setAlerts] = useState<{
    overdue: { phase: Phase; daysOverdue: number }[]
    approaching: { phase: Phase; daysLeft: number }[]
    completed: { phase: Phase; completedDate: string }[]
    bottlenecks: { phase: Phase; reason: string }[]
  }>({
    overdue: [],
    approaching: [],
    completed: [],
    bottlenecks: [],
  })

  // Fetch project data
  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true)
        const data = await projectApi.getProject(projectId)
        setProject(data)

        // Process alerts after getting project data
        processAlerts(data)
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

  // Process alerts based on project data
  const processAlerts = (projectData: Project) => {
    if (!projectData.ppap_details?.phases) return

    const today = new Date()
    const overdue: { phase: Phase; daysOverdue: number }[] = []
    const approaching: { phase: Phase; daysLeft: number }[] = []
    const completed: { phase: Phase; completedDate: string }[] = []
    const bottlenecks: { phase: Phase; reason: string }[] = []

    projectData.ppap_details.phases.forEach((phase) => {
      // Check for overdue phases
      if (phase.deadline && phase.status !== "Completed") {
        const deadlineDate = new Date(phase.deadline)
        if (deadlineDate < today) {
          const daysOverdue = Math.ceil((today.getTime() - deadlineDate.getTime()) / (1000 * 60 * 60 * 24))
          overdue.push({ phase, daysOverdue })
        } else {
          // Check for approaching deadlines (within 7 days)
          const daysLeft = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
          if (daysLeft <= 7) {
            approaching.push({ phase, daysLeft })
          }
        }
      }

      // Check for recently completed phases (within last 7 days)
      if (phase.status === "Completed" && phase.finished_at) {
        const completedDate = new Date(phase.finished_at)
        const daysSinceCompletion = Math.ceil((today.getTime() - completedDate.getTime()) / (1000 * 60 * 60 * 24))
        if (daysSinceCompletion <= 7) {
          completed.push({ phase, completedDate: phase.finished_at })
        }
      }

      // Identify bottlenecks
      if (phase.status === "In Progress" || phase.status === "Blocked") {
        // Check if this phase has dependencies that are not completed
        const hasDependencyIssues = projectData.ppap_details.phases.some(
          (p) => p.order < (phase.template_details?.order || 0) && p.status !== "Completed",
        )

        // Check if phase has no assigned responsible
        const hasNoResponsible = !phase.responsible

        // Check if phase has outputs with issues
        const hasOutputIssues = phase.outputs?.some((o) => o.status === "Rejected" || o.status === "Blocked")

        if (hasDependencyIssues) {
          bottlenecks.push({ phase, reason: "Waiting for previous phases to complete" })
        } else if (hasNoResponsible) {
          bottlenecks.push({ phase, reason: "No responsible person assigned" })
        } else if (hasOutputIssues) {
          bottlenecks.push({ phase, reason: "Contains rejected or blocked outputs" })
        }
      }
    })

    setAlerts({ overdue, approaching, completed, bottlenecks })
  }

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

  // Filter phases based on status
  const filteredPhases = useMemo(() => {
    if (!project?.ppap_details?.phases) return []

    if (!statusFilter) return project.ppap_details.phases

    return project.ppap_details.phases.filter((phase) => phase.status === statusFilter)
  }, [project, statusFilter])

  // Handle phase status change
  const handleStatusChange = async (phaseId: number, newStatus: string) => {
    try {
      await changeStatus("phase", phaseId, newStatus)

      // Refresh project data
      const updatedProject = await projectApi.getProject(projectId)
      setProject(updatedProject)
      processAlerts(updatedProject)
    } catch (err) {
      console.error("Error changing phase status:", err)
      // Show error notification
    }
  }

  // Navigate to phase details
  const navigateToPhase = (phaseId: number) => {
    router.push(`/projects/${projectId}/workspace?phase=${phaseId}`)
  }

  // Calculate overall project progress
  const getOverallProgress = () => {
    if (!project?.ppap_details?.phases) return 0

    const totalPhases = project.ppap_details.phases.length
    if (totalPhases === 0) return 0

    const completedPhases = project.ppap_details.phases.filter((p) => p.status === "Completed").length
    return calculateProgress(completedPhases, totalPhases)
  }

  // Get dependency information for a phase
  const getPhaseDependencies = (phase: Phase) => {
    if (!project?.ppap_details?.phases) return []

    // Find phases that come before this one based on order
    return project.ppap_details.phases.filter(
      (p) =>
        p.template_details?.order &&
        phase.template_details?.order &&
        p.template_details.order < phase.template_details.order,
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Project Progress</h1>

          <div className="flex items-center space-x-2">
            <Select value={statusFilter || ""} onValueChange={(value) => setStatusFilter(value || null)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Not Started">Not Started</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="icon" onClick={() => setStatusFilter(null)}>
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {loading ? (
          <ProgressSkeleton />
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : project ? (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="phases">Phases</TabsTrigger>
              <TabsTrigger value="alerts">Alerts & Notifications</TabsTrigger>
              <TabsTrigger value="bottlenecks">Bottlenecks</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Project Progress Overview</CardTitle>
                  <CardDescription>
                    {project.name} - {project.status}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Overall Progress</span>
                        <span className="text-sm font-medium">
                          {project.ppap_details?.phases
                            ? `${project.ppap_details.phases.filter((p) => p.status === "Completed").length} / ${project.ppap_details.phases.length} Phases`
                            : "0 / 0 Phases"}
                        </span>
                      </div>
                      <Progress value={getOverallProgress()} className="h-2" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Not Started</p>
                              <p className="text-2xl font-bold">
                                {project.ppap_details?.phases?.filter((p) => p.status === "Not Started").length || 0}
                              </p>
                            </div>
                            <Clock className="h-8 w-8 text-muted-foreground" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                              <p className="text-2xl font-bold">
                                {project.ppap_details?.phases?.filter((p) => p.status === "In Progress").length || 0}
                              </p>
                            </div>
                            <BarChart4 className="h-8 w-8 text-blue-500" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Completed</p>
                              <p className="text-2xl font-bold">
                                {project.ppap_details?.phases?.filter((p) => p.status === "Completed").length || 0}
                              </p>
                            </div>
                            <CheckCircle2 className="h-8 w-8 text-green-500" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Blocked</p>
                              <p className="text-2xl font-bold">
                                {project.ppap_details?.phases?.filter((p) => p.status === "Blocked").length || 0}
                              </p>
                            </div>
                            <XCircle className="h-8 w-8 text-red-500" />
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-2">Recent Activity</h3>
                      <div className="space-y-2">
                        {project.ppap_details?.phases?.slice(0, 3).map((phase) => (
                          <div key={phase.id} className="flex items-center justify-between p-3 bg-muted rounded-md">
                            <div>
                              <p className="font-medium">{phase.template_details?.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {phase.status} {phase.deadline ? `- Due ${formatDate(phase.deadline)}` : ""}
                              </p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => navigateToPhase(phase.id)}>
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Upcoming Deadlines</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {alerts.approaching.length > 0 ? (
                        alerts.approaching.map(({ phase, daysLeft }) => (
                          <div
                            key={phase.id}
                            className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-md"
                          >
                            <div>
                              <p className="font-medium">{phase.template_details?.name}</p>
                              <p className="text-sm text-yellow-700">
                                Due in {daysLeft} day{daysLeft !== 1 ? "s" : ""}
                              </p>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => navigateToPhase(phase.id)}>
                              View
                            </Button>
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-muted-foreground py-4">No upcoming deadlines</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Bottlenecks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {alerts.bottlenecks.length > 0 ? (
                        alerts.bottlenecks.map(({ phase, reason }) => (
                          <div
                            key={phase.id}
                            className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-md"
                          >
                            <div>
                              <p className="font-medium">{phase.template_details?.name}</p>
                              <p className="text-sm text-red-700">{reason}</p>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => navigateToPhase(phase.id)}>
                              View
                            </Button>
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-muted-foreground py-4">No bottlenecks detected</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="phases" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Phase Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  {filteredPhases.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Phase</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Progress</TableHead>
                          <TableHead className="hidden md:table-cell">Start Date</TableHead>
                          <TableHead className="hidden md:table-cell">Deadline</TableHead>
                          <TableHead className="hidden md:table-cell">Responsible</TableHead>
                          <TableHead className="hidden lg:table-cell">Dependencies</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPhases.map((phase) => {
                          const dependencies = getPhaseDependencies(phase)
                          const progress = getPhaseProgress(phase)

                          return (
                            <TableRow key={phase.id}>
                              <TableCell className="font-medium">
                                {phase.template_details?.name || `Phase ${phase.id}`}
                              </TableCell>
                              <TableCell>
                                <Badge className={getStatusColor(phase.status)}>{phase.status}</Badge>
                              </TableCell>
                              <TableCell>
                                <div className="w-32">
                                  <Progress value={progress} className="h-2" />
                                  <span className="text-xs text-gray-500 mt-1 block">{progress}%</span>
                                </div>
                              </TableCell>
                              <TableCell className="hidden md:table-cell">{formatDate(phase.started_at)}</TableCell>
                              <TableCell className="hidden md:table-cell">
                                {phase.deadline ? (
                                  <span
                                    className={
                                      new Date(phase.deadline) < new Date() && phase.status !== "Completed"
                                        ? "text-red-600 font-medium"
                                        : ""
                                    }
                                  >
                                    {formatDate(phase.deadline)}
                                  </span>
                                ) : (
                                  "Not set"
                                )}
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                {phase.responsible_details ? (
                                  <div className="flex items-center">
                                    <span>
                                      {phase.responsible_details.person_details?.first_name}{" "}
                                      {phase.responsible_details.person_details?.last_name}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">Unassigned</span>
                                )}
                              </TableCell>
                              <TableCell className="hidden lg:table-cell">
                                {dependencies.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {dependencies.map((dep) => (
                                      <Badge key={dep.id} variant="outline" className="text-xs">
                                        {dep.template_details?.name}
                                        {dep.status !== "Completed" && <span className="ml-1 text-amber-500">⚠</span>}
                                      </Badge>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">None</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Button variant="outline" size="sm" onClick={() => navigateToPhase(phase.id)}>
                                    View
                                  </Button>

                                  <Select
                                    value={phase.status}
                                    onValueChange={(value) => handleStatusChange(phase.id, value)}
                                  >
                                    <SelectTrigger className="w-[130px] h-8">
                                      <SelectValue placeholder="Change status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Not Started">Not Started</SelectItem>
                                      <SelectItem value="In Progress">In Progress</SelectItem>
                                      <SelectItem value="Completed">Completed</SelectItem>
                                      <SelectItem value="Blocked">Blocked</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No phases found with the selected filter</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Phase Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex items-center p-4 bg-muted rounded-lg">
                      <Calendar className="h-8 w-8 mr-4 text-primary" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Average Duration</p>
                        <p className="text-xl font-bold">
                          {project.ppap_details?.phases && project.ppap_details.phases.length > 0
                            ? Math.round(
                                project.ppap_details.phases
                                  .filter((p) => p.started_at && p.finished_at)
                                  .reduce((acc, p) => {
                                    const start = new Date(p.started_at!)
                                    const end = new Date(p.finished_at!)
                                    return acc + (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
                                  }, 0) /
                                  project.ppap_details.phases.filter((p) => p.started_at && p.finished_at).length || 1,
                              )
                            : 0}{" "}
                          days
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center p-4 bg-muted rounded-lg">
                      <Users className="h-8 w-8 mr-4 text-primary" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Assigned Team Members</p>
                        <p className="text-xl font-bold">
                          {project.ppap_details?.phases?.filter((p) => p.responsible).length || 0} /{" "}
                          {project.ppap_details?.phases?.length || 0}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center p-4 bg-muted rounded-lg">
                      <AlertCircle className="h-8 w-8 mr-4 text-primary" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Critical Phases</p>
                        <p className="text-xl font-bold">{alerts.bottlenecks.length + alerts.overdue.length}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="alerts" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <AlertCircle className="h-5 w-5 mr-2 text-red-500" />
                      Overdue Tasks
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {alerts.overdue.length > 0 ? (
                        alerts.overdue.map(({ phase, daysOverdue }) => (
                          <div
                            key={phase.id}
                            className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-md"
                          >
                            <div>
                              <p className="font-medium">{phase.template_details?.name}</p>
                              <p className="text-sm text-red-700">
                                Overdue by {daysOverdue} day{daysOverdue !== 1 ? "s" : ""}
                              </p>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => navigateToPhase(phase.id)}>
                              View
                            </Button>
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-muted-foreground py-4">No overdue tasks</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <AlertTriangle className="h-5 w-5 mr-2 text-yellow-500" />
                      Approaching Deadlines
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {alerts.approaching.length > 0 ? (
                        alerts.approaching.map(({ phase, daysLeft }) => (
                          <div
                            key={phase.id}
                            className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-md"
                          >
                            <div>
                              <p className="font-medium">{phase.template_details?.name}</p>
                              <p className="text-sm text-yellow-700">
                                Due in {daysLeft} day{daysLeft !== 1 ? "s" : ""}
                              </p>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => navigateToPhase(phase.id)}>
                              View
                            </Button>
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-muted-foreground py-4">No approaching deadlines</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <CheckCircle2 className="h-5 w-5 mr-2 text-green-500" />
                      Recently Completed
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {alerts.completed.length > 0 ? (
                        alerts.completed.map(({ phase, completedDate }) => (
                          <div
                            key={phase.id}
                            className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md"
                          >
                            <div>
                              <p className="font-medium">{phase.template_details?.name}</p>
                              <p className="text-sm text-green-700">Completed on {formatDate(completedDate)}</p>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => navigateToPhase(phase.id)}>
                              View
                            </Button>
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-muted-foreground py-4">No recently completed phases</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Notification Settings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Email Notifications</p>
                          <p className="text-sm text-muted-foreground">
                            Receive email alerts for deadlines and updates
                          </p>
                        </div>
                        <Select defaultValue="daily">
                          <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="realtime">Real-time</SelectItem>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="off">Off</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Deadline Reminders</p>
                          <p className="text-sm text-muted-foreground">Get notified before deadlines approach</p>
                        </div>
                        <Select defaultValue="3days">
                          <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1day">1 day before</SelectItem>
                            <SelectItem value="3days">3 days before</SelectItem>
                            <SelectItem value="1week">1 week before</SelectItem>
                            <SelectItem value="off">Off</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Status Change Alerts</p>
                          <p className="text-sm text-muted-foreground">Notifications when phase status changes</p>
                        </div>
                        <Select defaultValue="on">
                          <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="on">On</SelectItem>
                            <SelectItem value="off">Off</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="bottlenecks" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Bottleneck Analysis</CardTitle>
                  <CardDescription>Identify and resolve issues that are slowing down project progress</CardDescription>
                </CardHeader>
                <CardContent>
                  {alerts.bottlenecks.length > 0 ? (
                    <div className="space-y-6">
                      {alerts.bottlenecks.map(({ phase, reason }) => (
                        <div key={phase.id} className="border rounded-lg overflow-hidden">
                          <div className="bg-muted p-4 flex justify-between items-center">
                            <div>
                              <h3 className="font-medium">{phase.template_details?.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                Current Status: <Badge className={getStatusColor(phase.status)}>{phase.status}</Badge>
                              </p>
                            </div>
                            <Button variant="outline" onClick={() => navigateToPhase(phase.id)}>
                              View Phase
                            </Button>
                          </div>

                          <div className="p-4">
                            <div className="mb-4">
                              <h4 className="text-sm font-medium mb-1">Issue</h4>
                              <Alert variant="destructive" className="bg-red-50">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Bottleneck Detected</AlertTitle>
                                <AlertDescription>{reason}</AlertDescription>
                              </Alert>
                            </div>

                            <div className="mb-4">
                              <h4 className="text-sm font-medium mb-1">Dependencies</h4>
                              <div className="space-y-2">
                                {getPhaseDependencies(phase).length > 0 ? (
                                  getPhaseDependencies(phase).map((dep) => (
                                    <div
                                      key={dep.id}
                                      className="flex items-center justify-between p-2 bg-muted rounded-md"
                                    >
                                      <div className="flex items-center">
                                        <Badge className={getStatusColor(dep.status)} variant="outline">
                                          {dep.status}
                                        </Badge>
                                        <span className="ml-2">{dep.template_details?.name}</span>
                                      </div>
                                      <Button variant="ghost" size="sm" onClick={() => navigateToPhase(dep.id)}>
                                        View
                                      </Button>
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-sm text-muted-foreground">No dependencies</p>
                                )}
                              </div>
                            </div>

                            <div>
                              <h4 className="text-sm font-medium mb-1">Recommended Actions</h4>
                              <div className="space-y-2">
                                {reason.includes("previous phases") && (
                                  <p className="text-sm">Complete the dependent phases first</p>
                                )}
                                {reason.includes("responsible") && (
                                  <p className="text-sm">Assign a responsible person to this phase</p>
                                )}
                                {reason.includes("outputs") && (
                                  <p className="text-sm">Review and address issues with rejected outputs</p>
                                )}
                                <Button className="mt-2" onClick={() => navigateToPhase(phase.id)}>
                                  Resolve Issue
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-4" />
                      <h3 className="text-lg font-medium">No Bottlenecks Detected</h3>
                      <p className="text-muted-foreground">
                        Your project is currently progressing without any detected bottlenecks
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Resource Allocation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium mb-2">Team Member Workload</h3>
                        <div className="space-y-2">
                          {project.ppap_details?.phases
                            ?.filter((p) => p.responsible_details)
                            .reduce(
                              (acc, phase) => {
                                const responsibleId = phase.responsible_details?.id
                                if (responsibleId) {
                                  const name = `${phase.responsible_details?.person_details?.first_name || ""} ${phase.responsible_details?.person_details?.last_name || ""}`
                                  if (!acc[responsibleId]) {
                                    acc[responsibleId] = { name, count: 0 }
                                  }
                                  acc[responsibleId].count++
                                }
                                return acc
                              },
                              {} as Record<number, { name: string; count: number }>,
                            ) ? (
                            Object.values(
                              project.ppap_details?.phases
                                ?.filter((p) => p.responsible_details)
                                .reduce(
                                  (acc, phase) => {
                                    const responsibleId = phase.responsible_details?.id
                                    if (responsibleId) {
                                      const name = `${phase.responsible_details?.person_details?.first_name || ""} ${phase.responsible_details?.person_details?.last_name || ""}`
                                      if (!acc[responsibleId]) {
                                        acc[responsibleId] = { name, count: 0 }
                                      }
                                      acc[responsibleId].count++
                                    }
                                    return acc
                                  },
                                  {} as Record<number, { name: string; count: number }>,
                                ),
                            ).map(({ name, count }) => (
                              <div key={name} className="flex items-center justify-between p-2 bg-muted rounded-md">
                                <span>{name}</span>
                                <Badge variant="secondary">
                                  {count} phase{count !== 1 ? "s" : ""}
                                </Badge>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground">No assigned team members</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium mb-2">Phase Distribution</h3>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between p-2 bg-muted rounded-md">
                            <span>Not Started</span>
                            <Badge variant="outline">
                              {project.ppap_details?.phases?.filter((p) => p.status === "Not Started").length || 0}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between p-2 bg-muted rounded-md">
                            <span>In Progress</span>
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              {project.ppap_details?.phases?.filter((p) => p.status === "In Progress").length || 0}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between p-2 bg-muted rounded-md">
                            <span>Completed</span>
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              {project.ppap_details?.phases?.filter((p) => p.status === "Completed").length || 0}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between p-2 bg-muted rounded-md">
                            <span>Blocked</span>
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                              {project.ppap_details?.phases?.filter((p) => p.status === "Blocked").length || 0}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">Project not found</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

// Loading skeleton component
const ProgressSkeleton = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-2 w-full" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array(4)
                .fill(0)
                .map((_, i) => (
                  <Card key={i}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <Skeleton className="h-4 w-24 mb-2" />
                          <Skeleton className="h-8 w-12" />
                        </div>
                        <Skeleton className="h-8 w-8 rounded-full" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>

            <div>
              <Skeleton className="h-6 w-40 mb-4" />
              <div className="space-y-2">
                {Array(3)
                  .fill(0)
                  .map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-muted rounded-md">
                      <div>
                        <Skeleton className="h-5 w-32 mb-2" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
