"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import {
  Edit,
  Eye,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  Filter,
  Download,
  Calendar,
  Users,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { projectApi, clientApi, teamApi, changeStatus } from "@/config/api-utils"
import type { Project, Client, Team, PaginatedResponse } from "@/config/api-types"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

// APQP preparation tasks - This is still mock data as it's not provided by the API
const apqpTasks = [
  {
    id: 1,
    title: "Organize the Team",
    description: "Define team structure and responsibilities",
    status: "completed",
    details: "Identify key stakeholders, define roles and responsibilities, and establish communication channels.",
  },
  {
    id: 2,
    title: "Define the Scope",
    description: "Establish project boundaries and deliverables",
    status: "in-progress",
    details: "Clearly define project objectives, deliverables, constraints, and success criteria.",
  },
  {
    id: 3,
    title: "Establish Team-to-Team Communication",
    description: "Define communication channels and protocols",
    status: "in-progress",
    details: "Set up regular meetings, reporting structures, and communication tools for effective collaboration.",
  },
  {
    id: 4,
    title: "Provide Core Tools Training",
    description: "Ensure team members are trained on APQP tools",
    status: "not-started",
    details: "Schedule training sessions on FMEA, Control Plans, MSA, SPC, and other core quality tools.",
  },
  {
    id: 5,
    title: "Involve Customers and Suppliers",
    description: "Establish communication with external stakeholders",
    status: "not-started",
    details: "Identify key customer and supplier contacts, establish communication channels, and define expectations.",
  },
  {
    id: 6,
    title: "Implement Simultaneous Engineering",
    description: "Set up parallel work streams for efficiency",
    status: "not-started",
    details: "Identify opportunities for concurrent engineering to reduce development time and improve quality.",
  },
  {
    id: 7,
    title: "Develop Control Plan Format",
    description: "Standardize control plan documentation",
    status: "not-started",
    details: "Create templates and guidelines for consistent control plan development across projects.",
  },
  {
    id: 8,
    title: "Decide on Concern Resolution",
    description: "Establish issue tracking and resolution process",
    status: "not-started",
    details:
      "Define process for identifying, documenting, tracking, and resolving issues that arise during the project.",
  },
  {
    id: 9,
    title: "Develop Product Quality Timing Plan",
    description: "Create timeline for quality milestones",
    status: "not-started",
    details: "Establish key quality milestones, gate reviews, and timing requirements for the project.",
  },
]

