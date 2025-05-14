"use client"

import type React from "react"
import type { User } from "@/config/api-types"

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { userApi, departmentApi } from "@/config/api-utils"
import { toast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { Pen, Plus, Search, Trash2 } from "lucide-react"

export function UsersTab() {
  // User state
  const [users, setUsers] = useState<User[]>([])
  const [userSearchTerm, setUserSearchTerm] = useState("")
  const [userSortField, setUserSortField] = useState<"name" | "username" | "role" | "department">("name")
  const [userSortDirection, setUserSortDirection] = useState<"asc" | "desc">("asc")
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false)
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false)
  const [isDeleteUserDialogOpen, setIsDeleteUserDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [userPassword, setUserPassword] = useState("")
  const [departments, setDepartments] = useState<any[]>([])

  // Shared state
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  // Form state
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: "",
    department_id: 0,
    role: "",
    replacer_id: 0,
    authorization_id: 0,
    is_active: true,
    is_staff: false,
    is_superuser: false,
  })

  // Helper function to get department name
  const getDepartmentName = (departmentId: number | null | undefined): string => {
    if (!departmentId) return "N/A"
    const department = departments.find((d) => d.id === departmentId)
    return department ? department.name : `Dept #${departmentId}`
  }

  // Fetch data on component mount
  useEffect(() => {
    fetchUsers()
    fetchDepartments()
  }, [])

  // === USER FUNCTIONS ===

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      setRefreshing(true)
      const response = await userApi.getAllUsers()
      setUsers(Array.isArray(response) ? response : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch users")
      console.error("Error fetching users:", err)
      toast({
        title: "Error",
        description: "Failed to fetch users. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Fetch departments
  const fetchDepartments = async () => {
    try {
      const response = await departmentApi.getAllDepartments()
      setDepartments(response)
    } catch (err) {
      console.error("Error fetching departments:", err)
      toast({
        title: "Error",
        description: "Failed to fetch departments. Some features may be limited.",
        variant: "destructive",
      })
    }
  }

  // Handle user sort
  const handleUserSort = (field: "name" | "username" | "role" | "department") => {
    if (userSortField === field) {
      setUserSortDirection(userSortDirection === "asc" ? "desc" : "asc")
    } else {
      setUserSortField(field)
      setUserSortDirection("asc")
    }
  }

  // Sort and filter users
  const filteredUsers = users.filter((user) => {
    const searchString = userSearchTerm.toLowerCase()
    const fullName = `${user.person_details?.first_name || ""} ${user.person_details?.last_name || ""}`.toLowerCase()
    return (
      user.username.toLowerCase().includes(searchString) ||
      fullName.includes(searchString) ||
      (user.role || "").toLowerCase().includes(searchString) ||
      (getDepartmentName(user.person_details?.department) || "").toLowerCase().includes(searchString)
    )
  })

  // Sort users
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (userSortField === "name") {
      const fullNameA = `${a.person_details?.first_name || ""} ${a.person_details?.last_name || ""}`
      const fullNameB = `${b.person_details?.first_name || ""} ${b.person_details?.last_name || ""}`
      return userSortDirection === "asc" ? fullNameA.localeCompare(fullNameB) : fullNameB.localeCompare(fullNameA)
    } else if (userSortField === "username") {
      return userSortDirection === "asc" ? a.username.localeCompare(b.username) : b.username.localeCompare(a.username)
    } else if (userSortField === "role") {
      const roleA = a.role || ""
      const roleB = b.role || ""
      return userSortDirection === "asc" ? roleA.localeCompare(roleB) : roleB.localeCompare(roleA)
    } else if (userSortField === "department") {
      const deptA = getDepartmentName(a.person_details?.department) || ""
      const deptB = getDepartmentName(b.person_details?.department) || ""
      return userSortDirection === "asc" ? deptA.localeCompare(deptB) : deptB.localeCompare(deptA)
    }
    return 0
  })

  // Handle input change for new user form
  const handleUserInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setNewUser((prev) => ({ ...prev, [name]: value }))
  }

  // Handle select change for new user form
  const handleUserSelectChange = (name: string, value: any) => {
    setNewUser((prev) => ({ ...prev, [name]: value }))
  }

  // Handle user creation
  const handleAddUser = async () => {
    try {
      // Validation
      if (!newUser.username || !newUser.password || !newUser.first_name || !newUser.last_name) {
        toast({
          title: "Validation Error",
          description: "Username, password, first name, and last name are required",
          variant: "destructive",
        })
        return
      }

      setLoading(true)

      // Create user
      const userData = {
        username: newUser.username,
        password: newUser.password,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        email: newUser.email,
        phone: newUser.phone,
        address: newUser.address,
        department_id: newUser.department_id || undefined,
        role: newUser.role || undefined,
        replacer_id: newUser.replacer_id || undefined,
        authorization_id: newUser.authorization_id || 11, // Default to 'view' authorization
        is_active: newUser.is_active,
        is_staff: newUser.is_staff,
        is_superuser: newUser.is_superuser,
      }

      const response = await userApi.createUser(userData)

      // Update users list
      setUsers([...users, response])

      // Reset form and close dialog
      setIsAddUserDialogOpen(false)
      setNewUser({
        username: "",
        password: "",
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        address: "",
        department_id: 0,
        role: "",
        replacer_id: 0,
        authorization_id: 0,
        is_active: true,
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

  // Handle user update
  const handleEditUser = async () => {
    if (!selectedUser) return

    try {
      setLoading(true)

      // Prepare update data
      const updateData: Record<string, any> = {
        username: selectedUser.username,
        person_data: {
          first_name: selectedUser.person_details?.first_name,
          last_name: selectedUser.person_details?.last_name,
          department_id: selectedUser.person_details?.department,
          email: selectedUser.person_details?.contact_id ? "example@example.com" : undefined,
        },
        role: selectedUser.role,
        replacer_id: selectedUser.replacer_id,
        authorization_id: selectedUser.authorization,
        is_active: selectedUser.is_active,
        is_staff: selectedUser.is_staff,
        is_superuser: selectedUser.is_superuser,
      }

      // Update password only if provided
      if (userPassword) {
        updateData.password = userPassword
      }

      const response = await userApi.updateUser(selectedUser.id, updateData)

      // Update users list
      setUsers(users.map((user) => (user.id === selectedUser.id ? response : user)))

      // Close dialog
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

  // Handle user deletion
  const handleDeleteUser = async () => {
    if (!selectedUser) return

    try {
      setLoading(true)

      await userApi.deleteUser(selectedUser.id)

      // Update users list
      setUsers(users.filter((user) => user.id !== selectedUser.id))

      // Close dialog
      setIsDeleteUserDialogOpen(false)
      setSelectedUser(null)

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

  // Opens the edit user dialog and initialize form data
  const openEditUserDialog = (user: User) => {
    setSelectedUser(user)
    setUserPassword("") // Reset password when opening dialog
    setIsEditUserDialogOpen(true)
  }

  // Opens the delete user confirmation dialog
  const openDeleteUserDialog = (user: User) => {
    setSelectedUser(user)
    setIsDeleteUserDialogOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            className="pl-8"
            value={userSearchTerm}
            onChange={(e) => setUserSearchTerm(e.target.value)}
          />
        </div>
        
        <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>Create a new user account.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="username">
                  Username <span className="text-red-500">*</span>
                </Label>
                <Input id="username" name="username" value={newUser.username} onChange={handleUserInputChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">
                  Password <span className="text-red-500">*</span>
                </Label>
                <Input id="password" name="password" type="password" value={newUser.password} onChange={handleUserInputChange} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">
                    First Name <span className="text-red-500">*</span>
                  </Label>
                  <Input id="first_name" name="first_name" value={newUser.first_name} onChange={handleUserInputChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">
                    Last Name <span className="text-red-500">*</span>
                  </Label>
                  <Input id="last_name" name="last_name" value={newUser.last_name} onChange={handleUserInputChange} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" value={newUser.email} onChange={handleUserInputChange} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" name="phone" value={newUser.phone} onChange={handleUserInputChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department_id">Department</Label>
                  <Select
                    value={newUser.department_id ? String(newUser.department_id) : ""}
                    onValueChange={(value) => handleUserSelectChange("department_id", Number.parseInt(value))}
                  >
                    <SelectTrigger id="department_id">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((department) => (
                        <SelectItem key={department.id} value={department.id.toString()}>
                          {department.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Input id="role" name="role" value={newUser.role} onChange={handleUserInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" name="address" value={newUser.address} onChange={handleUserInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="is_active">User Status</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={newUser.is_active}
                    onCheckedChange={(checked) => handleUserSelectChange("is_active", checked)}
                  />
                  <Label htmlFor="is_active">{newUser.is_active ? "Active" : "Inactive"}</Label>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Admin Permissions</Label>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_staff"
                      checked={newUser.is_staff}
                      onCheckedChange={(checked) => handleUserSelectChange("is_staff", checked)}
                    />
                    <Label htmlFor="is_staff">Staff Access</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_superuser"
                      checked={newUser.is_superuser}
                      onCheckedChange={(checked) => handleUserSelectChange("is_superuser", checked)}
                    />
                    <Label htmlFor="is_superuser">Admin Access</Label>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddUserDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddUser} disabled={loading}>
                {loading ? "Creating..." : "Create User"}
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
                <TableHead className="cursor-pointer" onClick={() => handleUserSort("name")}>
                  Name {userSortField === "name" && (userSortDirection === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleUserSort("username")}>
                  Username {userSortField === "username" && (userSortDirection === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleUserSort("role")}>
                  Role {userSortField === "role" && (userSortDirection === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleUserSort("department")}>
                  Department {userSortField === "department" && (userSortDirection === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead>Teams</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && users.length === 0 ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-red-500">
                    {error}
                  </TableCell>
                </TableRow>
              ) : sortedUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    {userSearchTerm ? "No matching users found" : "No users found"}
                  </TableCell>
                </TableRow>
              ) : (
                sortedUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.person_details?.first_name} {user.person_details?.last_name}
                    </TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.role || "N/A"}</TableCell>
                    <TableCell>{getDepartmentName(user.person_details?.department)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {user.person_details?.teams && user.person_details.teams.length > 0 ? (
                          user.person_details.teams.map((team) => (
                            <Badge key={team.id} variant="outline" className="bg-blue-50 text-blue-800 hover:bg-blue-50 text-xs whitespace-nowrap">
                              {team.name}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-sm">None</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          user.is_active
                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                            : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                        }
                      >
                        {user.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.is_superuser ? (
                        <Badge variant="outline" className="bg-purple-100 text-purple-800 hover:bg-purple-100">
                          Admin
                        </Badge>
                      ) : user.is_staff ? (
                        <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                          Staff
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">None</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditUserDialog(user)}
                        >
                          <Pen className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => openDeleteUserDialog(user)}
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

      {/* Edit User Dialog */}
      {selectedUser && (
        <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>Update user information.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit_username">Username</Label>
                <Input
                  id="edit_username"
                  value={selectedUser.username}
                  onChange={(e) => setSelectedUser({...selectedUser, username: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_password">Password (leave blank to keep current)</Label>
                <Input
                  id="edit_password"
                  type="password"
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_first_name">First Name</Label>
                  <Input
                    id="edit_first_name"
                    value={selectedUser.person_details?.first_name || ""}
                    onChange={(e) => setSelectedUser({
                      ...selectedUser,
                      person_details: { 
                        ...(selectedUser.person_details || {}),
                        id: selectedUser.person_details?.id || 0,
                        first_name: e.target.value,
                        last_name: selectedUser.person_details?.last_name || "",
                        contact_id: selectedUser.person_details?.contact_id || "",
                        is_user: selectedUser.person_details?.is_user || false,
                        history_id: selectedUser.person_details?.history_id || "",
                        department: selectedUser.person_details?.department || null,
                        replacer: selectedUser.person_details?.replacer || null,
                        role: selectedUser.person_details?.role || null
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
                        ...(selectedUser.person_details || {}),
                        id: selectedUser.person_details?.id || 0,
                        first_name: selectedUser.person_details?.first_name || "",
                        last_name: e.target.value,
                        contact_id: selectedUser.person_details?.contact_id || "",
                        is_user: selectedUser.person_details?.is_user || false,
                        history_id: selectedUser.person_details?.history_id || "",
                        department: selectedUser.person_details?.department || null,
                        replacer: selectedUser.person_details?.replacer || null,
                        role: selectedUser.person_details?.role || null
                      }
                    })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_department">Department</Label>
                <Select
                  value={selectedUser.person_details?.department?.toString() || "none"}
                  onValueChange={(value) => setSelectedUser({
                    ...selectedUser,
                    person_details: {
                      ...(selectedUser.person_details || {}),
                      department: value === "none" ? null : Number.parseInt(value)
                    }
                  })}
                >
                  <SelectTrigger id="edit_department">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Department</SelectItem>
                    {departments.map((department) => (
                      <SelectItem key={department.id} value={department.id.toString()}>
                        {department.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_role">Role</Label>
                <Input
                  id="edit_role"
                  value={selectedUser.role || ""}
                  onChange={(e) => setSelectedUser({
                    ...selectedUser,
                    role: e.target.value
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_active">User Status</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit_active"
                    checked={selectedUser.is_active}
                    onCheckedChange={(checked) => setSelectedUser({
                      ...selectedUser,
                      is_active: checked
                    })}
                  />
                  <Label htmlFor="edit_active">{selectedUser.is_active ? "Active" : "Inactive"}</Label>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Admin Permissions</Label>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="edit_staff"
                      checked={selectedUser.is_staff}
                      onCheckedChange={(checked) => setSelectedUser({
                        ...selectedUser,
                        is_staff: checked
                      })}
                    />
                    <Label htmlFor="edit_staff">Staff Access</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="edit_superuser"
                      checked={selectedUser.is_superuser}
                      onCheckedChange={(checked) => setSelectedUser({
                        ...selectedUser,
                        is_superuser: checked
                      })}
                    />
                    <Label htmlFor="edit_superuser">Admin Access</Label>
                  </div>
                </div>
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

      {/* Delete User Confirmation Dialog */}
      {selectedUser && (
        <Dialog open={isDeleteUserDialogOpen} onOpenChange={setIsDeleteUserDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete User</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete {selectedUser.person_details?.first_name} {selectedUser.person_details?.last_name} ({selectedUser.username})?
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteUserDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteUser} disabled={loading}>
                {loading ? "Deleting..." : "Delete User"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}