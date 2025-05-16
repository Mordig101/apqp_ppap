"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
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
import { teamApi, personApi, projectApi, clientApi } from "@/config/api-utils"
import { toast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Pen, 
  Plus, 
  Search, 
  Trash2, 
  UserPlus, 
  Users, 
  UserCheck,
  Building, 
  Filter,
  Phone,
  Mail,
  ExternalLink
} from "lucide-react"
import { Switch } from "@/components/ui/switch"
import Link from "next/link"
import type { 
  Person,
  PersonCreateRequest,
  PersonUpdateRequest,
  Team,
  TeamCreateRequest,
  TeamUpdateRequest,
  Project 
} from "@/config/api-types"

interface TeamsTabProps {
  teamType: 'client' | 'organization';
}
// Add right after your imports, before TeamsTabProps interface
interface TeamPerson extends Person {
    // Add properties that are needed but not in the base Person type
    role?: string;
    username?: string;
    password?: string;
    is_active?: boolean;
    // Add these for newly created members that don't have proper Person structure yet
    contact?: {
      email?: string;
      phone?: string;
      address?: string;
    };
  }
  
  // Define a type for members as stored in the Team
  type TeamMemberType = TeamPerson | {
    id?: number;
    first_name: string;
    last_name: string;
    role?: string;
    is_user?: boolean;
    contact_details?: {
      email?: string;
      phone?: string;
      address?: string;
    };
    contact?: {
      email?: string;
      phone?: string;
      address?: string;
    };
    username?: string;
    password?: string;
    is_active?: boolean;
  };

