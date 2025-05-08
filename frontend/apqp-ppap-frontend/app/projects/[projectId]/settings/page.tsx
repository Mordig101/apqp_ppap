"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { projectApi, userApi, teamApi, clientApi } from "@/config/api-utils"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { AlertCircle, CheckCircle, Clock, Info, Loader2, Save } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

import type { Project, User as ApiUser, Team, Phase, Client } from "@/config/api-types"

interface FormData {
  name: string
  description: string
  clientId: number
  teamId: number
  status: string
  ppapLevel: number
}

interface Notification {
  id: string
  type: "success" | "error" | "info"
  message: string
}

const renderSafely = (render: () => React.ReactNode) => {
  try {
    return render();
  } catch (error) {
    console.error("Rendering error:", error);
    return <div className="text-red-500">Error rendering content</div>;
  }
}

export default function SettingsPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = Number(params.projectId)

  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [notification, setNotification] = useState<Notification | null>(null)
  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    clientId: 0,
    teamId: 0,
    status: "",
    ppapLevel: 3,
  })

  // Team management
  const [teams, setTeams] = useState<Team[]>([])
  const [users, setUsers] = useState<ApiUser[]>([])
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<number[]>([])
  const [loadingTeams, setLoadingTeams] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(false)

  // Phase management
  const [phases, setPhases] = useState<Phase[]>([])
  const [loadingPhases, setLoadingPhases] = useState(false)
  const [selectedPhase, setSelectedPhase] = useState<number | null>(null)
  const [phaseResponsible, setPhaseResponsible] = useState<number | null>(null)
  const [phaseDeadline, setPhaseDeadline] = useState<Date | undefined>(undefined)

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    phaseCompletionNotifications: true,
    documentUploadNotifications: true,
    commentNotifications: true,
    dailyDigest: false,
    weeklyDigest: true,
  })

  // Access permissions
  const [accessPermissions, setAccessPermissions] = useState({
    viewOnly: [] as number[],
    edit: [] as number[],
    admin: [] as number[],
  })

  // Client management
  const [clients, setClients] = useState<Client[]>([])

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true)
        const data = await projectApi.getProject(projectId)
        setProject(data)
        setFormData({
          name: data.name,
          description: data.description || "",
          clientId: data.client,
          teamId: data.team,
          status: data.status,
          ppapLevel: data.ppap_details?.level || 3,
        })

        // Fetch phases if PPAP exists
        if (data.ppap_details?.id) {
          fetchPhases(data.ppap_details.id)
        }
      } catch (err: any) {
        console.error("Error fetching project:", err)
        setError("Failed to load project details")
      } finally {
        setLoading(false)
      }
    }

    const fetchTeams = async () => {
      try {
        setLoadingTeams(true)
        const teamsData = await teamApi.getAllTeams()
        setTeams(teamsData)
      } catch (err: any) {
        console.error("Error fetching teams:", err)
      } finally {
        setLoadingTeams(false)
      }
    }

    const fetchUsers = async () => {
      try {
        setLoadingUsers(true)
        const response = await userApi.getAllUsers()
        // Check if response is an object with results property
        if (response && typeof response === 'object' && 'results' in response) {
          setUsers(response.results || [])
        } else if (Array.isArray(response)) {
          // Handle case where it's already an array
          setUsers(response)
        } else {
          // Handle unexpected response
          console.error("Unexpected user data format:", response)
          setUsers([])
        }
      } catch (err: any) {
        console.error("Error fetching users:", err)
        setUsers([]) // Set empty array on error
      } finally {
        setLoadingUsers(false)
      }
    }

    const fetchPhases = async (ppapId: number) => {
      try {
        setLoadingPhases(true)
        // In a real implementation, you would fetch phases for the PPAP
        // For now, we'll use the phases from the project data if available
        if (project?.ppap_details?.phases) {
          setPhases(project.ppap_details.phases)
        }
      } catch (err: any) {
        console.error("Error fetching phases:", err)
      } finally {
        setLoadingPhases(false)
      }
    }

    const fetchClients = async () => {
      try {
        const clientsData = await clientApi.getAllClients()
        setClients(clientsData)
      } catch (err: any) {
        console.error("Error fetching clients:", err)
      }
    }

    if (projectId) {
      fetchProject()
      fetchTeams()
      fetchUsers()
      fetchClients()
    }
    
    // Only depend on projectId - remove project?.ppap_details?.phases
  }, [projectId])

  useEffect(() => {
    // Set selected team members when project and teams are loaded
    if (project && project.team_details?.members) {
      const memberIds = project.team_details.members
        .filter(member => member && member.id) // Add null check
        .map((member) => member.id)
      setSelectedTeamMembers(memberIds)
    }
  }, [project])

  // Add this after your main useEffect
  useEffect(() => {
    // Update phases when project changes
    if (project?.ppap_details?.phases) {
      setPhases(project.ppap_details.phases)
    }
  }, [project])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleStatusChange = (value: string) => {
    setFormData({
      ...formData,
      status: value,
    })
  }

  const handlePpapLevelChange = (value: string) => {
    setFormData({
      ...formData,
      ppapLevel: Number(value),
    })
  }

  const handleTeamChange = (value: string) => {
    setFormData({
      ...formData,
      teamId: Number(value),
    })
  }

  const handleClientChange = (value: string) => {
    setFormData({
      ...formData,
      clientId: Number(value),
    })
  }

  const handleTeamMemberToggle = (userId: number) => {
    setSelectedTeamMembers((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]))
  }

  const handlePhaseSelect = (phaseId: number) => {
    setSelectedPhase(phaseId)
    const phase = phases.find((p) => p.id === phaseId)
    if (phase) {
      // Handle undefined responsible
      setPhaseResponsible(phase.responsible || null)
      
      // Handle undefined deadline
      setPhaseDeadline(phase.deadline ? new Date(phase.deadline) : undefined)
    }
  }

  const handlePhaseResponsibleChange = (value: string) => {
    setPhaseResponsible(Number(value))
  }

  const handleNotificationSettingChange = (setting: string, value: boolean) => {
    setNotificationSettings({
      ...notificationSettings,
      [setting]: value,
    })
  }

  const handleAccessPermissionChange = (userId: number, level: "viewOnly" | "edit" | "admin") => {
    // Remove user from all permission levels
    const newPermissions = {
      viewOnly: accessPermissions.viewOnly.filter((id) => id !== userId),
      edit: accessPermissions.edit.filter((id) => id !== userId),
      admin: accessPermissions.admin.filter((id) => id !== userId),
    }

    // Add user to the selected level
    newPermissions[level] = [...newPermissions[level], userId]

    setAccessPermissions(newPermissions)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      // Update project
      const updatedProject = await projectApi.updateProject(projectId, {
        name: formData.name,
        description: formData.description,
        client_id: formData.clientId,
        team_id: formData.teamId,
        status: formData.status,
      })

      // Update PPAP level if needed
      if (project?.ppap_details && project.ppap_details.level !== formData.ppapLevel) {
        // In a real implementation, you would update the PPAP level
        console.log("Updating PPAP level to", formData.ppapLevel)
      }

      // Update team members if needed
      if (formData.teamId && formData.teamId > 0) {
        // Check if selectedTeamMembers differs from current team members
        const currentTeamMemberIds = project?.team_details?.members
          ?.filter(m => m && m.id)
          ?.map(m => m.id) || [];
          
        if (JSON.stringify([...currentTeamMemberIds].sort()) !== 
            JSON.stringify([...selectedTeamMembers].sort())) {
          // Only update team members if they've changed
          await teamApi.updateTeamMembers(formData.teamId, selectedTeamMembers)
        }
      }

      // Update phase responsible if needed
      if (selectedPhase && phaseResponsible) {
        const phase = phases.find((p) => p.id === selectedPhase)
        if (phase && phase.responsible !== phaseResponsible) {
          // In a real implementation, you would update the phase responsible
          console.log("Updating phase responsible to", phaseResponsible)
        }
      }

      // Update phase deadline if needed
      if (selectedPhase && phaseDeadline) {
        const phase = phases.find((p) => p.id === selectedPhase)
        if (phase && (!phase.deadline || new Date(phase.deadline).getTime() !== phaseDeadline.getTime())) {
          // In a real implementation, you would update the phase deadline
          console.log("Updating phase deadline to", phaseDeadline)
        }
      }

      // Show success notification
      setNotification({
        id: Date.now().toString(),
        type: "success",
        message: "Project settings updated successfully",
      })

      // Update local project state
      setProject(updatedProject)
    } catch (err: any) {
      console.error("Error updating project:", err)
      setNotification({
        id: Date.now().toString(),
        type: "error",
        message: err.message || "Failed to update project settings",
      })
    } finally {
      setSaving(false)

      // Clear notification after 3 seconds
      setTimeout(() => {
        setNotification(null)
      }, 3000)
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Project Settings</h1>
          {project && (
            <Badge variant="outline" className={getStatusBadgeClass(project.status)}>
              <div className="flex items-center gap-1">
                {getStatusIcon(project.status)}
                <span>{project.status}</span>
              </div>
            </Badge>
          )}
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
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="teams">Teams</TabsTrigger>
              <TabsTrigger value="phases">Phases</TabsTrigger>
              <TabsTrigger value="permissions">Permissions</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
            </TabsList>

            {/* General Settings Tab */}
            <TabsContent value="general" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>General Settings</CardTitle>
                  <CardDescription>
                    Basic information about the project
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Project Name</Label>
                      <Input 
                        id="name" 
                        name="name" 
                        value={formData.name} 
                        onChange={handleInputChange} 
                        required 
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        className="min-h-[100px]"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select 
                          value={formData.status} 
                          onValueChange={handleStatusChange}
                        >
                          <SelectTrigger id="status">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Not Started">Not Started</SelectItem>
                            <SelectItem value="Planning">Planning</SelectItem>
                            <SelectItem value="In Progress">In Progress</SelectItem>
                            <SelectItem value="Completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="ppapLevel">PPAP Level</Label>
                        <Select 
                          value={formData.ppapLevel.toString()} 
                          onValueChange={handlePpapLevelChange}
                        >
                          <SelectTrigger id="ppapLevel">
                            <SelectValue placeholder="Select PPAP level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Level 1</SelectItem>
                            <SelectItem value="2">Level 2</SelectItem>
                            <SelectItem value="3">Level 3</SelectItem>
                            <SelectItem value="4">Level 4</SelectItem>
                            <SelectItem value="5">Level 5</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="client">Client</Label>
                        <Select 
                          value={formData.clientId.toString()} 
                          onValueChange={handleClientChange}
                        >
                          <SelectTrigger id="client">
                            <SelectValue placeholder="Select client" />
                          </SelectTrigger>
                          <SelectContent>
                            {clients.map(client => (
                              <SelectItem key={client.id} value={client.id.toString()}>
                                {client.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="team">Team</Label>
                        <Select 
                          value={formData.teamId.toString()} 
                          onValueChange={handleTeamChange}
                        >
                          <SelectTrigger id="team">
                            <SelectValue placeholder="Select team" />
                          </SelectTrigger>
                          <SelectContent>
                            {loadingTeams ? (
                              <SelectItem value="loading" disabled>
                                Loading teams...
                              </SelectItem>
                            ) : (
                              teams.map(team => (
                                <SelectItem key={team.id} value={team.id.toString()}>
                                  {team.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button type="submit" disabled={saving}>
                        {saving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Teams Tab */}
            <TabsContent value="teams" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Team Management</CardTitle>
                  <CardDescription>
                    Manage team members for this project
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">
                        {project.team_details?.name || "Project Team"}
                      </h3>
                      <Button variant="outline" onClick={handleSubmit} disabled={saving}>
                        {saving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Current Team Members</h4>
                        <Badge variant="outline">
                          {selectedTeamMembers.length} members
                        </Badge>
                      </div>

                      <ScrollArea className="h-[300px] rounded-md border">
                        <div className="p-4">
                          {loadingUsers ? (
                            <div className="flex items-center justify-center h-32">
                              <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {users.map(user => (
                                <div 
                                  key={user.id} 
                                  className="flex items-center justify-between p-2 rounded-md hover:bg-muted"
                                >
                                  <div className="flex items-center space-x-3">
                                    <Checkbox 
                                      id={`user-${user.id}`}
                                      checked={selectedTeamMembers.includes(user.id)}
                                      onCheckedChange={() => handleTeamMemberToggle(user.id)}
                                    />
                                    <Avatar className="h-8 w-8">
                                      <AvatarFallback>
                                        {user.person_details 
                                          ? `${user.person_details.first_name?.[0] || ''}${user.person_details.last_name?.[0] || ''}` 
                                          : user.username?.substring(0, 2).toUpperCase() || 'U'}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="text-sm font-medium">
                                        {renderSafely(() => (
                                          <div className="flex items-center space-x-2">
                                            {user.person_details ? 
                                              `${user.person_details.first_name} ${user.person_details.last_name}` : 
                                              user.username
                                            }
                                          </div>
                                        ))}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {user.username || ''}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Phases Tab */}
            <TabsContent value="phases" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Phase Management</CardTitle>
                  <CardDescription>
                    Manage project phases and deadlines
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1 space-y-4">
                      <h3 className="text-lg font-medium">Project Phases</h3>
                      <ScrollArea className="h-[400px] rounded-md border">
                        <div className="p-4 space-y-2">
                          {loadingPhases ? (
                            <div className="flex items-center justify-center h-32">
                              <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                          ) : phases.length > 0 ? (
                            phases.map(phase => (
                              <div 
                                key={phase.id} 
                                className={`p-3 rounded-md cursor-pointer ${
                                  selectedPhase === phase.id ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted'
                                }`}
                                onClick={() => handlePhaseSelect(phase.id)}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    {getStatusIcon(phase.status || "Not Started")}
                                    <span className="font-medium">
                                      {phase.template_details?.name || `Phase ${phase.id}`}
                                    </span>
                                  </div>
                                  <Badge variant="outline" className={getStatusBadgeClass(phase.status || "Not Started")}>
                                    {phase.status || "Not Started"}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {phase.template_details?.description || "No description available"}
                                </p>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-8 text-muted-foreground">
                              <p>No phases available for this project</p>
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </div>

                    <div className="md:col-span-2">
                      {selectedPhase ? (
                        <div className="space-y-6">
                          <h3 className="text-lg font-medium">
                            {phases.find(p => p.id === selectedPhase)?.template_details?.name || `Phase ${selectedPhase}`}
                          </h3>

                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="phaseStatus">Status</Label>
                              <Select 
                                value={phases.find(p => p.id === selectedPhase)?.status || ""}
                                onValueChange={(value) => {
                                  // In a real implementation, you would update the phase status
                                  console.log("Updating phase status to", value)
                                }}
                              >
                                <SelectTrigger id="phaseStatus">
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Not Started">Not Started</SelectItem>
                                  <SelectItem value="In Progress">In Progress</SelectItem>
                                  <SelectItem value="Completed">Completed</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="phaseResponsible">Responsible Person</Label>
                              <Select 
                                value={phaseResponsible?.toString() || ""}
                                onValueChange={handlePhaseResponsibleChange}
                              >
                                <SelectTrigger id="phaseResponsible">
                                  <SelectValue placeholder="Select responsible person" />
                                </SelectTrigger>
                                <SelectContent>
                                  {loadingUsers ? (
                                    <SelectItem value="loading" disabled>
                                      Loading users...
                                    </SelectItem>
                                  ) : (
                                    users.map(user => (
                                      <SelectItem key={user.id} value={user.id.toString()}>
                                        {user.person_details ? 
                                          `${user.person_details.first_name} ${user.person_details.last_name}` : 
                                          user.username
                                        }
                                      </SelectItem>
                                    ))
                                  )}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="phaseDeadline">Deadline</Label>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "w-full justify-start text-left font-normal",
                                      !phaseDeadline && "text-muted-foreground"
                                    )}
                                  >
                                    <Calendar className="mr-2 h-4 w-4" />
                                    {phaseDeadline ? format(phaseDeadline, "PPP") : "Select a date"}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                  <Calendar
                                    mode="single"
                                    selected={phaseDeadline}
                                    onSelect={setPhaseDeadline}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                            </div>

                            <div className="pt-4">
                              <Button onClick={handleSubmit} disabled={saving}>
                                {saving ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                  </>
                                ) : (
                                  <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Save Changes
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center p-8">
                          <Info className="h-12 w-12 text-muted-foreground opacity-40" />
                          <h3 className="mt-4 text-lg font-medium">Select a Phase</h3>
                          <p className="text-muted-foreground">
                            Select a phase from the list to view and edit its details
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Permissions Tab */}
            <TabsContent value="permissions" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Access Permissions</CardTitle>
                  <CardDescription>
                    Manage who can access and modify this project
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">User Permissions</h3>
                      <Button variant="outline" onClick={handleSubmit} disabled={saving}>
                        {saving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>View Only</TableHead>
                          <TableHead>Edit</TableHead>
                          <TableHead>Admin</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loadingUsers ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-4">
                              <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
                            </TableCell>
                          </TableRow>
                        ) : (
                          users.slice(0, 10).map(user => (
                            <TableRow key={user.id}>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback>
                                      {user.person_details ? 
                                        `${user.person_details.first_name[0]}${user.person_details.last_name[0]}` : 
                                        user.username.substring(0, 2).toUpperCase()
                                      }
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="text-sm font-medium">
                                      {renderSafely(() => (
                                        <div className="flex items-center space-x-2">
                                          {user.person_details ? 
                                            `${user.person_details.first_name} ${user.person_details.last_name}` : 
                                            user.username
                                          }
                                        </div>
                                      ))}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {user.username}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Checkbox 
                                  checked={accessPermissions.viewOnly.includes(user.id)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      handleAccessPermissionChange(user.id, 'viewOnly')
                                    }
                                  }}
                                />
                              </TableCell>
                              <TableCell>
                                <Checkbox 
                                  checked={accessPermissions.edit.includes(user.id)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      handleAccessPermissionChange(user.id, 'edit')
                                    }
                                  }}
                                />
                              </TableCell>
                              <TableCell>
                                <Checkbox 
                                  checked={accessPermissions.admin.includes(user.id)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      handleAccessPermissionChange(user.id, 'admin')
                                    }
                                  }}
                                />
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>

                    <div className="space-y-4 pt-4">
                      <h3 className="text-lg font-medium">Default Permissions</h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="allowTeamView">Allow team members to view</Label>
                          <Switch id="allowTeamView" defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="allowTeamEdit">Allow team members to edit</Label>
                          <Switch id="allowTeamEdit" defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="allowClientView">Allow client to view</Label>
                          <Switch id="allowClientView" defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="allowClientComment">Allow client to comment</Label>
                          <Switch id="allowClientComment" />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Settings</CardTitle>
                  <CardDescription>
                    Configure how you receive notifications for this project
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Email Notifications</h3>
                      <Button variant="outline" onClick={handleSubmit} disabled={saving}>
                        {saving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="emailNotifications">Email Notifications</Label>
                          <p className="text-sm text-muted-foreground">
                            Receive email notifications for this project
                          </p>
                        </div>
                        <Switch 
                          id="emailNotifications" 
                          checked={notificationSettings.emailNotifications}
                          onCheckedChange={(checked) => 
                            handleNotificationSettingChange('emailNotifications', checked)
                          }
                        />
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="phaseCompletionNotifications">Phase Completion</Label>
                          <p className="text-sm text-muted-foreground">
                            Notify when a phase is completed
                          </p>
                        </div>
                        <Switch 
                          id="phaseCompletionNotifications" 
                          checked={notificationSettings.phaseCompletionNotifications}
                          onCheckedChange={(checked) => 
                            handleNotificationSettingChange('phaseCompletionNotifications', checked)
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="documentUploadNotifications">Document Uploads</Label>
                          <p className="text-sm text-muted-foreground">
                            Notify when a document is uploaded
                          </p>
                        </div>
                        <Switch 
                          id="documentUploadNotifications" 
                          checked={notificationSettings.documentUploadNotifications}
                          onCheckedChange={(checked) => 
                            handleNotificationSettingChange('documentUploadNotifications', checked)
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="commentNotifications">Comments</Label>
                          <p className="text-sm text-muted-foreground">
                            Notify when someone comments on a document
                          </p>
                        </div>
                        <Switch 
                          id="commentNotifications" 
                          checked={notificationSettings.commentNotifications}
                          onCheckedChange={(checked) => 
                            handleNotificationSettingChange('commentNotifications', checked)
                          }
                        />
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="dailyDigest">Daily Digest</Label>
                          <p className="text-sm text-muted-foreground">
                            Receive a daily summary of project activity
                          </p>
                        </div>
                        <Switch 
                          id="dailyDigest" 
                          checked={notificationSettings.dailyDigest}
                          onCheckedChange={(checked) => 
                            handleNotificationSettingChange('dailyDigest', checked)
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="weeklyDigest">Weekly Digest</Label>
                          <p className="text-sm text-muted-foreground">
                            Receive a weekly summary of project activity
                          </p>
                        </div>
                        <Switch 
                          id="weeklyDigest" 
                          checked={notificationSettings.weeklyDigest}
                          onCheckedChange={(checked) => 
                            handleNotificationSettingChange('weeklyDigest', checked)
                          }
                        />
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

        {/* Notification Toast */}
        {notification && (
          <div
            className={`fixed bottom-4 right-4 p-4 rounded-md shadow-md z-50 flex items-center space-x-2
              ${
                notification.type === "success"
                  ? "bg-green-100 text-green-800 border border-green-200"
                  : notification.type === "error"
                    ? "bg-red-100 text-red-800 border border-red-200"
                    : "bg-blue-100 text-blue-800 border border-blue-200"
              }`}
          >
            {notification.type === "success" ? (
              <CheckCircle className="h-5 w-5" />
            ) : notification.type === "error" ? (
              <AlertCircle className="h-5 w-5" />
            ) : (
              <Info className="h-5 w-5" />
            )}
            <span>{notification.message}</span>
          </div>
        )}
      </div>
  </DashboardLayout>
  )
}
