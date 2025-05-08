"use client"

import { useEffect, useState, useMemo } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { projectApi } from "@/config/api-utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, BarChart3, CheckCircle, Clock, FileText, Info, Loader2, Users, User } from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts"

import type { Project, Phase, Output } from "@/config/api-types"

// Define types for our statistics
interface PhaseStats {
  id: number
  name: string
  status: string
  progress: number
  outputsTotal: number
  outputsCompleted: number
  startDate?: string
  endDate?: string
  responsible?: string
}

interface OutputStats {
  id: number
  name: string
  status: string
  phase: number
  phaseName: string
  assignedTo?: string
  dueDate?: string
  documentCount: number
}

interface TeamMemberStats {
  id: number
  name: string
  outputsAssigned: number
  outputsCompleted: number
  documentsUploaded: number
}

interface TimelineItem {
  date: string
  event: string
  type: string
}

export default function StatisticsPage() {
  const params = useParams()
  const projectId = Number(params.projectId)

  const [project, setProject] = useState<Project | null>(null)
  const [phases, setPhases] = useState<Phase[]>([])
  const [outputs, setOutputs] = useState<Output[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [timeRange, setTimeRange] = useState("all")
  const [phaseFilter, setPhaseFilter] = useState("all")

  // Derived statistics
  const [phaseStats, setPhaseStats] = useState<PhaseStats[]>([])
  const [outputStats, setOutputStats] = useState<OutputStats[]>([])
  const [teamMemberStats, setTeamMemberStats] = useState<TeamMemberStats[]>([])
  const [timeline, setTimeline] = useState<TimelineItem[]>([])

  // Chart colors
  const COLORS = {
    completed: "#10b981", // green-500
    inProgress: "#3b82f6", // blue-500
    notStarted: "#6b7280", // gray-500
    planning: "#f59e0b", // amber-500
    primary: "#6366f1", // indigo-500
    secondary: "#8b5cf6", // violet-500
    accent: "#ec4899", // pink-500
  }

  const PIE_COLORS = [
    "#10b981", // green-500
    "#3b82f6", // blue-500
    "#f59e0b", // amber-500
    "#6b7280", // gray-500
    "#8b5cf6", // violet-500
    "#ec4899", // pink-500
  ]

  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        setLoading(true)
        const projectData = await projectApi.getProject(projectId)
        setProject(projectData)

        // Fetch phases if PPAP exists
        if (projectData.ppap_details?.id) {
          try {
            // In a real implementation, you would fetch phases for the PPAP
            // For now, we'll use the phases from the project data if available
            if (projectData.ppap_details.phases) {
              setPhases(projectData.ppap_details.phases)
            }
          } catch (err: any) {
            console.error("Error fetching phases:", err)
          }
        }

        // Generate sample data for demonstration
        generateSampleData(projectData)
      } catch (err: any) {
        console.error("Error fetching project data:", err)
        setError(err.message || "Failed to load project data")
      } finally {
        setLoading(false)
      }
    }

    if (projectId) {
      fetchProjectData()
    }
  }, [projectId])

  // Generate sample data for demonstration purposes
  // In a real implementation, this would be replaced with actual API calls
  const generateSampleData = (projectData: Project) => {
    // Generate phase statistics
    const samplePhaseStats: PhaseStats[] = [
      {
        id: 1,
        name: "Planning",
        status: "Completed",
        progress: 100,
        outputsTotal: 4,
        outputsCompleted: 4,
        startDate: "2023-01-15",
        endDate: "2023-02-01",
        responsible: "John Doe",
      },
      {
        id: 2,
        name: "Product Design",
        status: "Completed",
        progress: 100,
        outputsTotal: 5,
        outputsCompleted: 5,
        startDate: "2023-02-02",
        endDate: "2023-03-15",
        responsible: "Jane Smith",
      },
      {
        id: 3,
        name: "Process Design",
        status: "In Progress",
        progress: 75,
        outputsTotal: 6,
        outputsCompleted: 4,
        startDate: "2023-03-16",
        endDate: "2023-04-30",
        responsible: "Mike Johnson",
      },
      {
        id: 4,
        name: "Validation",
        status: "Not Started",
        progress: 0,
        outputsTotal: 5,
        outputsCompleted: 0,
        startDate: "2023-05-01",
        endDate: "2023-06-15",
        responsible: "Sarah Williams",
      },
    ]
    setPhaseStats(samplePhaseStats)

    // Generate output statistics
    const sampleOutputStats: OutputStats[] = [
      {
        id: 1,
        name: "Design FMEA",
        status: "Completed",
        phase: 2,
        phaseName: "Product Design",
        assignedTo: "Jane Smith",
        dueDate: "2023-02-20",
        documentCount: 3,
      },
      {
        id: 2,
        name: "Process Flow Diagram",
        status: "Completed",
        phase: 3,
        phaseName: "Process Design",
        assignedTo: "Mike Johnson",
        dueDate: "2023-03-25",
        documentCount: 2,
      },
      {
        id: 3,
        name: "Control Plan",
        status: "In Progress",
        phase: 3,
        phaseName: "Process Design",
        assignedTo: "Mike Johnson",
        dueDate: "2023-04-10",
        documentCount: 1,
      },
      {
        id: 4,
        name: "Process FMEA",
        status: "Not Started",
        phase: 3,
        phaseName: "Process Design",
        assignedTo: "Mike Johnson",
        dueDate: "2023-04-20",
        documentCount: 0,
      },
      {
        id: 5,
        name: "Measurement System Analysis",
        status: "Not Started",
        phase: 4,
        phaseName: "Validation",
        assignedTo: "Sarah Williams",
        dueDate: "2023-05-15",
        documentCount: 0,
      },
    ]
    setOutputStats(sampleOutputStats)

    // Generate team member statistics
    const sampleTeamMemberStats: TeamMemberStats[] = [
      {
        id: 1,
        name: "John Doe",
        outputsAssigned: 4,
        outputsCompleted: 4,
        documentsUploaded: 8,
      },
      {
        id: 2,
        name: "Jane Smith",
        outputsAssigned: 5,
        outputsCompleted: 5,
        documentsUploaded: 10,
      },
      {
        id: 3,
        name: "Mike Johnson",
        outputsAssigned: 6,
        outputsCompleted: 4,
        documentsUploaded: 6,
      },
      {
        id: 4,
        name: "Sarah Williams",
        outputsAssigned: 5,
        outputsCompleted: 0,
        documentsUploaded: 0,
      },
    ]
    setTeamMemberStats(sampleTeamMemberStats)

    // Generate timeline
    const sampleTimeline: TimelineItem[] = [
      {
        date: "2023-01-15",
        event: "Project started",
        type: "project",
      },
      {
        date: "2023-01-20",
        event: "Planning phase started",
        type: "phase",
      },
      {
        date: "2023-02-01",
        event: "Planning phase completed",
        type: "phase",
      },
      {
        date: "2023-02-02",
        event: "Product Design phase started",
        type: "phase",
      },
      {
        date: "2023-02-15",
        event: "Design FMEA document uploaded",
        type: "document",
      },
      {
        date: "2023-03-15",
        event: "Product Design phase completed",
        type: "phase",
      },
      {
        date: "2023-03-16",
        event: "Process Design phase started",
        type: "phase",
      },
      {
        date: "2023-03-25",
        event: "Process Flow Diagram document uploaded",
        type: "document",
      },
      {
        date: "2023-04-05",
        event: "Control Plan document uploaded",
        type: "document",
      },
    ]
    setTimeline(sampleTimeline)

    // Generate sample outputs
    const sampleOutputs: Output[] = sampleOutputStats.map((stat) => ({
      id: stat.id,
      template: stat.id,
      description: stat.name,
      document: null,
      user: null,
      phase: stat.phase,
      status: stat.status,
      history_id: `history_${stat.id}`,
      template_details: {
        id: stat.id,
        name: stat.name,
      },
    }))
    setOutputs(sampleOutputs)
  }

  // Compute statistics for charts
  const phaseStatusData = useMemo(() => {
    const statusCounts = {
      Completed: 0,
      "In Progress": 0,
      "Not Started": 0,
    }

    phaseStats.forEach((phase) => {
      if (phase.status in statusCounts) {
        statusCounts[phase.status as keyof typeof statusCounts]++
      }
    })

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status,
      value: count,
    }))
  }, [phaseStats])

  const outputStatusData = useMemo(() => {
    const statusCounts = {
      Completed: 0,
      "In Progress": 0,
      "Not Started": 0,
    }

    outputStats.forEach((output) => {
      if (output.status in statusCounts) {
        statusCounts[output.status as keyof typeof statusCounts]++
      }
    })

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status,
      value: count,
    }))
  }, [outputStats])

  const phaseProgressData = useMemo(() => {
    return phaseStats.map((phase) => ({
      name: phase.name,
      progress: phase.progress,
    }))
  }, [phaseStats])

  const teamPerformanceData = useMemo(() => {
    return teamMemberStats.map((member) => ({
      name: member.name,
      assigned: member.outputsAssigned,
      completed: member.outputsCompleted,
      documents: member.documentsUploaded,
    }))
  }, [teamMemberStats])

  const timelineChartData = useMemo(() => {
    // Group timeline events by date and count them
    const eventsByDate = timeline.reduce(
      (acc, item) => {
        const date = item.date
        if (!acc[date]) {
          acc[date] = { date, events: 0, documents: 0, phases: 0 }
        }

        acc[date].events++

        if (item.type === "document") {
          acc[date].documents++
        } else if (item.type === "phase") {
          acc[date].phases++
        }

        return acc
      },
      {} as Record<string, { date: string; events: number; documents: number; phases: number }>,
    )

    // Convert to array and sort by date
    return Object.values(eventsByDate).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [timeline])

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return COLORS.completed
      case "in progress":
        return COLORS.inProgress
      case "planning":
        return COLORS.planning
      case "not started":
        return COLORS.notStarted
      default:
        return COLORS.notStarted
    }
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-500 text-white"
      case "in progress":
        return "bg-blue-500 text-white"
      case "planning":
        return "bg-yellow-500 text-white"
      case "not started":
        return "bg-gray-300 text-gray-700"
      default:
        return "bg-gray-300 text-gray-700"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "in progress":
        return <Clock className="h-4 w-4 text-blue-500" />
      case "planning":
        return <Info className="h-4 w-4 text-yellow-500" />
      case "not started":
        return <AlertCircle className="h-4 w-4 text-gray-500" />
      default:
        return null
    }
  }

  // Calculate overall project progress
  const overallProgress = useMemo(() => {
    if (phaseStats.length === 0) return 0

    const totalPhases = phaseStats.length
    const completedPhases = phaseStats.filter((phase) => phase.status === "Completed").length
    const inProgressPhases = phaseStats.filter((phase) => phase.status === "In Progress").length

    return Math.round(((completedPhases + inProgressPhases * 0.5) / totalPhases) * 100)
  }, [phaseStats])

  // Calculate output completion rate
  const outputCompletionRate = useMemo(() => {
    if (outputStats.length === 0) return 0

    const totalOutputs = outputStats.length
    const completedOutputs = outputStats.filter((output) => output.status === "Completed").length

    return Math.round((completedOutputs / totalOutputs) * 100)
  }, [outputStats])

  // Calculate document upload rate
  const documentUploadRate = useMemo(() => {
    const totalDocuments = outputStats.reduce((sum, output) => sum + output.documentCount, 0)
    const totalOutputs = outputStats.length

    return totalOutputs > 0 ? Math.round((totalDocuments / totalOutputs) * 10) / 10 : 0
  }, [outputStats])

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Project Statistics</h1>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Label htmlFor="timeRange">Time Range:</Label>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger id="timeRange" className="w-[180px]">
                  <SelectValue placeholder="Select time range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="month">Last Month</SelectItem>
                  <SelectItem value="quarter">Last Quarter</SelectItem>
                  <SelectItem value="year">Last Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="phaseFilter">Phase:</Label>
              <Select value={phaseFilter} onValueChange={setPhaseFilter}>
                <SelectTrigger id="phaseFilter" className="w-[180px]">
                  <SelectValue placeholder="Select phase" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Phases</SelectItem>
                  {phaseStats.map((phase) => (
                    <SelectItem key={phase.id} value={phase.id.toString()}>
                      {phase.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : project ? (
          <>
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overallProgress}%</div>
                  <p className="text-xs text-muted-foreground">
                    {phaseStats.filter((phase) => phase.status === "Completed").length} of {phaseStats.length} phases
                    completed
                  </p>
                  <Progress value={overallProgress} className="h-2 mt-4" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Output Completion</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{outputCompletionRate}%</div>
                  <p className="text-xs text-muted-foreground">
                    {outputStats.filter((output) => output.status === "Completed").length} of {outputStats.length}{" "}
                    outputs completed
                  </p>
                  <Progress value={outputCompletionRate} className="h-2 mt-4" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Team Contribution</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{documentUploadRate}</div>
                  <p className="text-xs text-muted-foreground">Average documents per output</p>
                  <Progress value={Math.min(documentUploadRate * 20, 100)} className="h-2 mt-4" />
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="phases">Phases</TabsTrigger>
                <TabsTrigger value="outputs">Outputs</TabsTrigger>
                <TabsTrigger value="team">Team</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="mt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Phase Status</CardTitle>
                      <CardDescription>Distribution of phases by status</CardDescription>
                    </CardHeader>
                    <CardContent className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={phaseStatusData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {phaseStatusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Legend />
                          <RechartsTooltip />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Output Status</CardTitle>
                      <CardDescription>Distribution of outputs by status</CardDescription>
                    </CardHeader>
                    <CardContent className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={outputStatusData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {outputStatusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Legend />
                          <RechartsTooltip />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Project Timeline</CardTitle>
                    <CardDescription>Activity over time</CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={timelineChartData}
                        margin={{
                          top: 10,
                          right: 30,
                          left: 0,
                          bottom: 0,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <RechartsTooltip />
                        <Legend />
                        <Area
                          type="monotone"
                          dataKey="events"
                          stackId="1"
                          stroke={COLORS.primary}
                          fill={COLORS.primary}
                        />
                        <Area
                          type="monotone"
                          dataKey="documents"
                          stackId="1"
                          stroke={COLORS.secondary}
                          fill={COLORS.secondary}
                        />
                        <Area
                          type="monotone"
                          dataKey="phases"
                          stackId="1"
                          stroke={COLORS.accent}
                          fill={COLORS.accent}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Phases Tab */}
              <TabsContent value="phases" className="mt-6 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Phase Progress</CardTitle>
                    <CardDescription>Completion percentage by phase</CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={phaseProgressData}
                        layout="vertical"
                        margin={{
                          top: 20,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" domain={[0, 100]} />
                        <YAxis dataKey="name" type="category" width={100} />
                        <RechartsTooltip />
                        <Legend />
                        <Bar dataKey="progress" name="Progress (%)" fill={COLORS.primary} radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Phase Details</CardTitle>
                      <CardDescription>Detailed information about each phase</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {phaseStats.map((phase) => (
                          <div key={phase.id} className="border rounded-md p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-medium">{phase.name}</h3>
                              <Badge variant="outline" className={getStatusBadgeClass(phase.status)}>
                                <div className="flex items-center gap-1">
                                  {getStatusIcon(phase.status)}
                                  <span>{phase.status}</span>
                                </div>
                              </Badge>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Progress:</span>
                                <span>{phase.progress}%</span>
                              </div>
                              <Progress value={phase.progress} className="h-2" />
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Outputs:</span>
                                <span>
                                  {phase.outputsCompleted} / {phase.outputsTotal} completed
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Responsible:</span>
                                <span>{phase.responsible || "Unassigned"}</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Timeline:</span>
                                <span>
                                  {phase.startDate ? new Date(phase.startDate).toLocaleDateString() : "Not started"}
                                  {" - "}
                                  {phase.endDate ? new Date(phase.endDate).toLocaleDateString() : "No end date"}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Phase Dependencies</CardTitle>
                      <CardDescription>Relationships between phases</CardDescription>
                    </CardHeader>
                    <CardContent className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={phaseProgressData}
                          margin={{
                            top: 20,
                            right: 30,
                            left: 20,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis domain={[0, 100]} />
                          <RechartsTooltip />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="progress"
                            name="Progress (%)"
                            stroke={COLORS.primary}
                            activeDot={{ r: 8 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Outputs Tab */}
              <TabsContent value="outputs" className="mt-6 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Output Status by Phase</CardTitle>
                    <CardDescription>Distribution of outputs across phases</CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={phaseStats}
                        margin={{
                          top: 20,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <RechartsTooltip />
                        <Legend />
                        <Bar dataKey="outputsCompleted" name="Completed" stackId="a" fill={COLORS.completed} />
                        <Bar
                          dataKey={(data) => data.outputsTotal - data.outputsCompleted}
                          name="Remaining"
                          stackId="a"
                          fill={COLORS.notStarted}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Output Details</CardTitle>
                      <CardDescription>Detailed information about each output</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {outputStats
                          .filter((output) => phaseFilter === "all" || output.phase === Number(phaseFilter))
                          .map((output) => (
                            <div key={output.id} className="border rounded-md p-4">
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="font-medium">{output.name}</h3>
                                <Badge variant="outline" className={getStatusBadgeClass(output.status)}>
                                  <div className="flex items-center gap-1">
                                    {getStatusIcon(output.status)}
                                    <span>{output.status}</span>
                                  </div>
                                </Badge>
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground">Phase:</span>
                                  <span>{output.phaseName}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground">Assigned To:</span>
                                  <span>{output.assignedTo || "Unassigned"}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground">Due Date:</span>
                                  <span>
                                    {output.dueDate ? new Date(output.dueDate).toLocaleDateString() : "No due date"}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground">Documents:</span>
                                  <span>{output.documentCount}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Document Distribution</CardTitle>
                      <CardDescription>Number of documents per output</CardDescription>
                    </CardHeader>
                    <CardContent className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={outputStats.filter(
                            (output) => phaseFilter === "all" || output.phase === Number(phaseFilter),
                          )}
                          margin={{
                            top: 20,
                            right: 30,
                            left: 20,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <RechartsTooltip />
                          <Legend />
                          <Bar dataKey="documentCount" name="Documents" fill={COLORS.secondary} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Team Tab */}
              <TabsContent value="team" className="mt-6 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Team Performance</CardTitle>
                    <CardDescription>Output completion by team member</CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={teamPerformanceData}
                        margin={{
                          top: 20,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <RechartsTooltip />
                        <Legend />
                        <Bar dataKey="assigned" name="Assigned" fill={COLORS.notStarted} />
                        <Bar dataKey="completed" name="Completed" fill={COLORS.completed} />
                        <Bar dataKey="documents" name="Documents" fill={COLORS.secondary} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Team Member Details</CardTitle>
                      <CardDescription>Detailed information about each team member</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {teamMemberStats.map((member) => (
                          <div key={member.id} className="border rounded-md p-4">
                            <div className="flex items-center space-x-3 mb-2">
                              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <h3 className="font-medium">{member.name}</h3>
                                <p className="text-xs text-muted-foreground">Team Member</p>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Outputs Assigned:</span>
                                <span>{member.outputsAssigned}</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Outputs Completed:</span>
                                <span>{member.outputsCompleted}</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Completion Rate:</span>
                                <span>
                                  {member.outputsAssigned > 0
                                    ? `${Math.round((member.outputsCompleted / member.outputsAssigned) * 100)}%`
                                    : "N/A"}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Documents Uploaded:</span>
                                <span>{member.documentsUploaded}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Workload Distribution</CardTitle>
                      <CardDescription>Distribution of outputs among team members</CardDescription>
                    </CardHeader>
                    <CardContent className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={teamMemberStats.map((member) => ({
                              name: member.name,
                              value: member.outputsAssigned,
                            }))}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {teamMemberStats.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Legend />
                          <RechartsTooltip />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
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