export function TeamsTab({ teamType }: TeamsTabProps) {
  // Teams state
  const [teams, setTeams] = useState<(Team & { members?: TeamMemberType[] })[]>([]);
  const [teamSearchTerm, setTeamSearchTerm] = useState("")
  const [teamSortField, setTeamSortField] = useState<"name" | "members">("name")
  const [teamSortDirection, setTeamSortDirection] = useState<"asc" | "desc">("asc")
  const [isAddTeamDialogOpen, setIsAddTeamDialogOpen] = useState(false)
  const [isEditTeamDialogOpen, setIsEditTeamDialogOpen] = useState(false)
  const [isDeleteTeamDialogOpen, setIsDeleteTeamDialogOpen] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<Team & { members?: TeamMemberType[] } | null>(null);
  const [isViewTeamDetailsDialogOpen, setIsViewTeamDetailsDialogOpen] = useState(false)
  const [isAddTeamMemberDialogOpen, setIsAddTeamMemberDialogOpen] = useState(false)
  const [teamProjects, setTeamProjects] = useState<Record<number, Project[]>>({})
  const [clientsMap, setClientsMap] = useState<Record<number, string>>({})

  // New team state - using TeamCreateRequest directly
  const [newTeam, setNewTeam] = useState<TeamCreateRequest>({
    name: "",
    description: "",
    is_user_team: teamType === 'organization',
    members: []
  })

  // For creating a new team member
  const [newTeamMember, setNewTeamMember] = useState<TeamMemberType>({
    first_name: "",
    last_name: "",
    username: "",
    password: "",
    role: "",
    contact: {
      email: "",
      phone: "",
      address: ""
    }
  })

  // Available people list - using Person type directly
  const [availablePeople, setAvailablePeople] = useState<TeamPerson[]>([]);

  // Shared state
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // State for team member editing
  const [isEditMemberDialogOpen, setIsEditMemberDialogOpen] = useState(false);
  const [memberBeingEdited, setMemberBeingEdited] = useState<any>(null);

  // Fetch data on component mount
  useEffect(() => {
    fetchTeams()
    fetchAvailablePeople()
    if (teamType === 'client') {
      fetchClients()
    }
  }, [teamType])

  // Fetch clients to map team to client names
  const fetchClients = async () => {
    try {
      const clients = await clientApi.getAllClients();
      const clientsMapping: Record<number, string> = {};
      
      clients.forEach(client => {
        if (client.team_details?.id) {
          clientsMapping[client.team_details.id] = client.name;
        }
      });
      
      setClientsMap(clientsMapping);
    } catch (error) {
      console.error("Error fetching clients:", error);
    }
  };

  // Fetch teams from API - now separated by team type
  const fetchTeams = async () => {
    setLoading(true)
    setError(null)
    try {
      let teamsData: Team[];
      
      // Use the appropriate API function based on team type
      if (teamType === 'organization') {
        // Get only teams with is_user_team=true
        teamsData = await teamApi.getUserTeams();
      } else {
        // Get only teams with is_user_team=false
        teamsData = await teamApi.getClientTeams();
      }
      
      setTeams(teamsData);
      
      // Fetch projects for each team if this is organization teams
      if (teamType === 'organization') {
        const projectsMap: Record<number, Project[]> = {};
        
        for (const team of teamsData) {
          try {
            const projects = await teamApi.getTeamProjects(team.id);
            projectsMap[team.id] = projects;
          } catch (err) {
            console.error(`Error fetching projects for team ${team.id}:`, err);
            projectsMap[team.id] = [];
          }
        }
        
        setTeamProjects(projectsMap);
      }
    } catch (err) {
      console.error("Error fetching teams:", err)
      setError("Failed to fetch teams. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Fetch people who can be added to teams - filtered by is_user flag
  const fetchAvailablePeople = async () => {
    try {
      // For organization teams, get only users (is_user=true)
      // For client teams, get only non-users (is_user=false)
      if (teamType === 'organization') {
        const people = await personApi.getUserPeople();
        setAvailablePeople(people);
      } else {
        const people = await personApi.getNonUserPeople();
        setAvailablePeople(people);
      }
    } catch (err) {
      console.error("Error fetching people:", err)
      toast({
        title: "Error",
        description: "Failed to fetch people for team member selection.",
        variant: "destructive",
      })
    }
  }

  // Handle team sort
  const handleTeamSort = (field: "name" | "members") => {
    if (teamSortField === field) {
      setTeamSortDirection(teamSortDirection === "asc" ? "desc" : "asc")
    } else {
      setTeamSortField(field)
      setTeamSortDirection("asc")
    }
  }

  // Sort and filter teams
  const filteredTeams = teams.filter((team) => {
    const searchMatch = teamSearchTerm.toLowerCase() === "" || 
      team.name.toLowerCase().includes(teamSearchTerm.toLowerCase()) ||
      (team.description || "").toLowerCase().includes(teamSearchTerm.toLowerCase())
    
    return searchMatch
  })

  // Sort teams
  const sortedTeams = [...filteredTeams].sort((a, b) => {
    if (teamSortField === "name") {
      return teamSortDirection === "asc" 
        ? a.name.localeCompare(b.name) 
        : b.name.localeCompare(a.name)
    } else if (teamSortField === "members") {
      const countA = a.members?.length || 0
      const countB = b.members?.length || 0
      return teamSortDirection === "asc" 
        ? countA - countB 
        : countB - countA
    }
    return 0
  })

  // Handle team input change
  const handleTeamInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setNewTeam((prev) => ({ ...prev, [name]: value }))
  }

  // Handle team member input change
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

  // Replace your current addTeamMember function with this version

// Add team member
const addTeamMember = () => {
    // Validation depends on team type
    if (teamType === 'organization') {
      // For user teams, require username and password
      if (!newTeamMember.first_name || !newTeamMember.last_name || !newTeamMember.username || !newTeamMember.password) {
        toast({
          title: "Validation Error",
          description: "First name, last name, username and password are required for user team members",
          variant: "destructive",
        })
        return
      }
    } else {
      // For client teams, just require names
      if (!newTeamMember.first_name || !newTeamMember.last_name) {
        toast({
          title: "Validation Error",
          description: "First name and last name are required for team members",
          variant: "destructive",
        })
        return
      }
    }
  
    // Add the new member to the team using the correct structure for TeamCreateRequest
    setNewTeam((prev: TeamCreateRequest): TeamCreateRequest => {
      // Convert contact to the format expected by TeamMember
      const memberToAdd = {
        first_name: newTeamMember.first_name,
        last_name: newTeamMember.last_name,
        role: newTeamMember.role || "",
        // Convert contact structure to match API expectations
        contact: {
          email: newTeamMember.contact?.email || "",
          phone: newTeamMember.contact?.phone || "",
          address: newTeamMember.contact?.address || ""
        },
        // Include user-specific fields if needed
        ...(teamType === 'organization' ? {
          username: newTeamMember.username,
          password: newTeamMember.password,
          is_active: true
        } : {})
      };
      
      return {
        ...prev,
        members: [...(prev.members || []), memberToAdd]
      };
    });
  
    // Reset form
    setNewTeamMember({
      first_name: "",
      last_name: "",
      username: "",
      password: "",
      role: "",
      contact: {
        email: "",
        phone: "",
        address: "",
      }
    })
  
    setIsAddTeamMemberDialogOpen(false)
  }

  // Add existing person as team member
  const addExistingPerson = (personId: number) => {
    const person = availablePeople.find(p => p.id === personId);
    if (!person) return;
  
    // Add the person to the team members by ID
    setNewTeam(prev => ({
      ...prev,
      members: [...(prev.members || []), { 
        id: person.id,
        first_name: person.first_name || "",
        last_name: person.last_name || "",
        role: person.role || "",
        is_user: person.is_user,
        contact: {
          email: person.contact_details?.email || "",
          phone: person.contact_details?.phone || "",
          address: person.contact_details?.address || ""
        }
      }]
    }));
  }

  // Remove team member
  const removeTeamMember = (index: number) => {
    setNewTeam((prev: TeamCreateRequest) => ({
        ...prev,
        members: (prev.members || []).filter((_, i) => i !== index)
      }));
  }

  // Handle team creation using TeamCreateRequest
  const handleAddTeam = async () => {
    try {
      // Validation
      if (!newTeam.name) {
        toast({
          title: "Validation Error",
          description: "Team name is required",
          variant: "destructive",
        })
        return
      }

      setLoading(true)

      // Create team with members - set is_user_team based on teamType
      const createRequest: TeamCreateRequest = {
        ...newTeam,
        is_user_team: teamType === 'organization'
      };
      
      const response = await teamApi.createTeam(createRequest);

      // Update teams list with proper type casting
      setTeams([...teams, response as Team])

      // Reset form and close dialog
      setIsAddTeamDialogOpen(false)
      setNewTeam({
        name: "",
        description: "",
        is_user_team: teamType === 'organization',
        members: []
      })

      toast({
        title: "Success",
        description: "Team created successfully",
      })
    } catch (err) {
      console.error("Error adding team:", err)
      toast({
        title: "Error",
        description: "Failed to add team. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Open the edit team dialog
  const openEditTeamDialog = (team: Team) => {
    setSelectedTeam(team)
    setIsEditTeamDialogOpen(true)
  }

  // Handle team update with members using TeamUpdateRequest type
  const handleEditTeam = async () => {
    if (!selectedTeam) return;
  
    try {
      setLoading(true);
  
      // Prepare member data for API
      // Prepare member data for API
    const memberData = selectedTeam.members?.map(member => {
        if ('id' in member && member.id) {
        // For existing members, just include their ID and optional role
        return { 
            id: member.id,
            ...('role' in member && member.role ? { member_type: member.role } : {})
        };
        } else {
        // For new members, include all necessary data
        const newMember: Record<string, any> = {
            first_name: member.first_name,
            last_name: member.last_name,
        };
        
        // Add role if available
        if ('role' in member && member.role) {
            newMember.role = member.role;
        }
        
        // Include user-specific fields for user teams
        if (teamType === 'organization') {
            if ('username' in member && member.username) {
            newMember.username = member.username;
            }
            if ('password' in member && member.password) {
            newMember.password = member.password;
            }
            newMember.is_active = true;
        }
        
        // Include contact info if available
        if (member.contact_details) {
            newMember.contact = {
            email: member.contact_details.email || "",
            phone: member.contact_details.phone || "",
            address: member.contact_details.address || ""
            };
        } else if ('contact' in member && member.contact) {
            const contactObj = member.contact as Record<string, string>;
            newMember.contact = {
            email: contactObj.email || "",
            phone: contactObj.phone || "",
            address: contactObj.address || ""
            };
        }
        
        return newMember;
        }
    });
  
      // Create update data using TeamUpdateRequest type
      const updateData: TeamUpdateRequest = {
        name: selectedTeam.name,
        description: selectedTeam.description,
        is_user_team: teamType === 'organization',
        members: memberData,
        replace_all_members: true // Replace all existing members with the new list
      };
  
      const response = await teamApi.updateTeam(selectedTeam.id, updateData);
  
      // Update teams list
      setTeams(teams.map((team) => (team.id === selectedTeam.id ? response : team)));
  
      // Close dialog
      setIsEditTeamDialogOpen(false);
      setSelectedTeam(null);
  
      toast({
        title: "Success",
        description: "Team updated successfully",
      });
    } catch (err) {
      console.error("Error updating team:", err);
      toast({
        title: "Error",
        description: "Failed to update team. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle team deletion
  const handleDeleteTeam = async () => {
    if (!selectedTeam) return

    try {
      setLoading(true)

      await teamApi.deleteTeam(selectedTeam.id)

      // Update teams list
      setTeams(teams.filter((team) => team.id !== selectedTeam.id))

      // Close dialog
      setIsDeleteTeamDialogOpen(false)
      setSelectedTeam(null)

      toast({
        title: "Success",
        description: "Team deleted successfully",
      })
    } catch (err) {
      console.error("Error deleting team:", err)
      toast({
        title: "Error",
        description: "Failed to delete team. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // View team details
  const openTeamDetailsDialog = (team: Team) => {
    setSelectedTeam(team)
    setIsViewTeamDetailsDialogOpen(true)
  }

  // Opens the delete team confirmation dialog
  const openDeleteTeamDialog = (team: Team) => {
    setSelectedTeam(team)
    setIsDeleteTeamDialogOpen(true)
  }

  // Function to handle member edit button click
  const handleEditMember = (member: any) => {
    setMemberBeingEdited({
      ...member,
      contact: {
        email: member.contact_details?.email || "",
        phone: member.contact_details?.phone || "",
        address: member.contact_details?.address || ""
      }
    });
    setIsEditMemberDialogOpen(true);
  };

  // Function to save edited member
  const saveEditedMember = () => {
    if (!memberBeingEdited || !selectedTeam) return;
    
    // Update member in selectedTeam
    const updatedMembers = selectedTeam.members?.map(member => {
      if (member.id === memberBeingEdited.id) {
        // Define existing contact details with proper typing
        const existingContactDetails: {
          email?: string;
          phone?: string;
          address?: string;
        } = member.contact_details || {};
        
        return {
          ...member,
          first_name: memberBeingEdited.first_name,
          last_name: memberBeingEdited.last_name,
          role: memberBeingEdited.role || (member as any).role || "",
          contact_details: {
            ...existingContactDetails,
            email: memberBeingEdited.contact?.email || existingContactDetails.email || "",
            phone: memberBeingEdited.contact?.phone || existingContactDetails.phone || "",
            address: memberBeingEdited.contact?.address || existingContactDetails.address || ""
          }
        };
      }
      return member;
    });
    
    setSelectedTeam({
      ...selectedTeam,
      members: updatedMembers as typeof selectedTeam.members
    });
    
    // Close dialog
    setIsEditMemberDialogOpen(false);
    setMemberBeingEdited(null);
    
    toast({
      title: "Member Updated",
      description: "Team member details have been updated."
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search teams..."
              className="pl-8"
              value={teamSearchTerm}
              onChange={(e) => setTeamSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <Dialog open={isAddTeamDialogOpen} onOpenChange={setIsAddTeamDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add {teamType === 'organization' ? 'Organization' : 'Client'} Team
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Add New {teamType === 'organization' ? 'Organization' : 'Client'} Team</DialogTitle>
              <DialogDescription>Create a new team with members.</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="team_name">
                  Team Name <span className="text-red-500">*</span>
                </Label>
                <Input 
                  id="team_name" 
                  name="name" 
                  value={newTeam.name} 
                  onChange={handleTeamInputChange} 
                  required 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="team_description">Description</Label>
                <Textarea 
                  id="team_description" 
                  name="description" 
                  value={newTeam.description} 
                  onChange={handleTeamInputChange}
                  rows={3}
                />
              </div>
              
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <h3 className="font-medium">Team Members</h3>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setIsAddTeamMemberDialogOpen(true)}
                    >
                      <Plus className="h-3.5 w-3.5 mr-1.5" />
                      Create New
                    </Button>
                    
                    <Select
                      onValueChange={(value) => {
                        if (value !== "select") {
                          addExistingPerson(parseInt(value));
                        }
                      }}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Add Existing Person" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="select" disabled>Select a person</SelectItem>
                        {availablePeople.map((person) => (
                          <SelectItem key={person.id} value={person.id.toString()}>
                            {person.first_name} {person.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {(newTeam.members?.length || 0) === 0 ? (
                  <div className="text-sm text-muted-foreground py-6 text-center border rounded-md">
                    No team members added yet
                  </div>
                ) : (
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Role</TableHead>
                          {teamType === 'organization' && <TableHead>Username</TableHead>}
                          <TableHead>Contact</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {newTeam.members?.map((member, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              {member.id ? (
                                // Existing person
                                availablePeople.find(p => p.id === member.id)?.first_name + ' ' +
                                availablePeople.find(p => p.id === member.id)?.last_name
                              ) : (
                                // New person
                                `${member.first_name} ${member.last_name}`
                              )}
                            </TableCell>
                            <TableCell>
                              {member.id ? (
                                // Existing person's role
                                availablePeople.find(p => p.id === member.id)?.role || "N/A"
                              ) : (
                                // New person's role
                                member.role || "N/A"
                              )}
                            </TableCell>
                            {teamType === 'organization' && (
                              <TableCell>
                                {member.id ? (
                                  // Existing user's username
                                  availablePeople.find(p => p.id === member.id)?.username || "N/A"
                                ) : (
                                  // New user's username
                                  member.username || "N/A"
                                )}
                              </TableCell>
                            )}
                            <TableCell>
                              {member.contact?.email && (
                                <div className="flex items-center gap-1 text-xs">
                                  <Mail className="h-3 w-3" />
                                  {member.contact.email}
                                </div>
                              )}
                              {member.contact?.phone && (
                                <div className="flex items-center gap-1 text-xs mt-1">
                                  <Phone className="h-3 w-3" />
                                  {member.contact.phone}
                                </div>
                              )}
                            </TableCell>
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
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddTeamDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddTeam} disabled={loading}>
                {loading ? "Creating..." : "Create Team"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Add Team Member Dialog */}
        <Dialog open={isAddTeamMemberDialogOpen} onOpenChange={setIsAddTeamMemberDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Team Member</DialogTitle>
              <DialogDescription>
                {teamType === 'organization' 
                  ? "Add a new user as a team member." 
                  : "Add a new person as a team member."}
              </DialogDescription>
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
              
              {teamType === 'organization' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="member_username">
                      Username <span className="text-red-500">*</span>
                    </Label>
                    <Input 
                      id="member_username" 
                      name="username" 
                      value={newTeamMember.username} 
                      onChange={handleTeamMemberInputChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="member_password">
                      Password <span className="text-red-500">*</span>
                    </Label>
                    <Input 
                      id="member_password" 
                      name="password"
                      type="password"
                      value={newTeamMember.password} 
                      onChange={handleTeamMemberInputChange}
                      required
                    />
                  </div>
                </>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="member_email">Email</Label>
                <Input 
                  id="member_email" 
                  name="contact.email" 
                  type="email"
                  value={newTeamMember.contact?.email} 
                  onChange={handleTeamMemberInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="member_phone">Phone</Label>
                <Input 
                  id="member_phone" 
                  name="contact.phone" 
                  value={newTeamMember.contact?.phone} 
                  onChange={handleTeamMemberInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="member_address">Address</Label>
                <Input 
                  id="member_address" 
                  name="contact.address" 
                  value={newTeamMember.contact?.address} 
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
                <TableHead className="cursor-pointer" onClick={() => handleTeamSort("name")}>
                  Team Name {teamSortField === "name" && (teamSortDirection === "asc" ? "↑" : "↓")}
                </TableHead>
                {teamType === 'client' && (
                  <TableHead>Client</TableHead>
                )}
                {teamType === 'organization' && (
                  <TableHead>Projects</TableHead>
                )}
                <TableHead className="cursor-pointer" onClick={() => handleTeamSort("members")}>
                  Members {teamSortField === "members" && (teamSortDirection === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && teams.length === 0 ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={teamType === 'organization' ? 5 : 5} className="h-24 text-center text-red-500">
                    {error}
                  </TableCell>
                </TableRow>
              ) : sortedTeams.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={teamType === 'organization' ? 5 : 5} className="h-24 text-center">
                    {teamSearchTerm ? "No matching teams found" : "No teams found"}
                  </TableCell>
                </TableRow>
              ) : (
                sortedTeams.map((team) => (
                  <TableRow key={team.id}>
                    <TableCell>
                      <Button 
                        variant="link" 
                        className="p-0 h-auto font-medium text-left"
                        onClick={() => openTeamDetailsDialog(team)}
                      >
                        {team.name}
                      </Button>
                    </TableCell>
                    {teamType === 'client' && (
                      <TableCell>
                        {clientsMap[team.id] ? (
                          <span>{clientsMap[team.id]}</span>
                        ) : (
                          <span className="text-muted-foreground text-xs">No client</span>
                        )}
                      </TableCell>
                    )}
                    {teamType === 'organization' && (
                      <TableCell>
                        {teamProjects[team.id]?.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            {teamProjects[team.id]?.slice(0, 3).map(project => (
                              <Link 
                                href={`/projects/${project.id}`} 
                                key={project.id}
                                className="flex items-center text-xs text-blue-500 hover:underline"
                              >
                                {project.name}
                                <ExternalLink className="h-3 w-3 ml-1" />
                              </Link>
                            ))}
                            {teamProjects[team.id]?.length > 3 && (
                              <span className="text-xs text-muted-foreground">
                                +{teamProjects[team.id].length - 3} more
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">No projects</span>
                        )}
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="flex items-center">
                        <Users className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                        {team.members?.length || 0}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[300px] truncate">
                      {team.description || "No description"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditTeamDialog(team)}
                        >
                          <Pen className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => openDeleteTeamDialog(team)}
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

      {/* Edit Team Dialog */}
      {selectedTeam && (
        <Dialog open={isEditTeamDialogOpen} onOpenChange={setIsEditTeamDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit {teamType === 'organization' ? 'Organization' : 'Client'} Team</DialogTitle>
              <DialogDescription>Update team information and manage team members.</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* Team Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Team Information</h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit_team_name">
                      Team Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="edit_team_name"
                      value={selectedTeam.name}
                      onChange={(e) => setSelectedTeam({...selectedTeam, name: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit_team_description">Description</Label>
                    <Textarea
                      id="edit_team_description"
                      value={selectedTeam.description || ""}
                      onChange={(e) => setSelectedTeam({...selectedTeam, description: e.target.value})}
                      rows={2}
                    />
                  </div>
                </div>
              </div>
              
              {/* Team Members Management Section */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Team Members
                  </h3>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        // Reset new team member form
                        setNewTeamMember({
                          first_name: "",
                          last_name: "",
                          username: "",
                          password: "",
                          role: "",
                          contact: {
                            email: "",
                            phone: "",
                            address: ""
                          }
                        });
                        setIsAddTeamMemberDialogOpen(true);
                      }}
                    >
                      <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                      Add New Member
                    </Button>
                    
                    <Select
                      onValueChange={(value) => {
                        if (value !== "select") {
                          // Add existing person to the team
                          const personId = parseInt(value);
                          const person = availablePeople.find(p => p.id === personId);
                          
                          if (person) {
                            // Check if person is already in the team
                            const isAlreadyMember = selectedTeam.members?.some(
                              member => member.id === personId
                            );
                            
                            if (!isAlreadyMember) {
                              // Add person to team members
                              setSelectedTeam({
                                ...selectedTeam,
                                members: [
                                  ...(selectedTeam.members || []),
                                  {
                                    id: person.id,
                                    first_name: person.first_name,
                                    last_name: person.last_name,
                                    role: person.role || "",
                                    is_user: person.is_user,
                                    contact_details: person.contact_details
                                  }
                                ]
                              });
                              
                              toast({
                                title: "Member Added",
                                description: `${person.first_name} ${person.last_name} added to team.`,
                              });
                            } else {
                              toast({
                                title: "Already a Member",
                                description: `${person.first_name} ${person.last_name} is already in this team.`,
                                variant: "destructive",
                              });
                            }
                          }
                        }
                      }}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Add Existing Person" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="select" disabled>Select a person</SelectItem>
                        {availablePeople
                          .filter(person => !selectedTeam.members?.some(member => member.id === person.id))
                          .map((person) => (
                            <SelectItem key={person.id} value={person.id.toString()}>
                              {person.first_name} {person.last_name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* Team Members List */}
                {(!selectedTeam.members || selectedTeam.members.length === 0) ? (
                  <div className="text-center py-8 border rounded-md text-muted-foreground">
                    No team members found
                  </div>
                ) : (
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedTeam.members.map((member, index) => (
                          <TableRow key={member.id || `new-member-${index}`}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {member.first_name} {member.last_name}
                                {member.is_user && (
                                  <Badge variant="secondary" className="ml-1">User</Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{(member as any).role || "N/A"}</TableCell>
                            <TableCell>
                              {member.contact_details?.email && (
                                <div className="flex items-center gap-1 text-xs">
                                  <Mail className="h-3 w-3" />
                                  {member.contact_details.email}
                                </div>
                              )}
                              {member.contact_details?.phone && (
                                <div className="flex items-center gap-1 text-xs mt-1">
                                  <Phone className="h-3 w-3" />
                                  {member.contact_details.phone}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditMember(member)}
                                >
                                  <Pen className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    // Remove member from team
                                    setSelectedTeam({
                                      ...selectedTeam,
                                      members: selectedTeam.members?.filter((_, i) => 
                                        member.id ? _.id !== member.id : i !== index
                                      )
                                    });
                                    
                                    toast({
                                      title: "Member Removed",
                                      description: `${member.first_name} ${member.last_name} removed from team.`,
                                    });
                                  }}
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
                
                <div className="text-xs text-muted-foreground">
                  Team member changes will be saved when you click "Save Changes".
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditTeamDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditTeam} disabled={loading}>
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
                <Badge variant={teamType === 'organization' ? "secondary" : "outline"} className="ml-2">
                  {teamType === 'organization' ? 'Organization' : 'Client'} Team
                </Badge>
              </DialogTitle>
              <DialogDescription>
                {selectedTeam.description || "No description provided"}
              </DialogDescription>
            </DialogHeader>
            
            {/* For client teams, show client info if available */}
            {teamType === 'client' && clientsMap[selectedTeam.id] && (
              <div className="mt-2 py-2 px-4 bg-muted rounded-md">
                <h4 className="text-sm font-medium">Client</h4>
                <p>{clientsMap[selectedTeam.id]}</p>
              </div>
            )}
            
            {/* For organization teams, show projects if available */}
            {teamType === 'organization' && teamProjects[selectedTeam.id]?.length > 0 && (
              <div className="mt-2">
                <h3 className="text-md font-medium mb-2">Projects</h3>
                <div className="grid gap-2">
                  {teamProjects[selectedTeam.id].map(project => (
                    <div key={project.id} className="border rounded-md p-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{project.name}</p>
                          <p className="text-sm text-muted-foreground">{project.description}</p>
                        </div>
                        <Link href={`/projects/${project.id}`}>
                          <Button size="sm" variant="outline">
                            View <ExternalLink className="h-3 w-3 ml-1" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="mt-4">
              <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Team Members
              </h3>
              
              {!selectedTeam.members || selectedTeam.members.length === 0 ? (
                <div className="text-muted-foreground text-center py-8 border rounded-md">
                  No team members found
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedTeam.members.map((member: any) => (
                    <Card key={member.id}>
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{member.first_name} {member.last_name}</h4>
                              {member.is_user && (
                                <Badge className="mt-0" variant="secondary">User</Badge>
                              )}
                            </div>
                            {member.role && <div className="text-sm">{member.role}</div>}
                          </div>
                          
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
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button onClick={() => setIsViewTeamDetailsDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Add Team Member Dialog for Edit */}
      {selectedTeam && (
        <Dialog open={isAddTeamMemberDialogOpen} onOpenChange={setIsAddTeamMemberDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Team Member</DialogTitle>
              <DialogDescription>
                {teamType === 'organization' 
                  ? "Add a new user as a team member." 
                  : "Add a new person as a team member."}
              </DialogDescription>
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
              
              {teamType === 'organization' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="member_username">
                      Username <span className="text-red-500">*</span>
                    </Label>
                    <Input 
                      id="member_username" 
                      name="username" 
                      value={newTeamMember.username} 
                      onChange={handleTeamMemberInputChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="member_password">
                      Password <span className="text-red-500">*</span>
                    </Label>
                    <Input 
                      id="member_password" 
                      name="password"
                      type="password"
                      value={newTeamMember.password} 
                      onChange={handleTeamMemberInputChange}
                      required
                    />
                  </div>
                </>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="member_email">Email</Label>
                <Input 
                  id="member_email" 
                  name="contact.email" 
                  type="email"
                  value={newTeamMember.contact?.email} 
                  onChange={handleTeamMemberInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="member_phone">Phone</Label>
                <Input 
                  id="member_phone" 
                  name="contact.phone" 
                  value={newTeamMember.contact?.phone} 
                  onChange={handleTeamMemberInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="member_address">Address</Label>
                <Input 
                  id="member_address" 
                  name="contact.address" 
                  value={newTeamMember.contact?.address} 
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
      )}

      {/* Edit Team Member Dialog */}
      {memberBeingEdited && (
        <Dialog open={isEditMemberDialogOpen} onOpenChange={setIsEditMemberDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Team Member</DialogTitle>
              <DialogDescription>
                Update information for this team member.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_member_first_name">First Name</Label>
                  <Input 
                    id="edit_member_first_name" 
                    value={memberBeingEdited.first_name} 
                    onChange={(e) => setMemberBeingEdited({
                      ...memberBeingEdited,
                      first_name: e.target.value
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_member_last_name">Last Name</Label>
                  <Input 
                    id="edit_member_last_name" 
                    value={memberBeingEdited.last_name} 
                    onChange={(e) => setMemberBeingEdited({
                      ...memberBeingEdited,
                      last_name: e.target.value
                    })}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit_member_role">Role</Label>
                <Input 
                  id="edit_member_role" 
                  value={memberBeingEdited.role || ''} 
                  onChange={(e) => setMemberBeingEdited({
                    ...memberBeingEdited,
                    role: e.target.value
                  })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit_member_email">Email</Label>
                <Input 
                  id="edit_member_email" 
                  type="email"
                  value={memberBeingEdited.contact?.email || ''} 
                  onChange={(e) => setMemberBeingEdited({
                    ...memberBeingEdited,
                    contact: {
                      ...memberBeingEdited.contact,
                      email: e.target.value
                    }
                  })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit_member_phone">Phone</Label>
                <Input 
                  id="edit_member_phone" 
                  value={memberBeingEdited.contact?.phone || ''} 
                  onChange={(e) => setMemberBeingEdited({
                    ...memberBeingEdited,
                    contact: {
                      ...memberBeingEdited.contact,
                      phone: e.target.value
                    }
                  })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit_member_address">Address</Label>
                <Input 
                  id="edit_member_address" 
                  value={memberBeingEdited.contact?.address || ''} 
                  onChange={(e) => setMemberBeingEdited({
                    ...memberBeingEdited,
                    contact: {
                      ...memberBeingEdited.contact,
                      address: e.target.value
                    }
                  })}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditMemberDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={saveEditedMember}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Team Confirmation Dialog */}
      {selectedTeam && (
        <Dialog open={isDeleteTeamDialogOpen} onOpenChange={setIsDeleteTeamDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Team</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete {selectedTeam.name}?
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteTeamDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteTeam} disabled={loading}>
                {loading ? "Deleting..." : "Delete Team"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}