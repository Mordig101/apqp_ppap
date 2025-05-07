"use client"

import type React from "react"
import type { User, Client } from "@/config/api-types"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { AlertTriangle, Edit, MoreHorizontal, Plus, Search, Trash2, UserPlus, Users } from 'lucide-react'
import { userApi, clientApi } from "@/config/api-utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "@/components/ui/use-toast"

export default function UsersAndClientsPage() {
  const [activeTab, setActiveTab] = useState("users")
  const [users, setUsers] = useState<User[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false)
  const [isAddClientDialogOpen, setIsAddClientDialogOpen] = useState(false)
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false)
  const [isEditClientDialogOpen, setIsEditClientDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    password: "",
    is_staff: false,
    is_superuser: false,
  })
  const [newClient, setNewClient] = useState({
    name: "",
    address: "",
    description: "",
  })

  useEffect(() => {
    fetchData()
  }, [activeTab])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
  
      if (activeTab === "users") {
        const response = await userApi.getAllUsers()
        
        // Check if response is paginated
        if (response.results) {
          // Handle paginated response
          setUsers(Array.isArray(response.results) ? response.results : [])
        } else {
          // Handle non-paginated response
          setUsers(Array.isArray(response) ? response : [])
        }
      } else if (activeTab === "clients") {
        const response = await clientApi.getAllClients()
        
        // Check if response is paginated
        if (response.results) {
          // Handle paginated response
          setClients(Array.isArray(response.results) ? response.results : [])
        } else {
          // Handle non-paginated response
          setClients(Array.isArray(response) ? response : [])
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data")
      console.error(`Error fetching ${activeTab}:`, err)
      toast({
        title: "Error",
        description: `Failed to fetch ${activeTab}. Please try again.`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    setSearchTerm("")
  }

  const handleUserInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setNewUser({
      ...newUser,
      [name]: value,
    })
  }

  const handleClientInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setNewClient({
      ...newClient,
      [name]: value,
    })
  }

  const handleAddUser = async () => {
    try {
      setLoading(true)
      const response = await userApi.createUser(newUser)
      
      setUsers([...users, response])
      setIsAddUserDialogOpen(false)
      setNewUser({
        username: "",
        email: "",
        first_name: "",
        last_name: "",
        password: "",
        is_staff: false,
        is_superuser: false,
      })
      
      toast({
        title: "Success",
        description: "User created successfully",
      })
    } catch (err) {
      console.error("Error adding user:", err)
      toast({
        title: "Error",
        description: "Failed to add user. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEditUser = async () => {
    if (!selectedUser) return
    
    try {
      setLoading(true)
      const { id, username, first_name, last_name, email, is_staff, is_superuser } = selectedUser
      
      const response = await userApi.updateUser(id, {
        username, 
        first_name, 
        last_name, 
        email,
        is_staff,
        is_superuser
      })
      
      setUsers(users.map(user => user.id === id ? response : user))
      setIsEditUserDialogOpen(false)
      setSelectedUser(null)
      
      toast({
        title: "Success",
        description: "User updated successfully",
      })
    } catch (err) {
      console.error("Error updating user:", err)
      toast({
        title: "Error",
        description: "Failed to update user. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddClient = async () => {
    try {
      setLoading(true)
      const response = await clientApi.createClient(newClient)
      
      setClients([...clients, response])
      setIsAddClientDialogOpen(false)
      setNewClient({
        name: "",
        address: "",
        description: "",
      })
      
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

  const handleEditClient = async () => {
    if (!selectedClient) return
    
    try {
      setLoading(true)
      const { id, name, address, description } = selectedClient
      
      const response = await clientApi.updateClient(id, {
        name,
        address,
        description
      })
      
      setClients(clients.map(client => client.id === id ? response : client))
      setIsEditClientDialogOpen(false)
      setSelectedClient(null)
      
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

  const handleDeleteUser = async (userId: number) => {
    if (confirm("Are you sure you want to delete this user?")) {
      try {
        setLoading(true)
        await userApi.deleteUser(userId)
        setUsers(users.filter((user) => user.id !== userId))
        
        toast({
          title: "Success",
          description: "User deleted successfully",
        })
      } catch (err) {
        console.error("Error deleting user:", err)
        toast({
          title: "Error",
          description: "Failed to delete user. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
  }

  const handleDeleteClient = async (clientId: number) => {
    if (confirm("Are you sure you want to delete this client?")) {
      try {
        setLoading(true)
        await clientApi.deleteClient(clientId)
        setClients(clients.filter((client) => client.id !== clientId))
        
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
  }

  // Filter users based on search term
  const filteredUsers = users.filter(
    (user) =>
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${user.person_details?.first_name || ""} ${user.person_details?.last_name || ""}`.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Filter clients based on search term
  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Users & Clients</h1>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="clients" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Clients
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4 mt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search users..."
                  className="pl-8 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add User
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New User</DialogTitle>
                    <DialogDescription>Create a new user account.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="first_name">First Name</Label>
                        <Input
                          id="first_name"
                          name="first_name"
                          value={newUser.first_name}
                          onChange={handleUserInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last_name">Last Name</Label>
                        <Input
                          id="last_name"
                          name="last_name"
                          value={newUser.last_name}
                          onChange={handleUserInputChange}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input id="username" name="username" value={newUser.username} onChange={handleUserInputChange} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={newUser.email}
                        onChange={handleUserInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        value={newUser.password}
                        onChange={handleUserInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Select 
                        value={newUser.is_superuser ? "superuser" : newUser.is_staff ? "admin" : "user"} 
                        onValueChange={(value) => {
                          setNewUser({ 
                            ...newUser, 
                            is_staff: value === "admin" || value === "superuser",
                            is_superuser: value === "superuser"
                          })
                        }}
                      >
                        <SelectTrigger id="role">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="superuser">Superuser</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddUserDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddUser} disabled={loading}>
                      {loading ? "Adding..." : "Add User"}
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
                      <TableHead>Name</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading && users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          <div className="flex justify-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-gray-900"></div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : error ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center text-red-500">
                          {error}
                        </TableCell>
                      </TableRow>
                    ) : filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          No users found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            {user.person_details?.first_name || ""} {user.person_details?.last_name || ""}
                          </TableCell>
                          <TableCell>{user.username}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                user.is_superuser
                                  ? "bg-purple-100 text-purple-800 hover:bg-purple-100"
                                  : user.is_staff
                                    ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                                    : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                              }
                            >
                              {user.is_superuser ? "Superuser" : user.is_staff ? "Admin" : "User"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => {
                                  setSelectedUser(user)
                                  setIsEditUserDialogOpen(true)
                                }}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleDeleteUser(user.id)} className="text-red-600">
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
              </CardContent>
            </Card>

            {/* Edit User Dialog */}
            {selectedUser && (
              <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit User</DialogTitle>
                    <DialogDescription>Update user information.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit_first_name">First Name</Label>
                        <Input
                          id="edit_first_name"
                          value={selectedUser.person_details?.first_name || ""}
                          onChange={(e) => setSelectedUser({
                            ...selectedUser,
                            person_details: {
                              ...selectedUser.person_details!,
                              first_name: e.target.value
                            }
                          })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit_last_name">Last Name</Label>
                        <Input
                          id="edit_last_name"
                          value={selectedUser.person_details?.last_name || ""}
                          onChange={(e) => setSelectedUser({
                            ...selectedUser,
                            person_details: {
                              ...selectedUser.person_details!,
                              last_name: e.target.value
                            }
                          })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit_username">Username</Label>
                      <Input
                        id="edit_username"
                        value={selectedUser.username}
                        onChange={(e) => setSelectedUser({
                          ...selectedUser,
                          username: e.target.value
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit_email">Email</Label>
                      <Input
                        id="edit_email"
                        type="email"
                        value={selectedUser.email || ""}
                        onChange={(e) => setSelectedUser({
                          ...selectedUser,
                          email: e.target.value
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit_role">Role</Label>
                      <Select 
                        value={selectedUser.is_superuser ? "superuser" : selectedUser.is_staff ? "admin" : "user"} 
                        onValueChange={(value) => {
                          setSelectedUser({ 
                            ...selectedUser, 
                            is_staff: value === "admin" || value === "superuser",
                            is_superuser: value === "superuser"
                          })
                        }}
                      >
                        <SelectTrigger id="edit_role">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="superuser">Superuser</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsEditUserDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleEditUser} disabled={loading}>
                      {loading ? "Saving..." : "Save Changes"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </TabsContent>

          <TabsContent value="clients" className="space-y-4 mt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search clients..."
                  className="pl-8 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Dialog open={isAddClientDialogOpen} onOpenChange={setIsAddClientDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Client
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Client</DialogTitle>
                    <DialogDescription>Create a new client account.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Client Name</Label>
                      <Input id="name" name="name" value={newClient.name} onChange={handleClientInputChange} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Input id="address" name="address" value={newClient.address} onChange={handleClientInputChange} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <textarea
                        id="description"
                        name="description"
                        className="w-full min-h-[100px] p-2 border rounded-md"
                        value={newClient.description}
                        onChange={handleClientInputChange}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddClientDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddClient} disabled={loading}>
                      {loading ? "Adding..." : "Add Client"}
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
                      <TableHead>Name</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading && clients.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                          <div className="flex justify-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-gray-900"></div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : error ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center text-red-500">
                          {error}
                        </TableCell>
                      </TableRow>
                    ) : filteredClients.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                          No clients found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredClients.map((client) => (
                        <TableRow key={client.id}>
                          <TableCell className="font-medium">{client.name}</TableCell>
                          <TableCell>{client.address}</TableCell>
                          <TableCell>{client.description}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => {
                                  setSelectedClient(client)
                                  setIsEditClientDialogOpen(true)
                                }}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDeleteClient(client.id)}
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
              </CardContent>
            </Card>

            {/* Edit Client Dialog */}
            {selectedClient && (
              <Dialog open={isEditClientDialogOpen} onOpenChange={setIsEditClientDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Client</DialogTitle>
                    <DialogDescription>Update client information.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit_name">Client Name</Label>
                      <Input
                        id="edit_name"
                        value={selectedClient.name}
                        onChange={(e) => setSelectedClient({
                          ...selectedClient,
                          name: e.target.value
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit_address">Address</Label>
                      <Input
                        id="edit_address"
                        value={selectedClient.address}
                        onChange={(e) => setSelectedClient({
                          ...selectedClient,
                          address: e.target.value
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit_description">Description</Label>
                      <textarea
                        id="edit_description"
                        className="w-full min-h-[100px] p-2 border rounded-md"
                        value={selectedClient.description}
                        onChange={(e) => setSelectedClient({
                          ...selectedClient,
                          description: e.target.value
                        })}
                      />
                    </div>
                  </div>
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
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