export default function ProjectsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("projects")
  const [selectedTask, setSelectedTask] = useState<number | null>(null)
  const [projectsData, setProjectsData] = useState<PaginatedResponse<Project> | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState("all")
  const [teamFilter, setTeamFilter] = useState("all")
  const [clientFilter, setClientFilter] = useState("all")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<number | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const router = useRouter()

  // Fetch projects, clients, and teams on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Use the correct API URL with the api prefix
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
        const projectsData = await projectApi.getProjectsPage(`${API_URL}/projects/`);
        setProjectsData(projectsData);
  
        // Fetch clients using the clientApi
        try {
          const clientsData = await clientApi.getAllClients();
          setClients(clientsData);
        } catch (err) {
          console.error("Error fetching clients:", err);
          // Non-critical error, continue with empty clients array
        }
  
        // Fetch teams using the teamApi
        try {
          const teamsData = await teamApi.getAllTeams();
          setTeams(teamsData);
        } catch (err) {
          console.error("Error fetching teams:", err);
          // Non-critical error, continue with empty teams array
        }
      } catch (err) {
        console.error("Error fetching projects:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch projects");
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
  }, []);

  // Handle pagination
  const handlePageChange = async (url: string | null) => {
    if (!url) return

    try {
      setLoading(true)
      const data = await projectApi.getProjectsPage(url)
      setProjectsData(data)
    } catch (err) {
      console.error("Error fetching projects page:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch projects page")
    } finally {
      setLoading(false)
    }
  }

  // Handle project selection
  const handleProjectSelect = (projectId: number) => {
    router.push(`/projects/${projectId}`)
  }

  // Handle project deletion
  const handleDeleteProject = async () => {
    if (!projectToDelete) return

    try {
      setDeleteLoading(true)
      await projectApi.deleteProject(projectToDelete)

      // Remove the deleted project from the state
      if (projectsData) {
        const updatedResults = projectsData.results.filter((project) => project.id !== projectToDelete)
        setProjectsData({
          ...projectsData,
          results: updatedResults,
          count: projectsData.count - 1,
        })
      }

      setDeleteDialogOpen(false)
      setProjectToDelete(null)
    } catch (err) {
      console.error("Error deleting project:", err)
      setDeleteError(err instanceof Error ? err.message : "Failed to delete project")
    } finally {
      setDeleteLoading(false)
    }
  }

  // Handle project status change
  const handleStatusChange = async (projectId: number, newStatus: string) => {
    try {
      await changeStatus("project", projectId, newStatus)

      // Update the project status in the state
      if (projectsData) {
        const updatedResults = projectsData.results.map((project) =>
          project.id === projectId ? { ...project, status: newStatus } : project,
        )
        setProjectsData({
          ...projectsData,
          results: updatedResults,
        })
      }
    } catch (err) {
      console.error("Error changing project status:", err)
      // Show error notification or handle error
    }
  }

  // Filter projects based on search term and filters
  const filteredProjects =
    projectsData?.results.filter((project) => {
      const matchesSearch =
        project.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.client_details?.name?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = statusFilter === "all" || project.status === statusFilter

      const matchesTeam =
        teamFilter === "all" || (project.team_details && project.team_details.id.toString() === teamFilter)

      const matchesClient =
        clientFilter === "all" || (project.client_details && project.client_details.id.toString() === clientFilter)

      return matchesSearch && matchesStatus && matchesTeam && matchesClient
    }) || []

  // Get appropriate color for status badge
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-500"
      case "On Track":
      case "Planning":
        return "bg-blue-500"
      case "In Progress":
        return "bg-yellow-500"
      case "At Risk":
      case "On Hold":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  // Get task status color
  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-300"
      case "in-progress":
        return "bg-yellow-100 text-yellow-800 border-yellow-300"
      case "not-started":
        return "bg-gray-100 text-gray-800 border-gray-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  // Format task status text
  const getTaskStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Completed"
      case "in-progress":
        return "In Progress"
      case "not-started":
        return "Not Started"
      default:
        return status
    }
  }

  // Count projects by status
  const statusCounts =
    projectsData?.results.reduce(
      (acc, project) => {
        const status = project.status || "Unknown"
        acc[status] = (acc[status] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    ) || {}

  // Count projects by team
  const teamCounts =
    projectsData?.results.reduce(
      (acc, project) => {
        if (project.team_details) {
          const team = project.team_details.name || "Unknown"
          acc[team] = (acc[team] || 0) + 1
        }
        return acc
      },
      {} as Record<string, number>,
    ) || {}

  // Count projects by client
  const clientCounts =
    projectsData?.results.reduce(
      (acc, project) => {
        if (project.client_details) {
          const client = project.client_details.name || "Unknown"
          acc[client] = (acc[client] || 0) + 1
        }
        return acc
      },
      {} as Record<string, number>,
    ) || {}

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-3xl font-bold tracking-tight">Projects</h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Link href="/projects/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" /> New Project
              </Button>
            </Link>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="prepare-apqp">Prepare for APQP</TabsTrigger>
          </TabsList>

          <TabsContent value="projects" className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search projects..."
                  className="pl-8 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full sm:w-auto">
                      <Filter className="h-4 w-4 mr-2" />
                      Filter
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Filter by</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <div className="p-2">
                      <div className="space-y-2 mb-2">
                        <Label htmlFor="status">Status</Label>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                          <SelectTrigger id="status">
                            <SelectValue placeholder="All statuses" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All statuses</SelectItem>
                            {Object.keys(statusCounts).map((status) => (
                              <SelectItem key={status} value={status}>
                                {status}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 mb-2">
                        <Label htmlFor="team">Team</Label>
                        <Select value={teamFilter} onValueChange={setTeamFilter}>
                          <SelectTrigger id="team">
                            <SelectValue placeholder="All teams" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All teams</SelectItem>
                            {teams.map((team) => (
                              <SelectItem key={team.id} value={team.id.toString()}>
                                {team.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 mb-2">
                        <Label htmlFor="client">Client</Label>
                        <Select value={clientFilter} onValueChange={setClientFilter}>
                          <SelectTrigger id="client">
                            <SelectValue placeholder="All clients" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All clients</SelectItem>
                            {clients.map((client) => (
                              <SelectItem key={client.id} value={client.id.toString()}>
                                {client.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        className="w-full mt-2"
                        onClick={() => {
                          setStatusFilter("all")
                          setTeamFilter("all")
                          setClientFilter("all")
                        }}
                      >
                        Reset Filters
                      </Button>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />
                  Timeline
                </Button>
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="rounded-md overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[250px]">Project</TableHead>
                          <TableHead>Client</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>PPAP</TableHead>
                          <TableHead>Team</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loading ? (
                          <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center">
                              <div className="flex justify-center">
                                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-gray-900"></div>
                              </div>
                              <div className="mt-2">Loading projects...</div>
                            </TableCell>
                          </TableRow>
                        ) : error ? (
                          <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center text-red-500">
                              {error}
                              <div className="mt-2">
                                <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                                  Retry
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : filteredProjects.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center">
                              No projects found matching your search criteria.
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredProjects.map((project) => (
                            <TableRow
                              key={project.id}
                              className="cursor-pointer"
                              onClick={() => handleProjectSelect(project.id)}
                            >
                              <TableCell>{project.name}</TableCell>
                              <TableCell>{project.client_details?.name || "N/A"}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className={`${getStatusColor(project.status)} text-white`}>
                                  {project.status}
                                </Badge>
                              </TableCell>
                              <TableCell>{project.ppap_details?.level || "N/A"}</TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  <Users className="h-4 w-4 mr-1 text-muted-foreground" />
                                  <span>{project.team_details?.name || "N/A"}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                      <span className="sr-only">Open menu</span>
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleProjectSelect(project.id)
                                      }}
                                    >
                                      <Eye className="mr-2 h-4 w-4" />
                                      View
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        router.push(`/projects/${project.id}/settings`)
                                      }}
                                    >
                                      <Edit className="mr-2 h-4 w-4" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setProjectToDelete(project.id)
                                        setDeleteDialogOpen(true)
                                      }}
                                      className="text-red-600"
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
              {projectsData && (projectsData.next || projectsData.previous) && (
                <CardFooter className="flex justify-between py-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {filteredProjects.length} of {projectsData.count} projects
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(projectsData.previous)}
                      disabled={!projectsData.previous || loading}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="sr-only">Previous Page</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(projectsData.next)}
                      disabled={!projectsData.next || loading}
                    >
                      <ChevronRight className="h-4 w-4" />
                      <span className="sr-only">Next Page</span>
                    </Button>
                  </div>
                </CardFooter>
              )}
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Project Status Summary</CardTitle>
                  <CardDescription>Overview of all project statuses</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(statusCounts).map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full ${getStatusColor(status)} mr-2`}></div>
                          <span>{status}</span>
                        </div>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                    {Object.keys(statusCounts).length === 0 && (
                      <div className="text-center py-2 text-muted-foreground">No projects available</div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Team Distribution</CardTitle>
                  <CardDescription>Projects by team assignment</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(teamCounts).map(([team, count]) => (
                      <div key={team} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                          <span>{team}</span>
                        </div>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                    {Object.keys(teamCounts).length === 0 && (
                      <div className="text-center py-2 text-muted-foreground">No teams available</div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Client Distribution</CardTitle>
                  <CardDescription>Projects by client</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(clientCounts).map(([client, count]) => (
                      <div key={client} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                          <span>{client}</span>
                        </div>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                    {Object.keys(clientCounts).length === 0 && (
                      <div className="text-center py-2 text-muted-foreground">No clients available</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="prepare-apqp" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>APQP Preparation Tasks</CardTitle>
                    <CardDescription>Complete these tasks to prepare for the APQP process</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {apqpTasks.map((task) => (
                        <div
                          key={task.id}
                          className={`p-3 rounded-md border cursor-pointer hover:bg-muted transition-colors ${
                            selectedTask === task.id ? "bg-muted" : ""
                          }`}
                          onClick={() => setSelectedTask(task.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <Checkbox id={`task-${task.id}`} checked={task.status === "completed"} className="mr-2" />
                              <div>
                                <Label
                                  htmlFor={`task-${task.id}`}
                                  className={task.status === "completed" ? "line-through text-muted-foreground" : ""}
                                >
                                  {task.title}
                                </Label>
                                <p className="text-xs text-muted-foreground">{task.description}</p>
                              </div>
                            </div>
                            <Badge variant="outline" className={`ml-2 ${getTaskStatusColor(task.status)}`}>
                              {getTaskStatusText(task.status)}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>APQP Preparation Progress</CardTitle>
                    <CardDescription>Overall completion status</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Overall Progress</span>
                          <span>
                            {Math.round(
                              (apqpTasks.filter((t) => t.status === "completed").length / apqpTasks.length) * 100,
                            )}
                            %
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2.5">
                          <div
                            className="bg-primary h-2.5 rounded-full"
                            style={{
                              width: `${Math.round(
                                (apqpTasks.filter((t) => t.status === "completed").length / apqpTasks.length) * 100,
                              )}%`,
                            }}
                          ></div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2 bg-green-100 rounded-md">
                          <div className="text-lg font-bold text-green-800">
                            {apqpTasks.filter((t) => t.status === "completed").length}
                          </div>
                          <div className="text-xs text-green-800">Completed</div>
                        </div>
                        <div className="p-2 bg-yellow-100 rounded-md">
                          <div className="text-lg font-bold text-yellow-800">
                            {apqpTasks.filter((t) => t.status === "in-progress").length}
                          </div>
                          <div className="text-xs text-yellow-800">In Progress</div>
                        </div>
                        <div className="p-2 bg-gray-100 rounded-md">
                          <div className="text-lg font-bold text-gray-800">
                            {apqpTasks.filter((t) => t.status === "not-started").length}
                          </div>
                          <div className="text-xs text-gray-800">Not Started</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-2">
                {selectedTask ? (
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{apqpTasks.find((t) => t.id === selectedTask)?.title}</CardTitle>
                          <CardDescription>{apqpTasks.find((t) => t.id === selectedTask)?.description}</CardDescription>
                        </div>
                        <Badge
                          variant="outline"
                          className={getTaskStatusColor(apqpTasks.find((t) => t.id === selectedTask)?.status || "")}
                        >
                          {getTaskStatusText(apqpTasks.find((t) => t.id === selectedTask)?.status || "")}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium mb-2">Task Details</h3>
                        <p className="text-muted-foreground">{apqpTasks.find((t) => t.id === selectedTask)?.details}</p>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Task Checklist</h3>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox id="checklist-1" />
                            <Label htmlFor="checklist-1">Define team members and roles</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox id="checklist-2" />
                            <Label htmlFor="checklist-2">Create communication plan</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox id="checklist-3" />
                            <Label htmlFor="checklist-3">Schedule kickoff meeting</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox id="checklist-4" />
                            <Label htmlFor="checklist-4">Document team structure</Label>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Notes</h3>
                        <textarea
                          className="w-full min-h-[100px] p-2 border rounded-md"
                          placeholder="Add your notes here..."
                        ></textarea>
                      </div>

                      <div className="flex justify-end space-x-2">
                        <Button variant="outline">Mark as Complete</Button>
                        <Button>Save Changes</Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>APQP Preparation Overview</CardTitle>
                      <CardDescription>Select a task from the list to view details</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium mb-2">What is APQP?</h3>
                        <p className="text-muted-foreground">
                          Advanced Product Quality Planning (APQP) is a structured approach to product and process
                          design. It's a framework of procedures and techniques used to develop products in the
                          automotive industry.
                        </p>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium mb-2">APQP Phases</h3>
                        <div className="space-y-2">
                          <div className="p-3 border rounded-md">
                            <h4 className="font-medium">Phase 1: Planning</h4>
                            <p className="text-sm text-muted-foreground">
                              Define project goals, identify customer requirements, and establish the project team.
                            </p>
                          </div>
                          <div className="p-3 border rounded-md">
                            <h4 className="font-medium">Phase 2: Product Design & Development</h4>
                            <p className="text-sm text-muted-foreground">
                              Develop and finalize product design, conduct design reviews, and perform design
                              verification.
                            </p>
                          </div>
                          <div className="p-3 border rounded-md">
                            <h4 className="font-medium">Phase 3: Process Design & Development</h4>
                            <p className="text-sm text-muted-foreground">
                              Develop manufacturing processes, create control plans, and establish quality standards.
                            </p>
                          </div>
                          <div className="p-3 border rounded-md">
                            <h4 className="font-medium">Phase 4: Product & Process Validation</h4>
                            <p className="text-sm text-muted-foreground">
                              Validate product and process through production trials and testing.
                            </p>
                          </div>
                          <div className="p-3 border rounded-md">
                            <h4 className="font-medium">Phase 5: Production</h4>
                            <p className="text-sm text-muted-foreground">
                              Launch full production, evaluate outcomes, and implement continuous improvement.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-center">
                        <Button>Start New APQP Project</Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this project?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the project and all associated data.
              {deleteError && <div className="mt-2 text-red-500">Error: {deleteError}</div>}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDeleteProject()
              }}
              disabled={deleteLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  Deleting...
                </div>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  )
}
