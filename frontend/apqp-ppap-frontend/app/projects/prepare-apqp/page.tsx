"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Check, Users, Building, FileText, AlertCircle, Loader2, Plus, X } from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { teamApi, clientApi, userApi, templateApi } from "@/config/api-utils"
import type { Team, Client, User, PhaseTemplate } from "@/config/api-types"

// Define the APQP task interface
interface APQPTask {
  id: number
  title: string
  description: string
  status: "completed" | "in-progress" | "not-started"
  notes: string
}

// Define the RACI matrix item interface
interface RACIItem {
  id: number
  task: string
  engineering: "R" | "A" | "C" | "I" | ""
  quality: "R" | "A" | "C" | "I" | ""
  production: "R" | "A" | "C" | "I" | ""
  management: "R" | "A" | "C" | "I" | ""
}

export default function PrepareForAPQPPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("team")

  // State for data
  const [teams, setTeams] = useState<Team[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [phaseTemplates, setPhaseTemplates] = useState<PhaseTemplate[]>([])

  // State for form data
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [teamMembers, setTeamMembers] = useState<User[]>([])
  const [clientContacts, setClientContacts] = useState<any[]>([])
  const [clientRequirements, setClientRequirements] = useState("")

  // State for RACI matrix
  const [raciMatrix, setRaciMatrix] = useState<RACIItem[]>([
    {
      id: 1,
      task: "Design FMEA",
      engineering: "R",
      quality: "A",
      production: "C",
      management: "I",
    },
    {
      id: 2,
      task: "Process Flow Diagram",
      engineering: "C",
      quality: "I",
      production: "R",
      management: "A",
    },
    {
      id: 3,
      task: "Control Plan",
      engineering: "C",
      quality: "R",
      production: "A",
      management: "I",
    },
  ])

  // State for APQP tasks
  const [apqpTasks, setApqpTasks] = useState<APQPTask[]>([
    {
      id: 1,
      title: "Organize the Team",
      description: "Define team structure and responsibilities",
      status: "completed",
      notes: "",
    },
    {
      id: 2,
      title: "Define the Scope",
      description: "Establish project boundaries and deliverables",
      status: "in-progress",
      notes: "",
    },
    {
      id: 3,
      title: "Establish Team-to-Team Communication",
      description: "Define communication channels and protocols",
      status: "in-progress",
      notes: "",
    },
    {
      id: 4,
      title: "Provide Core Tools Training",
      description: "Ensure team members are trained on APQP tools",
      status: "not-started",
      notes: "",
    },
    {
      id: 5,
      title: "Involve Customers and Suppliers",
      description: "Establish communication with external stakeholders",
      status: "not-started",
      notes: "",
    },
    {
      id: 6,
      title: "Implement Simultaneous Engineering",
      description: "Set up parallel work streams for efficiency",
      status: "not-started",
      notes: "",
    },
    {
      id: 7,
      title: "Develop Control Plan Format",
      description: "Standardize control plan documentation",
      status: "not-started",
      notes: "",
    },
    {
      id: 8,
      title: "Decide on Concern Resolution",
      description: "Establish issue tracking and resolution process",
      status: "not-started",
      notes: "",
    },
    {
      id: 9,
      title: "Develop Product Quality Timing Plan",
      description: "Create timeline for quality milestones",
      status: "not-started",
      notes: "",
    },
  ])

  // Loading and error states
  const [loading, setLoading] = useState({
    teams: false,
    clients: false,
    users: false,
    templates: false,
    saving: false,
  })
  const [errors, setErrors] = useState({
    teams: "",
    clients: "",
    users: "",
    templates: "",
    saving: "",
  })

  // Fetch data on component mount
  useEffect(() => {
    fetchTeams()
    fetchClients()
    fetchUsers()
    fetchPhaseTemplates()
  }, [])

  // Fetch teams from API
  const fetchTeams = async () => {
    setLoading((prev) => ({ ...prev, teams: true }))
    setErrors((prev) => ({ ...prev, teams: "" }))

    try {
      const teamsData = await teamApi.getAllTeams()
      setTeams(teamsData)
    } catch (error: any) {
      console.error("Error fetching teams:", error)
      setErrors((prev) => ({ ...prev, teams: error.message || "Failed to fetch teams" }))
    } finally {
      setLoading((prev) => ({ ...prev, teams: false }))
    }
  }

  // Fetch clients from API
  const fetchClients = async () => {
    setLoading((prev) => ({ ...prev, clients: true }))
    setErrors((prev) => ({ ...prev, clients: "" }))

    try {
      const clientsData = await clientApi.getAllClients()
      setClients(clientsData)
    } catch (error: any) {
      console.error("Error fetching clients:", error)
      setErrors((prev) => ({ ...prev, clients: error.message || "Failed to fetch clients" }))
    } finally {
      setLoading((prev) => ({ ...prev, clients: false }))
    }
  }

  // Fetch users from API
  const fetchUsers = async () => {
    setLoading((prev) => ({ ...prev, users: true }))
    setErrors((prev) => ({ ...prev, users: "" }))

    try {
      const usersData = await userApi.getAllUsers()
      setUsers(Array.isArray(usersData) ? usersData : [])
    } catch (error: any) {
      console.error("Error fetching users:", error)
      setErrors((prev) => ({ ...prev, users: error.message || "Failed to fetch users" }))
    } finally {
      setLoading((prev) => ({ ...prev, users: false }))
    }
  }

  // Fetch phase templates from API
  const fetchPhaseTemplates = async () => {
    setLoading((prev) => ({ ...prev, templates: true }))
    setErrors((prev) => ({ ...prev, templates: "" }))

    try {
      const templatesData = await templateApi.getAllPhaseTemplates()
      setPhaseTemplates(Array.isArray(templatesData) ? templatesData : [])
    } catch (error: any) {
      console.error("Error fetching phase templates:", error)
      setErrors((prev) => ({ ...prev, templates: error.message || "Failed to fetch phase templates" }))
    } finally {
      setLoading((prev) => ({ ...prev, templates: false }))
    }
  }

  // Handle team selection
  const handleTeamSelect = (teamId: number) => {
    const team = teams.find((t) => t.id === teamId)
    if (team) {
      setSelectedTeam(team)
      // If team has members, populate team members
      if (team.members && team.members.length > 0) {
        setTeamMembers(
          team.members.map((member) => ({
            id: member.id,
            first_name: member.first_name,
            last_name: member.last_name,
            person_details: {
              first_name: member.first_name,
              last_name: member.last_name,
            },
          })),
        )
      }
    }
  }

  // Handle client selection
  const handleClientSelect = (clientId: number) => {
    const client = clients.find((c) => c.id === clientId)
    if (client) {
      setSelectedClient(client)
      setClientRequirements(client.description || "")

      // If client has a team, populate client contacts
      if (client.team && client.team_details && client.team_details.members) {
        setClientContacts(client.team_details.members)
      } else {
        setClientContacts([])
      }
    }
  }

  // Add a new row to RACI matrix
  const addRaciRow = () => {
    const newId = raciMatrix.length > 0 ? Math.max(...raciMatrix.map((item) => item.id)) + 1 : 1
    setRaciMatrix([
      ...raciMatrix,
      {
        id: newId,
        task: "",
        engineering: "",
        quality: "",
        production: "",
        management: "",
      },
    ])
  }

  // Update RACI matrix item
  const updateRaciItem = (id: number, field: string, value: any) => {
    setRaciMatrix(raciMatrix.map((item) => (item.id === id ? { ...item, [field]: value } : item)))
  }

  // Add a new team member
  const addTeamMember = () => {
    setTeamMembers([
      ...teamMembers,
      { id: 0, first_name: "", last_name: "", person_details: { first_name: "", last_name: "" } },
    ])
  }

  // Update team member
  const updateTeamMember = (index: number, field: string, value: string) => {
    const updatedMembers = [...teamMembers]
    if (field === "first_name" || field === "last_name") {
      updatedMembers[index] = {
        ...updatedMembers[index],
        [field]: value,
        person_details: {
          ...updatedMembers[index].person_details,
          [field]: value,
        },
      }
    } else {
      updatedMembers[index] = {
        ...updatedMembers[index],
        [field]: value,
      }
    }
    setTeamMembers(updatedMembers)
  }

  // Remove team member
  const removeTeamMember = (index: number) => {
    setTeamMembers(teamMembers.filter((_, i) => i !== index))
  }

  // Add a new client contact
  const addClientContact = () => {
    setClientContacts([...clientContacts, { id: 0, first_name: "", last_name: "", role: "", email: "" }])
  }

  // Update client contact
  const updateClientContact = (index: number, field: string, value: string) => {
    const updatedContacts = [...clientContacts]
    updatedContacts[index] = {
      ...updatedContacts[index],
      [field]: value,
    }
    setClientContacts(updatedContacts)
  }

  // Remove client contact
  const removeClientContact = (index: number) => {
    setClientContacts(clientContacts.filter((_, i) => i !== index))
  }

  // Update APQP task status
  const updateTaskStatus = (id: number, status: "completed" | "in-progress" | "not-started") => {
    setApqpTasks(apqpTasks.map((task) => (task.id === id ? { ...task, status } : task)))
  }

  // Update APQP task notes
  const updateTaskNotes = (id: number, notes: string) => {
    setApqpTasks(apqpTasks.map((task) => (task.id === id ? { ...task, notes } : task)))
  }

  // Calculate APQP preparation progress
  const calculateProgress = () => {
    const completedTasks = apqpTasks.filter((task) => task.status === "completed").length
    return Math.round((completedTasks / apqpTasks.length) * 100)
  }

  // Save preparation data
  const savePreparation = async () => {
    setLoading((prev) => ({ ...prev, saving: true }))
    setErrors((prev) => ({ ...prev, saving: "" }))

    try {
      // In a real implementation, you would save the data to the backend
      // For now, we'll simulate a successful save
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Show success message or redirect
      router.push("/projects")
    } catch (error: any) {
      console.error("Error saving preparation:", error)
      setErrors((prev) => ({ ...prev, saving: error.message || "Failed to save preparation" }))
    } finally {
      setLoading((prev) => ({ ...prev, saving: false }))
    }
  }

  // Generate preparation report
  const generateReport = async () => {
    try {
      // In a real implementation, you would generate a report
      // For now, we'll simulate a successful report generation
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Show success message or download report
      alert("Report generated successfully!")
    } catch (error: any) {
      console.error("Error generating report:", error)
      alert(`Failed to generate report: ${error.message}`)
    }
  }

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Prepare for APQP</h2>
          <Button onClick={savePreparation} disabled={loading.saving}>
            {loading.saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" /> Save Preparation
              </>
            )}
          </Button>
        </div>

        {errors.saving && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{errors.saving}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="md:col-span-3">
            <CardHeader className="pb-2">
              <CardTitle>Preparation Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Overall Progress</span>
                  <span className="text-sm font-medium">{calculateProgress()}%</span>
                </div>
                <Progress value={calculateProgress()} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Tasks</CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="team">Setup RACI Matrix & Team</TabsTrigger>
            <TabsTrigger value="client">Define Client & Client's Team</TabsTrigger>
            <TabsTrigger value="tasks">APQP Preparation Tasks</TabsTrigger>
          </TabsList>

          <TabsContent value="team" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>RACI Matrix</CardTitle>
                <CardDescription>
                  Define responsibilities using the RACI matrix (Responsible, Accountable, Consulted, Informed)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {errors.teams && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{errors.teams}</AlertDescription>
                  </Alert>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="border p-2 text-left">Task/Deliverable</th>
                        <th className="border p-2 text-center">Engineering</th>
                        <th className="border p-2 text-center">Quality</th>
                        <th className="border p-2 text-center">Production</th>
                        <th className="border p-2 text-center">Management</th>
                        <th className="border p-2 text-center w-10">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {raciMatrix.map((item) => (
                        <tr key={item.id}>
                          <td className="border p-2">
                            <Input
                              value={item.task}
                              onChange={(e) => updateRaciItem(item.id, "task", e.target.value)}
                              placeholder="Enter task or deliverable"
                            />
                          </td>
                          <td className="border p-2 text-center">
                            <select
                              className="w-full bg-transparent"
                              value={item.engineering}
                              onChange={(e) => updateRaciItem(item.id, "engineering", e.target.value)}
                            >
                              <option value="">-</option>
                              <option value="R">R</option>
                              <option value="A">A</option>
                              <option value="C">C</option>
                              <option value="I">I</option>
                            </select>
                          </td>
                          <td className="border p-2 text-center">
                            <select
                              className="w-full bg-transparent"
                              value={item.quality}
                              onChange={(e) => updateRaciItem(item.id, "quality", e.target.value)}
                            >
                              <option value="">-</option>
                              <option value="R">R</option>
                              <option value="A">A</option>
                              <option value="C">C</option>
                              <option value="I">I</option>
                            </select>
                          </td>
                          <td className="border p-2 text-center">
                            <select
                              className="w-full bg-transparent"
                              value={item.production}
                              onChange={(e) => updateRaciItem(item.id, "production", e.target.value)}
                            >
                              <option value="">-</option>
                              <option value="R">R</option>
                              <option value="A">A</option>
                              <option value="C">C</option>
                              <option value="I">I</option>
                            </select>
                          </td>
                          <td className="border p-2 text-center">
                            <select
                              className="w-full bg-transparent"
                              value={item.management}
                              onChange={(e) => updateRaciItem(item.id, "management", e.target.value)}
                            >
                              <option value="">-</option>
                              <option value="R">R</option>
                              <option value="A">A</option>
                              <option value="C">C</option>
                              <option value="I">I</option>
                            </select>
                          </td>
                          <td className="border p-2 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setRaciMatrix(raciMatrix.filter((i) => i.id !== item.id))}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 text-sm text-muted-foreground">
                  <p>R = Responsible, A = Accountable, C = Consulted, I = Informed</p>
                </div>
                <Button className="mt-4" onClick={addRaciRow}>
                  <Plus className="mr-2 h-4 w-4" /> Add Row
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Team Setup</CardTitle>
                <CardDescription>Define the team members and their roles</CardDescription>
              </CardHeader>
              <CardContent>
                {errors.teams && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{errors.teams}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="team-select">Select Existing Team</Label>
                      <select
                        id="team-select"
                        className="w-full p-2 border rounded-md"
                        onChange={(e) => handleTeamSelect(Number(e.target.value))}
                        value={selectedTeam?.id || ""}
                      >
                        <option value="">Select a team</option>
                        {teams.map((team) => (
                          <option key={team.id} value={team.id}>
                            {team.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="team-name">Team Name</Label>
                      <Input
                        id="team-name"
                        placeholder="Enter team name"
                        value={selectedTeam?.name || ""}
                        onChange={(e) => setSelectedTeam((prev) => (prev ? { ...prev, name: e.target.value } : null))}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Team Members</Label>
                      <Button size="sm" onClick={addTeamMember}>
                        <Users className="mr-2 h-4 w-4" /> Add Member
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {teamMembers.map((member, index) => (
                        <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-md">
                          <div className="space-y-2">
                            <Label htmlFor={`member-first-name-${index}`}>First Name</Label>
                            <Input
                              id={`member-first-name-${index}`}
                              placeholder="Enter first name"
                              value={member.first_name || ""}
                              onChange={(e) => updateTeamMember(index, "first_name", e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`member-last-name-${index}`}>Last Name</Label>
                            <Input
                              id={`member-last-name-${index}`}
                              placeholder="Enter last name"
                              value={member.last_name || ""}
                              onChange={(e) => updateTeamMember(index, "last_name", e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`member-role-${index}`}>Role</Label>
                            <Input
                              id={`member-role-${index}`}
                              placeholder="Enter role"
                              value={member.role || ""}
                              onChange={(e) => updateTeamMember(index, "role", e.target.value)}
                            />
                          </div>
                          <div className="flex items-end">
                            <Button
                              variant="outline"
                              size="sm"
                              className="ml-auto"
                              onClick={() => removeTeamMember(index)}
                            >
                              <X className="h-4 w-4 mr-2" /> Remove
                            </Button>
                          </div>
                        </div>
                      ))}

                      {teamMembers.length === 0 && (
                        <div className="text-center p-4 border rounded-md text-muted-foreground">
                          No team members added yet. Click "Add Member" to add team members.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="client" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Client Information</CardTitle>
                <CardDescription>Define the client and their requirements</CardDescription>
              </CardHeader>
              <CardContent>
                {errors.clients && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{errors.clients}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="client-select">Select Existing Client</Label>
                      <select
                        id="client-select"
                        className="w-full p-2 border rounded-md"
                        onChange={(e) => handleClientSelect(Number(e.target.value))}
                        value={selectedClient?.id || ""}
                      >
                        <option value="">Select a client</option>
                        {clients.map((client) => (
                          <option key={client.id} value={client.id}>
                            {client.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="client-name">Client Name</Label>
                      <Input
                        id="client-name"
                        placeholder="Enter client name"
                        value={selectedClient?.name || ""}
                        onChange={(e) => setSelectedClient((prev) => (prev ? { ...prev, name: e.target.value } : null))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="client-requirements">Client Requirements</Label>
                    <Textarea
                      id="client-requirements"
                      placeholder="Enter client requirements"
                      rows={4}
                      value={clientRequirements}
                      onChange={(e) => setClientRequirements(e.target.value)}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Client Team</Label>
                      <Button size="sm" onClick={addClientContact}>
                        <Building className="mr-2 h-4 w-4" /> Add Client Contact
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {clientContacts.map((contact, index) => (
                        <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-md">
                          <div className="space-y-2">
                            <Label htmlFor={`client-contact-name-${index}`}>Name</Label>
                            <Input
                              id={`client-contact-name-${index}`}
                              placeholder="Enter name"
                              value={`${contact.first_name || ""} ${contact.last_name || ""}`}
                              onChange={(e) => {
                                const [firstName, ...lastNameParts] = e.target.value.split(" ")
                                const lastName = lastNameParts.join(" ")
                                updateClientContact(index, "first_name", firstName || "")
                                updateClientContact(index, "last_name", lastName || "")
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`client-contact-role-${index}`}>Role</Label>
                            <Input
                              id={`client-contact-role-${index}`}
                              placeholder="Enter role"
                              value={contact.role || ""}
                              onChange={(e) => updateClientContact(index, "role", e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`client-contact-email-${index}`}>Email</Label>
                            <Input
                              id={`client-contact-email-${index}`}
                              placeholder="Enter email"
                              value={contact.email || ""}
                              onChange={(e) => updateClientContact(index, "email", e.target.value)}
                            />
                          </div>
                          <div className="flex items-end">
                            <Button
                              variant="outline"
                              size="sm"
                              className="ml-auto"
                              onClick={() => removeClientContact(index)}
                            >
                              <X className="h-4 w-4 mr-2" /> Remove
                            </Button>
                          </div>
                        </div>
                      ))}

                      {clientContacts.length === 0 && (
                        <div className="text-center p-4 border rounded-md text-muted-foreground">
                          No client contacts added yet. Click "Add Client Contact" to add contacts.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>APQP Preparation Tasks</CardTitle>
                <CardDescription>Complete these tasks to prepare for the APQP process</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {apqpTasks.map((task) => (
                    <div key={task.id} className="p-4 border rounded-md">
                      <div className="flex items-start">
                        <div className="flex h-5 items-center">
                          <Checkbox
                            id={`task-${task.id}`}
                            checked={task.status === "completed"}
                            onCheckedChange={(checked) => {
                              updateTaskStatus(task.id, checked ? "completed" : "not-started")
                            }}
                          />
                        </div>
                        <div className="ml-3 flex-1">
                          <div className="flex items-center justify-between">
                            <Label htmlFor={`task-${task.id}`} className="font-medium">
                              {task.id}. {task.title}
                            </Label>
                            <Badge
                              variant="outline"
                              className={
                                task.status === "completed"
                                  ? "bg-green-100 text-green-800 border-green-300"
                                  : task.status === "in-progress"
                                    ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                                    : "bg-gray-100 text-gray-800 border-gray-300"
                              }
                            >
                              {task.status === "completed"
                                ? "Completed"
                                : task.status === "in-progress"
                                  ? "In Progress"
                                  : "Not Started"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{task.description}</p>
                          <div className="mt-2">
                            <Textarea
                              placeholder="Add notes here..."
                              rows={2}
                              value={task.notes}
                              onChange={(e) => updateTaskNotes(task.id, e.target.value)}
                            />
                          </div>
                          {task.status !== "completed" && task.status !== "in-progress" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-2"
                              onClick={() => updateTaskStatus(task.id, "in-progress")}
                            >
                              Start Task
                            </Button>
                          )}
                          {task.status === "in-progress" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-2"
                              onClick={() => updateTaskStatus(task.id, "completed")}
                            >
                              Complete Task
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex justify-end">
                  <Button onClick={generateReport}>
                    <FileText className="mr-2 h-4 w-4" /> Generate Preparation Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
