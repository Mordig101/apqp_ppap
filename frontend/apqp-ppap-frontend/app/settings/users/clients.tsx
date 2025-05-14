"use client"

import type React from "react"
import type { Client, TeamMember, ClientCreateRequest, ClientUpdateRequest } from "@/config/api-types"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { clientApi, teamApi } from "@/config/api-utils"
import { toast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { 
  Pen, 
  Plus, 
  Search, 
  Trash2, 
  UserPlus, 
  Users, 
  Phone, 
  Mail, 
  MapPin, 
  Code, 
  Building, 
  Info 
} from "lucide-react"
import { Separator } from "@/components/ui/separator"

export function ClientsTab() {
  // Client state
  const [clients, setClients] = useState<Client[]>([])
  const [clientSearchTerm, setClientSearchTerm] = useState("")
  const [clientSortField, setClientSortField] = useState<"name" | "address">("name")
  const [clientSortDirection, setClientSortDirection] = useState<"asc" | "desc">("asc")
  const [isAddClientDialogOpen, setIsAddClientDialogOpen] = useState(false)
  const [isEditClientDialogOpen, setIsEditClientDialogOpen] = useState(false)
  const [isDeleteClientDialogOpen, setIsDeleteClientDialogOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)

  // Enhanced client state
  const [newClient, setNewClient] = useState<ClientCreateRequest>({
    name: "",
    address: "",
    description: "",
    code: {},
    contact: {
      email: "",
      phone: "",
      address: "",
    },
    team: {
      name: "",
      description: "",
    },
    team_members: [],
  })

  const [teams, setTeams] = useState<any[]>([])
  // Add state to track client teams specifically
  const [clientTeams, setClientTeams] = useState<any[]>([])
  const [isViewTeamDetailsDialogOpen, setIsViewTeamDetailsDialogOpen] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<any>(null)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [isViewClientDetailsDialogOpen, setIsViewClientDetailsDialogOpen] = useState(false)
  const [isAddTeamMemberDialogOpen, setIsAddTeamMemberDialogOpen] = useState(false)
  const [newTeamMember, setNewTeamMember] = useState<TeamMember>({
    first_name: "",
    last_name: "",
    role: "",
    contact: {
      email: "",
      phone: "",
      address: "",
    },
  })

  // Shared state
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch data on component mount
  useEffect(() => {
    fetchClients()
    fetchTeams()
  }, [])

  // Fetch clients from API
  const fetchClients = async () => {
    setLoading(true);
    setError("");
    try {
      // Get clients directly as an array now
      const clientsData = await clientApi.getAllClients();
      setClients(clientsData);
    } catch (err) {
      console.error("Error fetching clients:", err);
      setError("Failed to fetch clients. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch teams - updated to filter for client teams
  const fetchTeams = async () => {
    try {
      const allTeams = await teamApi.getAllTeams();
      
      // Store all teams
      setTeams(allTeams);
      
      // Filter for client teams only (is_user_team=false)
      const onlyClientTeams = allTeams.filter(team => !team.is_user_team);
      setClientTeams(onlyClientTeams);
      
    } catch (err) {
      console.error("Error fetching teams:", err);
      toast({
        title: "Error",
        description: "Failed to fetch teams.",
        variant: "destructive",
      });
    }
  };

  // Add this function to fetch team members for a selected team
  const fetchTeamMembersById = (teamId: number | null) => {
    if (!teamId) {
      setTeamMembers([]);
      return;
    }
    
    // Find the team in the already-loaded teams data
    const selectedTeamData = teams.find(team => team.id === teamId);
    
    // Update team members if team data is found with members
    if (selectedTeamData && selectedTeamData.members) {
      setTeamMembers(
        selectedTeamData.members.map((member: any) => ({
          id: member.id,
          first_name: member.first_name,
          last_name: member.last_name,
          role: member.role || "",
          contact: {
            email: member.contact_details?.email || "",
            phone: member.contact_details?.phone || "",
            address: member.contact_details?.address || "",
          },
        }))
      );
    } else {
      setTeamMembers([]);
    }
  };

  // Handle client sort
  const handleClientSort = (field: "name" | "address") => {
    if (clientSortField === field) {
      setClientSortDirection(clientSortDirection === "asc" ? "desc" : "asc")
    } else {
      setClientSortField(field)
      setClientSortDirection("asc")
    }
  }

  // Sort and filter clients
  const filteredClients = clients.filter((client) => {
    const searchString = clientSearchTerm.toLowerCase()
    return (
      client.name.toLowerCase().includes(searchString) ||
      (client.address || "").toLowerCase().includes(searchString) ||
      (client.description || "").toLowerCase().includes(searchString)
    )
  })

  // Sort clients
  const sortedClients = [...filteredClients].sort((a, b) => {
    if (clientSortField === "name") {
      return clientSortDirection === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
    } else if (clientSortField === "address") {
      const addressA = a.address || ""
      const addressB = b.address || ""
      return clientSortDirection === "asc" ? addressA.localeCompare(addressB) : addressB.localeCompare(addressA)
    }
    return 0
  })

  // Handle client input change
  const handleClientInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target

    // Handle nested properties
    if (name.includes(".")) {
      const [parent, child] = name.split(".")
      setNewClient((prev) => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as Record<string, any> || {}),
          [child]: value,
        },
      }))
    } else {
      setNewClient((prev) => ({ ...prev, [name]: value }))
    }
  }

  // Handle client select change
  const handleClientSelectChange = (name: string, value: any) => {
    // Handle nested properties
    if (name.includes(".")) {
      const [parent, child] = name.split(".")
      setNewClient((prev) => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as Record<string, any> || {}),
          [child]: value,
        },
      }))
    } else if (name === "team_id") {
      // Special handling for selecting an existing team
      const teamId = Number.parseInt(value)
      if (teamId) {
        // Clear the team name/description since we're using an existing team
        setNewClient((prev) => ({
          ...prev,
          team_id: teamId,
          team: { name: "", description: "" },
        }))
      } else {
        setNewClient((prev) => ({
          ...prev,
          team_id: undefined,
        }))
      }
    } else {
      setNewClient((prev) => ({ ...prev, [name]: value }))
    }
  }

  // Team member functions
  const addTeamMember = () => {
    if (!newTeamMember.first_name || !newTeamMember.last_name) {
      toast({
        title: "Validation Error",
        description: "First name and last name are required for team members",
        variant: "destructive",
      })
      return
    }

    setTeamMembers([...teamMembers, { ...newTeamMember }])
    setNewTeamMember({
      first_name: "",
      last_name: "",
      role: "",
      contact: {
        email: "",
        phone: "",
        address: "",
      },
    })
    setIsAddTeamMemberDialogOpen(false)
  }

  const removeTeamMember = (index: number) => {
    const updatedMembers = [...teamMembers]
    updatedMembers.splice(index, 1)
    setTeamMembers(updatedMembers)
  }

  const handleTeamMemberInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target

    // Handle nested properties
    if (name.includes(".")) {
      const [parent, child] = name.split(".")
      setNewTeamMember((prev) => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as Record<string, any> || {}),
          [child]: value,
        },
      }))
    } else {
      setNewTeamMember((prev) => ({ ...prev, [name]: value }))
    }
  }

  // Handle client creation with enhanced data
  const handleAddClient = async () => {
    try {
      // Validation
      if (!newClient.name) {
        toast({
          title: "Validation Error",
          description: "Client name is required",
          variant: "destructive",
        })
        return
      }

      setLoading(true)

      // Prepare client data
      const clientData: ClientCreateRequest = {
        name: newClient.name,
        address: newClient.address || undefined,
        description: newClient.description || undefined,
        code: newClient.code || {},
        contact: {
          email: newClient.contact?.email || "",
          phone: newClient.contact?.phone || "",
          address: newClient.contact?.address || newClient.address || "",
        },
      }

      // Handle team creation or selection
      if (newClient.team_id) {
        clientData.team_id = newClient.team_id
      } else if (newClient.team?.name) {
        clientData.team = {
          name: newClient.team.name,
          description: newClient.team.description,
          is_user_team: false // Mark as client team explicitly
        }
      }

      // Add team members if any
      if (teamMembers.length > 0) {
        clientData.team_members = teamMembers
      }

      const response = await clientApi.createClient(clientData)

      // Update clients list
      setClients([...clients, response])

      // Reset form and close dialog
      setIsAddClientDialogOpen(false)
      setNewClient({
        name: "",
        address: "",
        description: "",
        code: {},
        contact: {
          email: "",
          phone: "",
          address: "",
        },
        team: {
          name: "",
          description: "",
        },
      })
      setTeamMembers([])

      toast({
        title: "Success",
        description: "Client created successfully",
      })
    } catch (err) {
      console.error("Error adding client:", err)
      toast({
        title: "Error",
        description: "Failed to add client. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Handle client update
  const handleEditClient = async () => {
    if (!selectedClient) return

    try {
      setLoading(true)

      // Prepare update data
      const updateData: ClientUpdateRequest = {
        name: selectedClient.name,
        address: selectedClient.address || undefined, // Convert null to undefined
        description: selectedClient.description || undefined, // Convert null to undefined
        code: selectedClient.code || {},
      };

      // Add contact data if available
      if (selectedClient.contact_details) {
        updateData.contact = {
          email: selectedClient.contact_details.email,
          phone: selectedClient.contact_details.phone,
          address: selectedClient.contact_details.address,
        }
      }

      // Handle team data
      if (selectedClient.team) {
        updateData.team_id = selectedClient.team
      }

      // Add team members if dialog was opened for editing
      if (teamMembers.length > 0) {
        updateData.team_members = teamMembers
        updateData.replace_all_members = true // Replace all existing members
      }

      const response = await clientApi.updateClient(selectedClient.id, updateData)

      // Update clients list
      setClients(clients.map((client) => (client.id === selectedClient.id ? response : client)))

      // Close dialog
      setIsEditClientDialogOpen(false)
      setSelectedClient(null)
      setTeamMembers([])

      toast({
        title: "Success",
        description: "Client updated successfully",
      })
    } catch (err) {
      console.error("Error updating client:", err)
      toast({
        title: "Error",
        description: "Failed to update client. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Opens the edit client dialog with pre-populated data
  const openEditClientDialog = (client: Client) => {
    setSelectedClient(client)
    setIsEditClientDialogOpen(true)

    // Initialize team members if client has a team with members
    if (client.team_details?.members) {
      setTeamMembers(
        client.team_details.members.map((member) => ({
          id: member.id,
          first_name: member.first_name,
          last_name: member.last_name,
          role: member.role || "",
          contact: {
            email: member.contact_details?.email || "",
            phone: member.contact_details?.phone || "",
            address: member.contact_details?.address || "",
          },
        })),
      )
    } else {
      setTeamMembers([])
    }
  }

  // View client details
  const openClientDetailsDialog = (client: Client) => {
    setSelectedClient(client)
    setIsViewClientDetailsDialogOpen(true)
  }

  // View team details
  const openTeamDetailsDialog = (team: any) => {
    setSelectedTeam(team)
    setIsViewTeamDetailsDialogOpen(true)
  }

  // Handle client deletion
  const handleDeleteClient = async () => {
    if (!selectedClient) return

    try {
      setLoading(true)

      await clientApi.deleteClient(selectedClient.id)

      // Update clients list
      setClients(clients.filter((client) => client.id !== selectedClient.id))

      // Close dialog
      setIsDeleteClientDialogOpen(false)
      setSelectedClient(null)

      toast({
        title: "Success",
        description: "Client deleted successfully",
      })
    } catch (err) {
      console.error("Error deleting client:", err)
      toast({
        title: "Error",
        description: "Failed to delete client. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Opens the delete client confirmation dialog
  const openDeleteClientDialog = (client: Client) => {
    setSelectedClient(client)
    setIsDeleteClientDialogOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clients..."
            className="pl-8"
            value={clientSearchTerm}
            onChange={(e) => setClientSearchTerm(e.target.value)}
          />
        </div>
        
        <Dialog open={isAddClientDialogOpen} onOpenChange={setIsAddClientDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Client
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Add New Client</DialogTitle>
              <DialogDescription>Create a new client with contact information and team.</DialogDescription>
            </DialogHeader>
            
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="client-info">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    <span>Client Information</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid gap-4 py-2">
                    <div className="space-y-2">
                      <Label htmlFor="client_name">
                        Client Name <span className="text-red-500">*</span>
                      </Label>
                      <Input 
                        id="client_name" 
                        name="name" 
                        value={newClient.name} 
                        onChange={handleClientInputChange} 
                        required 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="client_address">Address</Label>
                      <Input 
                        id="client_address" 
                        name="address" 
                        value={newClient.address} 
                        onChange={handleClientInputChange} 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="client_description">Description</Label>
                      <Textarea 
                        id="client_description" 
                        name="description" 
                        value={newClient.description} 
                        onChange={handleClientInputChange}
                        rows={3}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="client_code_duns">DUNS Number</Label>
                      <Input 
                        id="client_code_duns" 
                        name="code.DUNS" 
                        value={newClient.code?.DUNS || ""} 
                        onChange={handleClientInputChange} 
                        placeholder="e.g., 123456789"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="client_code_fiscal">Fiscal Code</Label>
                      <Input 
                        id="client_code_fiscal" 
                        name="code.Fiscal" 
                        value={newClient.code?.Fiscal || ""} 
                        onChange={handleClientInputChange} 
                        placeholder="e.g., FC-123456"
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="contact-info">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span>Contact Information</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid gap-4 py-2">
                    <div className="space-y-2">
                      <Label htmlFor="client_email">Email</Label>
                      <Input 
                        id="client_email" 
                        name="contact.email" 
                        type="email"
                        value={newClient.contact?.email || ""} 
                        onChange={handleClientInputChange} 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="client_phone">Phone</Label>
                      <Input 
                        id="client_phone" 
                        name="contact.phone" 
                        value={newClient.contact?.phone || ""} 
                        onChange={handleClientInputChange} 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="client_contact_address">Contact Address</Label>
                      <Input 
                        id="client_contact_address" 
                        name="contact.address" 
                        value={newClient.contact?.address || ""} 
                        onChange={handleClientInputChange} 
                        placeholder="Leave empty to use client address"
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="team-info">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>Team Information</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid gap-4 py-2">
                    <div className="space-y-2">
                      <Label htmlFor="client_team_select">Select Existing Team</Label>
                      <Select
                        value={newClient.team_id ? String(newClient.team_id) : ""}
                        onValueChange={(value) => handleClientSelectChange("team_id", value ? Number.parseInt(value) : "")}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a team or create new" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">Create New Team</SelectItem>
                          {clientTeams.map((team) => (
                            <SelectItem key={team.id} value={team.id.toString()}>
                              {team.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {!newClient.team_id && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="client_team_name">New Team Name</Label>
                          <Input 
                            id="client_team_name" 
                            name="team.name" 
                            value={newClient.team?.name || ""} 
                            onChange={handleClientInputChange} 
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="client_team_description">Team Description</Label>
                          <Textarea 
                            id="client_team_description" 
                            name="team.description" 
                            value={newClient.team?.description || ""} 
                            onChange={handleClientInputChange}
                            rows={2}
                          />
                        </div>
                      </>
                    )}
                    
                    <div className="pt-2">
                      <div className="flex items-center justify-between mb-2">
                        <Label>Team Members</Label>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setIsAddTeamMemberDialogOpen(true)}
                        >
                          <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                          Add Member
                        </Button>
                      </div>
                      
                      {teamMembers.length === 0 ? (
                        <div className="text-sm text-muted-foreground py-3 text-center border rounded-md">
                          No team members added yet
                        </div>
                      ) : (
                        <div className="border rounded-md">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {teamMembers.map((member, index) => (
                                <TableRow key={index}>
                                  <TableCell>
                                    {member.first_name} {member.last_name}
                                  </TableCell>
                                  <TableCell>{member.role || "N/A"}</TableCell>
                                  <TableCell>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeTeamMember(index)}
                                    >
                                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddClientDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddClient} disabled={loading}>
                {loading ? "Creating..." : "Create Client"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Add Team Member Dialog */}
        <Dialog open={isAddTeamMemberDialogOpen} onOpenChange={setIsAddTeamMemberDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Team Member</DialogTitle>
              <DialogDescription>Add a new member to the client's team.</DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="member_first_name">
                    First Name <span className="text-red-500">*</span>
                  </Label>
                  <Input 
                    id="member_first_name" 
                    name="first_name" 
                    value={newTeamMember.first_name} 
                    onChange={handleTeamMemberInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="member_last_name">
                    Last Name <span className="text-red-500">*</span>
                  </Label>
                  <Input 
                    id="member_last_name" 
                    name="last_name" 
                    value={newTeamMember.last_name} 
                    onChange={handleTeamMemberInputChange}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="member_role">Role</Label>
                <Input 
                  id="member_role" 
                  name="role" 
                  value={newTeamMember.role} 
                  onChange={handleTeamMemberInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="member_email">Email</Label>
                <Input 
                  id="member_email" 
                  name="contact.email" 
                  type="email"
                  value={newTeamMember.contact.email} 
                  onChange={handleTeamMemberInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="member_phone">Phone</Label>
                <Input 
                  id="member_phone" 
                  name="contact.phone" 
                  value={newTeamMember.contact.phone} 
                  onChange={handleTeamMemberInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="member_address">Address</Label>
                <Input 
                  id="member_address" 
                  name="contact.address" 
                  value={newTeamMember.contact.address} 
                  onChange={handleTeamMemberInputChange}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddTeamMemberDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={addTeamMember}>
                Add Member
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer" onClick={() => handleClientSort("name")}>
                  Name {clientSortField === "name" && (clientSortDirection === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleClientSort("address")}>
                  Address {clientSortField === "address" && (clientSortDirection === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Team</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && clients.length === 0 ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-red-500">
                    {error}
                  </TableCell>
                </TableRow>
              ) : sortedClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    {clientSearchTerm ? "No matching clients found" : "No clients found"}
                  </TableCell>
                </TableRow>
              ) : (
                sortedClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <Button 
                        variant="link" 
                        className="p-0 h-auto font-medium text-left"
                        onClick={() => openClientDetailsDialog(client)}
                      >
                        {client.name}
                      </Button>
                    </TableCell>
                    <TableCell>{client.address || "N/A"}</TableCell>
                    <TableCell>
                      {client.contact_details ? (
                        <div className="flex flex-col">
                          {client.contact_details.email && (
                            <span className="text-xs flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {client.contact_details.email}
                            </span>
                          )}
                          {client.contact_details.phone && (
                            <span className="text-xs flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {client.contact_details.phone}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">No contact info</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {client.team_details ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto py-1 px-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                          onClick={() => openTeamDetailsDialog(client.team_details)}
                        >
                          <Users className="h-3.5 w-3.5 mr-1.5" />
                          {client.team_details.name}
                          {client.team_details.members && (
                            <Badge variant="secondary" className="ml-2">
                              {client.team_details.members.length}
                            </Badge>
                          )}
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-sm">No team</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditClientDialog(client)}
                        >
                          <Pen className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => openDeleteClientDialog(client)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Client Dialog */}
      {selectedClient && (
        <Dialog open={isEditClientDialogOpen} onOpenChange={setIsEditClientDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Edit Client</DialogTitle>
              <DialogDescription>Update client information.</DialogDescription>
            </DialogHeader>
            
            <Accordion type="single" collapsible className="w-full" defaultValue="client-info">
              <AccordionItem value="client-info">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    <span>Client Information</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid gap-4 py-2">
                    <div className="space-y-2">
                      <Label htmlFor="edit_client_name">Client Name</Label>
                      <Input
                        id="edit_client_name"
                        value={selectedClient.name}
                        onChange={(e) => setSelectedClient({...selectedClient, name: e.target.value})}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="edit_client_address">Address</Label>
                      <Input
                        id="edit_client_address"
                        value={selectedClient.address || ""}
                        onChange={(e) => setSelectedClient({...selectedClient, address: e.target.value})}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="edit_client_description">Description</Label>
                      <Textarea
                        id="edit_client_description"
                        value={selectedClient.description || ""}
                        onChange={(e) => setSelectedClient({...selectedClient, description: e.target.value})}
                        rows={3}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit_client_code_duns">DUNS Number</Label>
                        <Input
                          id="edit_client_code_duns"
                         value={selectedClient.code?.DUNS || ""}
                          onChange={(e) => setSelectedClient({
                            ...selectedClient, 
                            code: { ...selectedClient.code, DUNS: e.target.value }
                          })}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="edit_client_code_fiscal">Fiscal Code</Label>
                        <Input
                          id="edit_client_code_fiscal"
                          value={selectedClient.code?.Fiscal || ""}
                          onChange={(e) => setSelectedClient({
                            ...selectedClient, 
                            code: { ...selectedClient.code, Fiscal: e.target.value }
                          })}
                        />
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="contact-info">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span>Contact Information</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid gap-4 py-2">
                    <div className="space-y-2">
                      <Label htmlFor="edit_client_email">Email</Label>
                      <Input
                        id="edit_client_email"
                        type="email"
                        value={selectedClient.contact_details?.email || ""}
                        onChange={(e) => setSelectedClient({
                          ...selectedClient,
                          contact_details: {
                            ...(selectedClient.contact_details || {}),
                            id: selectedClient.contact_details?.id || "",
                            email: e.target.value,
                            phone: selectedClient.contact_details?.phone || "",
                            address: selectedClient.contact_details?.address || "",
                            type: selectedClient.contact_details?.type || "client"
                          }
                        })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="edit_client_phone">Phone</Label>
                      <Input
                        id="edit_client_phone"
                        value={selectedClient.contact_details?.phone || ""}
                        onChange={(e) => setSelectedClient({
                          ...selectedClient,
                          contact_details: {
                            ...(selectedClient.contact_details || {}),
                            id: selectedClient.contact_details?.id || "",
                            email: selectedClient.contact_details?.email || "",
                            phone: e.target.value,
                            address: selectedClient.contact_details?.address || "",
                            type: selectedClient.contact_details?.type || "client"
                          }
                        })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="edit_client_contact_address">Contact Address</Label>
                      <Input
                        id="edit_client_contact_address"
                        value={selectedClient.contact_details?.address || ""}
                        onChange={(e) => setSelectedClient({
                          ...selectedClient,
                          contact_details: {
                            ...(selectedClient.contact_details || {}),
                            id: selectedClient.contact_details?.id || "",
                            email: selectedClient.contact_details?.email || "",
                            phone: selectedClient.contact_details?.phone || "",
                            address: e.target.value,
                            type: selectedClient.contact_details?.type || "client"
                          }
                        })}
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="team-info">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>Team Information</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid gap-4 py-2">
                    <div className="space-y-2">
                      <Label htmlFor="edit_client_team">Team</Label>
                      <Select
                        value={selectedClient.team?.toString() || "none"}
                        onValueChange={(value) => {
                          const newTeamId = value === "none" ? null : Number.parseInt(value);
                          
                          // Update selected client with new team
                          setSelectedClient({
                            ...selectedClient,
                            team: newTeamId
                          });
                          
                          // Fetch and update team members for the selected team
                          fetchTeamMembersById(newTeamId);
                        }}
                      >
                        <SelectTrigger id="edit_client_team">
                          <SelectValue placeholder="No team" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Team</SelectItem>
                          {clientTeams.map((team) => (
                            <SelectItem key={team.id} value={team.id.toString()}>
                              {team.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="pt-2">
                      <div className="flex items-center justify-between mb-2">
                        <Label>Team Members</Label>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setIsAddTeamMemberDialogOpen(true)}
                        >
                          <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                          Add Member
                        </Button>
                      </div>
                      
                      {teamMembers.length === 0 ? (
                        <div className="text-sm text-muted-foreground py-3 text-center border rounded-md">
                          No team members added yet
                        </div>
                      ) : (
                        <div className="border rounded-md">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {teamMembers.map((member, index) => (
                                <TableRow key={index}>
                                  <TableCell>
                                    {member.first_name} {member.last_name}
                                  </TableCell>
                                  <TableCell>{member.role || "N/A"}</TableCell>
                                  <TableCell>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeTeamMember(index)}
                                    >
                                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditClientDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditClient} disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Team Details Dialog */}
      {selectedTeam && (
        <Dialog open={isViewTeamDetailsDialogOpen} onOpenChange={setIsViewTeamDetailsDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {selectedTeam.name}
              </DialogTitle>
              <DialogDescription>
                {selectedTeam.description || "No description provided"}
              </DialogDescription>
            </DialogHeader>
            
            <div className="mt-4">
              <h3 className="text-lg font-medium mb-2">Team Members</h3>
              
              {!selectedTeam.members || selectedTeam.members.length === 0 ? (
                <div className="text-muted-foreground text-center py-8 border rounded-md">
                  No team members found for this team
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedTeam.members.map((member: any) => (
                    <Card key={member.id}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">{member.first_name} {member.last_name}</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <Badge className="mb-2">{member.role || "Team Member"}</Badge>
                        
                        {member.contact_details && (
                          <div className="space-y-1 text-sm">
                            {member.contact_details.email && (
                              <div className="flex items-center gap-2">
                                <Mail className="h-3 w-3" />
                                {member.contact_details.email}
                              </div>
                            )}
                            {member.contact_details.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="h-3 w-3" />
                                {member.contact_details.phone}
                              </div>
                            )}
                            {member.contact_details.address && (
                              <div className="flex items-start gap-2">
                                <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                                <span>{member.contact_details.address}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Client Details Dialog */}
      {selectedClient && (
        <Dialog open={isViewClientDetailsDialogOpen} onOpenChange={setIsViewClientDetailsDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                {selectedClient.name}
              </DialogTitle>
              <DialogDescription>
                {selectedClient.description || "No description provided"}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div>
                <h3 className="text-md font-medium mb-2 flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Client Information
                </h3>
                <div className="space-y-2">
                  {selectedClient.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <span>{selectedClient.address}</span>
                    </div>
                  )}
                  
                  {(selectedClient.code?.DUNS || selectedClient.code?.Fiscal) && (
                    <div className="flex items-start gap-2">
                      <Code className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="space-y-1">
                        {selectedClient.code?.DUNS && <div><span className="font-medium">DUNS:</span> {selectedClient.code.DUNS}</div>}
                        {selectedClient.code?.Fiscal && <div><span className="font-medium">Fiscal Code:</span> {selectedClient.code.Fiscal}</div>}
                      </div>
                    </div>
                  )}
                  
                  {selectedClient.contact_details && (
                    <>
                      <Separator />
                      <h4 className="font-medium">Contact Details</h4>
                      {selectedClient.contact_details.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {selectedClient.contact_details.email}
                        </div>
                      )}
                      {selectedClient.contact_details.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          {selectedClient.contact_details.phone}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-md font-medium mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Team
                </h3>
                
                {selectedClient.team_details ? (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">{selectedClient.team_details.name}</h4>
                      {selectedClient.team_details.members && (
                        <Badge variant="secondary">
                          {selectedClient.team_details.members.length} Member{selectedClient.team_details.members.length !== 1 && 's'}
                        </Badge>
                      )}
                    </div>
                    
                    {selectedClient.team_details.description && (
                      <p className="text-sm text-muted-foreground">
                        {selectedClient.team_details.description}
                      </p>
                    )}
                    
                    <Separator />
                    
                    {selectedClient.team_details.members && selectedClient.team_details.members.length > 0 ? (
                      <div className="space-y-3 mt-2">
                        {selectedClient.team_details.members.map((member) => (
                          <div key={member.id} className="border rounded-md p-3">
                            <div className="font-medium">{member.first_name} {member.last_name}</div>
                            {member.role && <div className="text-sm">{member.role}</div>}
                            
                            {member.contact_details && (
                              <div className="text-xs mt-1.5 space-y-1">
                                {member.contact_details.email && (
                                  <div className="flex items-center gap-1.5">
                                    <Mail className="h-3 w-3 text-muted-foreground" />
                                    {member.contact_details.email}
                                  </div>
                                )}
                                {member.contact_details.phone && (
                                  <div className="flex items-center gap-1.5">
                                    <Phone className="h-3 w-3 text-muted-foreground" />
                                    {member.contact_details.phone}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-center text-muted-foreground py-4">
                        No team members assigned
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground py-4 border rounded-md text-center">
                    No team assigned to this client
                  </div>
                )}
              </div>
            </div>
            
            {selectedClient.history_details && (
              <div className="mt-6">
                <h3 className="text-md font-medium mb-2">History</h3>
                <div className="border rounded-md p-4">
                  <div className="text-sm">
                    <div><span className="font-medium">Created:</span> {new Date(selectedClient.history_details.created_at).toLocaleString()}</div>
                    {selectedClient.history_details.updated_at && (
                      <div><span className="font-medium">Last Updated:</span> {new Date(selectedClient.history_details.updated_at).toLocaleString()}</div>
                    )}
                  </div>
                  
                  {selectedClient.history_details.events && selectedClient.history_details.events.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium text-sm mb-2">Events</h4>
                      <div className="space-y-2 text-sm">
                        {selectedClient.history_details.events.map((event, i) => (
                          <div key={i} className="flex gap-2 items-start">
                            <div className="h-2 w-2 bg-slate-300 rounded-full mt-1.5" />
                            <div>
                              <div>{event.details}</div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(event.timestamp).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button onClick={() => setIsViewClientDetailsDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Client Confirmation Dialog */}
      {selectedClient && (
        <Dialog open={isDeleteClientDialogOpen} onOpenChange={setIsDeleteClientDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Client</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete {selectedClient.name}?
                This will also remove all associated team members and data. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteClientDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteClient} disabled={loading}>
                {loading ? "Deleting..." : "Delete Client"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}