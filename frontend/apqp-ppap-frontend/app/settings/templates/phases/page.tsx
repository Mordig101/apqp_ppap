"use client"

import type React from "react"
import type { PhaseTemplate } from "@/config/api-types"

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
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { AlertTriangle, Edit, MoreHorizontal, Plus, Search, Trash2, FileDown, RefreshCw } from "lucide-react"
import { templateApi } from "@/config/api-utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"

export default function PhaseTemplatesPage() {
  const router = useRouter()
  const [phaseTemplates, setPhaseTemplates] = useState<PhaseTemplate[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<PhaseTemplate | null>(null)
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    description: "",
    order: 1,
    is_active: true,
  })
  const [sortField, setSortField] = useState<"name" | "order">("order")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchPhaseTemplates()
  }, [])

  const fetchPhaseTemplates = async () => {
    try {
      setLoading(true)
      setError(null)
      setRefreshing(true)
      const response = await templateApi.getAllPhaseTemplates()
      setPhaseTemplates(Array.isArray(response) ? response : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch phase templates")
      console.error("Error fetching phase templates:", err)
      toast({
        title: "Error",
        description: "Failed to fetch phase templates. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setNewTemplate({
      ...newTemplate,
      [name]: value,
    })
  }

  const handleAddTemplate = async () => {
    try {
      // Validate input
      if (!newTemplate.name.trim()) {
        toast({
          title: "Validation Error",
          description: "Phase name is required",
          variant: "destructive",
        })
        return
      }

      setLoading(true)
      const response = await templateApi.createPhaseTemplate(newTemplate)

      setPhaseTemplates([...phaseTemplates, response])
      setIsAddDialogOpen(false)
      setNewTemplate({
        name: "",
        description: "",
        order: phaseTemplates.length + 1,
        is_active: true,
      })

      toast({
        title: "Success",
        description: "Phase template created successfully",
      })
    } catch (err) {
      console.error("Error adding phase template:", err)
      toast({
        title: "Error",
        description: "Failed to add phase template. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEditTemplate = async () => {
    if (!selectedTemplate) return

    try {
      // Validate input
      if (!selectedTemplate.name.trim()) {
        toast({
          title: "Validation Error",
          description: "Phase name is required",
          variant: "destructive",
        })
        return
      }

      setLoading(true)
      const { id, name, description, order, is_active } = selectedTemplate

      const response = await templateApi.updatePhaseTemplate(id, {
        name,
        description,
        order,
        is_active,
      })

      setPhaseTemplates(phaseTemplates.map((template) => (template.id === id ? response : template)))
      setIsEditDialogOpen(false)
      setSelectedTemplate(null)

      toast({
        title: "Success",
        description: "Phase template updated successfully",
      })
    } catch (err) {
      console.error("Error updating phase template:", err)
      toast({
        title: "Error",
        description: "Failed to update phase template. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTemplate = async (templateId: number) => {
    if (confirm("Are you sure you want to delete this phase template? This action cannot be undone.")) {
      try {
        setLoading(true)
        await templateApi.deletePhaseTemplate(templateId)
        setPhaseTemplates(phaseTemplates.filter((template) => template.id !== templateId))

        toast({
          title: "Success",
          description: "Phase template deleted successfully",
        })
      } catch (err) {
        console.error("Error deleting phase template:", err)
        toast({
          title: "Error",
          description: "Failed to delete phase template. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
  }

  const handleToggleStatus = async (template: PhaseTemplate) => {
    try {
      setLoading(true)
      const updatedTemplate = await templateApi.updatePhaseTemplate(template.id, {
        ...template,
        is_active: !template.is_active,
      })

      setPhaseTemplates(phaseTemplates.map((t) => (t.id === template.id ? updatedTemplate : t)))

      toast({
        title: "Success",
        description: `Phase template ${updatedTemplate.is_active ? "activated" : "deactivated"} successfully`,
      })
    } catch (err) {
      console.error("Error updating phase template status:", err)
      toast({
        title: "Error",
        description: "Failed to update phase template status. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (field: "name" | "order") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Export templates to CSV
  const exportToCSV = () => {
    try {
      // Create CSV content
      const headers = ["ID", "Name", "Description", "Order", "Status"]
      const csvContent =
        headers.join(",") +
        "\n" +
        phaseTemplates
          .map((template) => {
            return [
              template.id,
              `"${template.name.replace(/"/g, '""')}"`,
              `"${template.description.replace(/"/g, '""')}"`,
              template.order,
              template.is_active ? "Active" : "Inactive",
            ].join(",")
          })
          .join("\n")

      // Create download link
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute("download", `phase_templates_${new Date().toISOString().split("T")[0]}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Export Successful",
        description: "Phase templates exported to CSV successfully",
      })
    } catch (err) {
      console.error("Error exporting phase templates:", err)
      toast({
        title: "Export Failed",
        description: "Failed to export phase templates. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Filter templates based on search term
  const filteredTemplates = phaseTemplates.filter(
    (template) =>
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Sort templates
  const sortedTemplates = [...filteredTemplates].sort((a, b) => {
    if (sortField === "name") {
      return sortDirection === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
    } else {
      return sortDirection === "asc" ? a.order - b.order : b.order - a.order
    }
  })

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Phase Templates</h1>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={exportToCSV} disabled={loading || phaseTemplates.length === 0}>
              <FileDown className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={fetchPhaseTemplates} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              <span className="ml-2 sr-only sm:not-sr-only">Refresh</span>
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="phases" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="phases">Phases</TabsTrigger>
            <TabsTrigger value="outputs" onClick={() => router.push("/settings/templates/outputs")}>
              Outputs
            </TabsTrigger>
            <TabsTrigger value="ppap-elements" onClick={() => router.push("/settings/templates/ppap-elements")}>
              PPAP Elements
            </TabsTrigger>
          </TabsList>

          <TabsContent value="phases" className="space-y-4 mt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search phase templates..."
                  className="pl-8 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Phase Template
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Phase Template</DialogTitle>
                    <DialogDescription>Create a new phase template for APQP projects.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">
                        Phase Name <span className="text-red-500">*</span>
                      </Label>
                      <Input id="name" name="name" value={newTemplate.name} onChange={handleInputChange} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <textarea
                        id="description"
                        name="description"
                        className="w-full min-h-[100px] p-2 border rounded-md"
                        value={newTemplate.description}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="order">Order</Label>
                      <Input
                        id="order"
                        name="order"
                        type="number"
                        value={newTemplate.order}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="is_active">Status</Label>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="is_active"
                          checked={newTemplate.is_active}
                          onCheckedChange={(checked) => setNewTemplate({ ...newTemplate, is_active: checked })}
                        />
                        <Label htmlFor="is_active">{newTemplate.is_active ? "Active" : "Inactive"}</Label>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddTemplate} disabled={loading}>
                      {loading ? "Adding..." : "Add Phase Template"}
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
                      <TableHead className="cursor-pointer" onClick={() => handleSort("order")}>
                        Order {sortField === "order" && (sortDirection === "asc" ? "↑" : "↓")}
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("name")}>
                        Name {sortField === "name" && (sortDirection === "asc" ? "↑" : "↓")}
                      </TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading && phaseTemplates.length === 0 ? (
                      Array.from({ length: 5 }).map((_, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Skeleton className="h-4 w-12" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-40" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-60" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-6 w-20" />
                          </TableCell>
                          <TableCell className="text-right">
                            <Skeleton className="h-8 w-8 ml-auto" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : error ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center text-red-500">
                          {error}
                        </TableCell>
                      </TableRow>
                    ) : sortedTemplates.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          {searchTerm ? "No matching phase templates found" : "No phase templates found"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      sortedTemplates.map((template) => (
                        <TableRow key={template.id}>
                          <TableCell>{template.order}</TableCell>
                          <TableCell className="font-medium">{template.name}</TableCell>
                          <TableCell>
                            {template.description.length > 100
                              ? `${template.description.substring(0, 100)}...`
                              : template.description}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                template.is_active
                                  ? "bg-green-100 text-green-800 hover:bg-green-100"
                                  : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                              }
                            >
                              {template.is_active ? "Active" : "Inactive"}
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
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedTemplate(template)
                                    setIsEditDialogOpen(true)
                                  }}
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleToggleStatus(template)}>
                                  {template.is_active ? (
                                    <>
                                      <AlertTriangle className="mr-2 h-4 w-4" />
                                      Deactivate
                                    </>
                                  ) : (
                                    <>
                                      <RefreshCw className="mr-2 h-4 w-4" />
                                      Activate
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDeleteTemplate(template.id)}
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

            {/* Edit Template Dialog */}
            {selectedTemplate && (
              <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Phase Template</DialogTitle>
                    <DialogDescription>Update phase template information.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit_name">
                        Phase Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="edit_name"
                        value={selectedTemplate.name}
                        onChange={(e) =>
                          setSelectedTemplate({
                            ...selectedTemplate,
                            name: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit_description">Description</Label>
                      <textarea
                        id="edit_description"
                        className="w-full min-h-[100px] p-2 border rounded-md"
                        value={selectedTemplate.description}
                        onChange={(e) =>
                          setSelectedTemplate({
                            ...selectedTemplate,
                            description: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit_order">Order</Label>
                      <Input
                        id="edit_order"
                        type="number"
                        value={selectedTemplate.order}
                        onChange={(e) =>
                          setSelectedTemplate({
                            ...selectedTemplate,
                            order: Number.parseInt(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit_status">Status</Label>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="edit_status"
                          checked={selectedTemplate.is_active}
                          onCheckedChange={(checked) =>
                            setSelectedTemplate({
                              ...selectedTemplate,
                              is_active: checked,
                            })
                          }
                        />
                        <Label htmlFor="edit_status">{selectedTemplate.is_active ? "Active" : "Inactive"}</Label>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleEditTemplate} disabled={loading}>
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
