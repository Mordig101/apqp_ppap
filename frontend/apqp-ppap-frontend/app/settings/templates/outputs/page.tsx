"use client"

import type React from "react"
import type { OutputTemplate, PhaseTemplate } from "@/config/api-types"

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
import { AlertTriangle, Edit, MoreHorizontal, Plus, Search, Trash2, FileDown, RefreshCw } from "lucide-react"
import { templateApi } from "@/config/api-utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"

export default function OutputTemplatesPage() {
  const router = useRouter()
  const [outputTemplates, setOutputTemplates] = useState<OutputTemplate[]>([])
  const [phaseTemplates, setPhaseTemplates] = useState<PhaseTemplate[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<OutputTemplate | null>(null)
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    description: "",
    phase_id: 0,
    ppap_element_id: 0,  // Add this field
    document_type: "document",
    is_required: true,
    is_active: true,
  })
  const [sortField, setSortField] = useState<"name" | "phase">("name")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [refreshing, setRefreshing] = useState(false)
  const [phaseFilter, setPhaseFilter] = useState<number | "all">("all")
  const [ppapElements, setPpapElements] = useState<Array<{
    id: number;
    name: string;
    level: string;
  }>>([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      setRefreshing(true)

      // Fetch output templates, phase templates, and PPAP elements
      const [outputResponse, phaseResponse, ppapResponse] = await Promise.all([
        templateApi.getAllOutputTemplates(),
        templateApi.getAllPhaseTemplates(),
        templateApi.getAllPPAPElements(),
      ])

      setOutputTemplates(Array.isArray(outputResponse) ? outputResponse : [])
      setPhaseTemplates(Array.isArray(phaseResponse) ? phaseResponse : [])
      setPpapElements(Array.isArray(ppapResponse) ? ppapResponse : [])

      // Set the default phase_id if we have phases
      if (Array.isArray(phaseResponse) && phaseResponse.length > 0) {
        setNewTemplate((prev) => ({
          ...prev,
          phase_id: phaseResponse[0].id,
        }))
      }
      
      // Set the default ppap_element_id if we have PPAP elements
      if (Array.isArray(ppapResponse) && ppapResponse.length > 0) {
        setNewTemplate((prev) => ({
          ...prev,
          ppap_element_id: ppapResponse[0].id,
        }))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data")
      console.error("Error fetching data:", err)
      toast({
        title: "Error",
        description: "Failed to fetch templates. Please try again.",
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

  const handleSelectChange = (name: string, value: string | number | boolean) => {
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
          description: "Output name is required",
          variant: "destructive",
        })
        return
      }

      if (!newTemplate.phase_id) {
        toast({
          title: "Validation Error",
          description: "Please select a phase",
          variant: "destructive",
        })
        return
      }
      
      if (!newTemplate.ppap_element_id) {
        toast({
          title: "Validation Error",
          description: "Please select a PPAP element",
          variant: "destructive",
        })
        return
      }

      setLoading(true)
      
      // Prepare request based on the exact API format expected
      const requestData = {
        name: newTemplate.name,
        description: newTemplate.description,
        phase_id: newTemplate.phase_id,
        ppap_element_id: newTemplate.ppap_element_id,
        configuration: {
          document_type: newTemplate.document_type,
          is_required: newTemplate.is_required,
          is_active: newTemplate.is_active
        }
      }
      
      console.log("Creating template with data:", requestData)
      
      // Send the properly formatted request
      const response = await templateApi.createOutputTemplate(requestData)

      setOutputTemplates([...outputTemplates, response])
      setIsAddDialogOpen(false)
      setNewTemplate({
        name: "",
        description: "",
        phase_id: phaseTemplates.length > 0 ? phaseTemplates[0].id : 0,
        ppap_element_id: ppapElements.length > 0 ? ppapElements[0].id : 0,
        document_type: "document",
        is_required: true,
        is_active: true,
      })

      toast({
        title: "Success",
        description: "Output template created successfully",
      })
    } catch (err) {
      console.error("Error adding output template:", err)
      toast({
        title: "Error",
        description: "Failed to add output template. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEditTemplate = async () => {
    if (!selectedTemplate) return;

    try {
      setLoading(true);
      
      // Format the request exactly according to what your API expects
      const requestData = {
        name: selectedTemplate.name,
        description: selectedTemplate.description,
        phase: selectedTemplate.phase, 
        ppap_element: selectedTemplate.ppap_element,
        configuration: {
          document_type: selectedTemplate.document_type || 'document',
          is_required: selectedTemplate.is_required !== false,
          is_active: selectedTemplate.is_active !== false
        }
      };
      
      console.log("Updating template with data:", requestData);
      
      // Use your existing templateApi instead of direct fetch
      // This will handle authentication and CSRF tokens properly
      const response = await templateApi.updateOutputTemplate(selectedTemplate.id, requestData);
      
      // Update the local state with the response
      setOutputTemplates(
        outputTemplates.map((template) => 
          template.id === selectedTemplate.id ? response : template
        )
      );
      
      setIsEditDialogOpen(false);
      setSelectedTemplate(null);
      
      toast({
        title: "Success",
        description: "Output template updated successfully",
      });
    } catch (err) {
      console.error("Error updating output template:", err);
      toast({
        title: "Error",
        description: "Failed to update output template. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (templateId: number) => {
    if (confirm("Are you sure you want to delete this output template? This action cannot be undone.")) {
      try {
        setLoading(true)
        await templateApi.deleteOutputTemplate(templateId)
        setOutputTemplates(outputTemplates.filter((template) => template.id !== templateId))

        toast({
          title: "Success",
          description: "Output template deleted successfully",
        })
      } catch (err) {
        console.error("Error deleting output template:", err)
        toast({
          title: "Error",
          description: "Failed to delete output template. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
  }

  const handleToggleStatus = async (template: OutputTemplate) => {
    try {
      setLoading(true)
      const updatedTemplate = await templateApi.updateOutputTemplate(template.id, {
        ...template,
        is_active: !template.is_active,
      })

      setOutputTemplates(outputTemplates.map((t) => (t.id === template.id ? updatedTemplate : t)))

      toast({
        title: "Success",
        description: `Output template ${updatedTemplate.is_active ? "activated" : "deactivated"} successfully`,
      })
    } catch (err) {
      console.error("Error updating output template status:", err)
      toast({
        title: "Error",
        description: "Failed to update output template status. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (field: "name" | "phase") => {
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
      const headers = ["ID", "Name", "Description", "Phase", "Document Type", "Required", "Status"]
      const csvContent =
        headers.join(",") +
        "\n" +
        outputTemplates
          .map((template) => {
            return [
              template.id,
              `"${template.name.replace(/"/g, '""')}"`,
              `"${(template.description || "").replace(/"/g, '""')}"`,
              `"${getPhaseName(template.phase)}"`,
              template.document_type,
              template.is_required ? "Yes" : "No",
              template.is_active ? "Active" : "Inactive",
            ].join(",")
          })
          .join("\n")

      // Create download link
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute("download", `output_templates_${new Date().toISOString().split("T")[0]}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Export Successful",
        description: "Output templates exported to CSV successfully",
      })
    } catch (err) {
      console.error("Error exporting output templates:", err)
      toast({
        title: "Export Failed",
        description: "Failed to export output templates. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Get phase name by id
  const getPhaseName = (phaseId: number): string => {
    const phase = phaseTemplates.find((p) => p.id === phaseId)
    return phase ? phase.name : "Unknown Phase"
  }

  // Filter templates based on search term and phase filter
  const filteredTemplates = outputTemplates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (template.description || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      getPhaseName(template.phase).toLowerCase().includes(searchTerm.toLowerCase())

    const matchesPhaseFilter = phaseFilter === "all" || template.phase === phaseFilter

    return matchesSearch && matchesPhaseFilter
  })

  // Sort templates
  const sortedTemplates = [...filteredTemplates].sort((a, b) => {
    if (sortField === "name") {
      return sortDirection === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
    } else {
      const phaseNameA = getPhaseName(a.phase)
      const phaseNameB = getPhaseName(b.phase)
      return sortDirection === "asc" ? phaseNameA.localeCompare(phaseNameB) : phaseNameB.localeCompare(phaseNameA)
    }
  })

  // When opening the Edit dialog, prepare the template data for editing
  const openEditDialog = (template: OutputTemplate) => {
    // Extract configuration values with defaults
    const config = template.configuration || {};
    
    setSelectedTemplate({
      ...template,
      // Set these properties for form handling
      document_type: config.document_type || 'document',
      is_required: config.is_required !== false, // default to true if undefined
      is_active: config.is_active !== false      // default to true if undefined
    });
    
    setIsEditDialogOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Output Templates</h1>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportToCSV}
              disabled={loading || outputTemplates.length === 0}
            >
              <FileDown className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={fetchData} disabled={refreshing}>
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

        <Tabs defaultValue="outputs" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="phases" onClick={() => router.push("/settings/templates/phases")}>
              Phases
            </TabsTrigger>
            <TabsTrigger value="outputs">Outputs</TabsTrigger>
            <TabsTrigger value="ppap-elements" onClick={() => router.push("/settings/templates/ppap-elements")}>
              PPAP Elements
            </TabsTrigger>
          </TabsList>

          <TabsContent value="outputs" className="space-y-4 mt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex flex-col sm:flex-row gap-2 flex-1">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search output templates..."
                    className="pl-8 w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select
                  value={phaseFilter === "all" ? "all" : phaseFilter.toString()}
                  onValueChange={(value) => setPhaseFilter(value === "all" ? "all" : Number.parseInt(value))}
                >
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by phase" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Phases</SelectItem>
                    {phaseTemplates.map((phase) => (
                      <SelectItem key={phase.id} value={phase.id.toString()}>
                        {phase.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Output Template
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Output Template</DialogTitle>
                    <DialogDescription>Create a new output template for APQP projects.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">
                        Output Name <span className="text-red-500">*</span>
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
                      <Label htmlFor="phase_id">
                        Phase <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={newTemplate.phase_id ? newTemplate.phase_id.toString() : ""}
                        onValueChange={(value) => handleSelectChange("phase_id", Number.parseInt(value))}
                      >
                        <SelectTrigger id="phase_id">
                          <SelectValue placeholder="Select phase" />
                        </SelectTrigger>
                        <SelectContent>
                          {phaseTemplates.map((phase) => (
                            <SelectItem key={phase.id} value={phase.id.toString()}>
                              {phase.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Add PPAP Element select field */}
                    <div className="space-y-2">
                      <Label htmlFor="ppap_element_id">
                        PPAP Element <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={newTemplate.ppap_element_id ? newTemplate.ppap_element_id.toString() : ""}
                        onValueChange={(value) => handleSelectChange("ppap_element_id", Number.parseInt(value))}
                      >
                        <SelectTrigger id="ppap_element_id">
                          <SelectValue placeholder="Select PPAP element" />
                        </SelectTrigger>
                        <SelectContent>
                          {ppapElements.map((element) => (
                            <SelectItem key={element.id} value={element.id.toString()}>
                              {element.name} ({element.level})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="document_type">Document Type</Label>
                      <Select
                        value={newTemplate.document_type}
                        onValueChange={(value) => handleSelectChange("document_type", value)}
                      >
                        <SelectTrigger id="document_type">
                          <SelectValue placeholder="Select document type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="document">Document</SelectItem>
                          <SelectItem value="diagram">Diagram</SelectItem>
                          <SelectItem value="report">Report</SelectItem>
                          <SelectItem value="form">Form</SelectItem>
                          <SelectItem value="checklist">Checklist</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="is_required">Required</Label>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="is_required"
                          checked={newTemplate.is_required}
                          onCheckedChange={(checked) => handleSelectChange("is_required", checked)}
                        />
                        <Label htmlFor="is_required">{newTemplate.is_required ? "Required" : "Optional"}</Label>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="is_active">Status</Label>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="is_active"
                          checked={newTemplate.is_active}
                          onCheckedChange={(checked) => handleSelectChange("is_active", checked)}
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
                      {loading ? "Adding..." : "Add Output Template"}
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
                      <TableHead className="cursor-pointer" onClick={() => handleSort("name")}>
                        Name {sortField === "name" && (sortDirection === "asc" ? "↑" : "↓")}
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("phase")}>
                        Phase {sortField === "phase" && (sortDirection === "asc" ? "↑" : "↓")}
                      </TableHead>
                      <TableHead>PPAP Element</TableHead>
                      <TableHead>Document Type</TableHead>
                      <TableHead>Required</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading && outputTemplates.length === 0 ? (
                      Array.from({ length: 5 }).map((_, index) => (
                        <TableRow key={index}>
                          {/* Skeleton loading state */}
                          <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                        </TableRow>
                      ))
                    ) : error ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center text-red-500">
                          {error}
                        </TableCell>
                      </TableRow>
                    ) : sortedTemplates.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                          {searchTerm || phaseFilter !== "all"
                            ? "No matching output templates found"
                            : "No output templates found"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      sortedTemplates.map((template) => (
                        <TableRow key={template.id}>
                          <TableCell className="font-medium">
                            <div>
                              <div>{template.name}</div>
                              {template.description && (
                                <div className="text-xs text-muted-foreground">
                                  {template.description.length > 60
                                    ? `${template.description.substring(0, 60)}...`
                                    : template.description}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{getPhaseName(template.phase)}</TableCell>
                          <TableCell>
                            {template.ppap_element_details ? (
                              <>
                                {template.ppap_element_details.name}
                                <span className="text-xs text-muted-foreground ml-1">
                                  ({template.ppap_element_details.level})
                                </span>
                              </>
                            ) : (
                              `Element #${template.ppap_element}`
                            )}
                          </TableCell>
                          <TableCell className="capitalize">
                            {template.configuration?.document_type || "document"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                template.configuration?.is_required !== false
                                  ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                                  : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                              }
                            >
                              {template.configuration?.is_required !== false ? "Required" : "Optional"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                template.configuration?.is_active !== false
                                  ? "bg-green-100 text-green-800 hover:bg-green-100"
                                  : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                              }
                            >
                              {template.configuration?.is_active !== false ? "Active" : "Inactive"}
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
                                  onClick={() => openEditDialog(template)} 
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
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
                    <DialogTitle>Edit Output Template</DialogTitle>
                    <DialogDescription>Update output template information.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit_name">
                        Output Name <span className="text-red-500">*</span>
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
                        value={selectedTemplate.description || ""}
                        onChange={(e) =>
                          setSelectedTemplate({
                            ...selectedTemplate,
                            description: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit_phase">
                        Phase <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={selectedTemplate.phase?.toString()}
                        onValueChange={(value) =>
                          setSelectedTemplate({
                            ...selectedTemplate,
                            phase: Number.parseInt(value),
                          })
                        }
                      >
                        <SelectTrigger id="edit_phase">
                          <SelectValue placeholder="Select phase" />
                        </SelectTrigger>
                        <SelectContent>
                          {phaseTemplates.map((phase) => (
                            <SelectItem key={phase.id} value={phase.id.toString()}>
                              {phase.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit_ppap_element">
                        PPAP Element <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={selectedTemplate.ppap_element?.toString()}
                        onValueChange={(value) =>
                          setSelectedTemplate({
                            ...selectedTemplate,
                            ppap_element: Number.parseInt(value),
                          })
                        }
                      >
                        <SelectTrigger id="edit_ppap_element">
                          <SelectValue placeholder="Select PPAP element" />
                        </SelectTrigger>
                        <SelectContent>
                          {ppapElements.map((element) => (
                            <SelectItem key={element.id} value={element.id.toString()}>
                              {element.name} ({element.level})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit_document_type">Document Type</Label>
                      <Select
                        value={selectedTemplate.document_type || 'document'}
                        onValueChange={(value) =>
                          setSelectedTemplate({
                            ...selectedTemplate,
                            document_type: value,
                          })
                        }
                      >
                        <SelectTrigger id="edit_document_type">
                          <SelectValue placeholder="Select document type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="document">Document</SelectItem>
                          <SelectItem value="diagram">Diagram</SelectItem>
                          <SelectItem value="report">Report</SelectItem>
                          <SelectItem value="form">Form</SelectItem>
                          <SelectItem value="checklist">Checklist</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit_is_required">Required</Label>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="edit_is_required"
                          checked={selectedTemplate.is_required !== false}
                          onCheckedChange={(checked) =>
                            setSelectedTemplate({
                              ...selectedTemplate,
                              is_required: checked,
                            })
                          }
                        />
                        <Label htmlFor="edit_is_required">
                          {selectedTemplate.is_required !== false ? "Required" : "Optional"}
                        </Label>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit_is_active">Status</Label>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="edit_is_active"
                          checked={selectedTemplate.is_active !== false}
                          onCheckedChange={(checked) =>
                            setSelectedTemplate({
                              ...selectedTemplate,
                              is_active: checked,
                            })
                          }
                        />
                        <Label htmlFor="edit_is_active">{selectedTemplate.is_active !== false ? "Active" : "Inactive"}</Label>
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
