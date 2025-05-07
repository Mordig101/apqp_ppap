"use client"

import type React from "react"

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
import { Edit, MoreHorizontal, Plus, Search, Trash2 } from "lucide-react"

interface OutputTemplate {
  id: number
  name: string
  description: string
  phase_id: number
  phase_name: string
  document_type: string
  is_required: boolean
  is_active: boolean
}

export default function OutputTemplatesPage() {
  const [outputTemplates, setOutputTemplates] = useState<OutputTemplate[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    description: "",
    phase_id: 1,
    document_type: "document",
    is_required: true,
    is_active: true,
  })

  useEffect(() => {
    const fetchOutputTemplates = async () => {
      try {
        setLoading(true)
        // In a real app, this would fetch from the API
        // const data = await fetchApi<OutputTemplate[]>('/output-templates/');

        // For demo purposes, we'll use mock data
        const mockData: OutputTemplate[] = [
          {
            id: 1,
            name: "Design FMEA",
            description: "Failure Mode and Effects Analysis for the product design",
            phase_id: 2,
            phase_name: "Product Design & Development",
            document_type: "document",
            is_required: true,
            is_active: true,
          },
          {
            id: 2,
            name: "Process Flow Diagram",
            description: "Visual representation of the manufacturing process flow",
            phase_id: 3,
            phase_name: "Process Design & Development",
            document_type: "diagram",
            is_required: true,
            is_active: true,
          },
          {
            id: 3,
            name: "Control Plan",
            description: "Document describing the measures to control the process",
            phase_id: 3,
            phase_name: "Process Design & Development",
            document_type: "document",
            is_required: true,
            is_active: true,
          },
          {
            id: 4,
            name: "Process FMEA",
            description: "Failure Mode and Effects Analysis for the manufacturing process",
            phase_id: 3,
            phase_name: "Process Design & Development",
            document_type: "document",
            is_required: true,
            is_active: true,
          },
          {
            id: 5,
            name: "Measurement System Analysis",
            description: "Analysis of the measurement system capability",
            phase_id: 4,
            phase_name: "Product & Process Validation",
            document_type: "report",
            is_required: true,
            is_active: true,
          },
        ]

        setOutputTemplates(mockData)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch output templates")
        console.error("Error fetching output templates:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchOutputTemplates()
  }, [])

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
      // In a real app, this would call the API to create a template
      // const response = await fetchApi<OutputTemplate>('/output-templates/', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(newTemplate),
      // });

      // For demo purposes, we'll just add it to the state
      const mockNewTemplate: OutputTemplate = {
        id: outputTemplates.length + 1,
        name: newTemplate.name,
        description: newTemplate.description,
        phase_id: newTemplate.phase_id,
        phase_name:
          newTemplate.phase_id === 1
            ? "Planning"
            : newTemplate.phase_id === 2
              ? "Product Design & Development"
              : newTemplate.phase_id === 3
                ? "Process Design & Development"
                : newTemplate.phase_id === 4
                  ? "Product & Process Validation"
                  : "Production",
        document_type: newTemplate.document_type,
        is_required: newTemplate.is_required,
        is_active: newTemplate.is_active,
      }

      setOutputTemplates([...outputTemplates, mockNewTemplate])
      setIsAddDialogOpen(false)
      setNewTemplate({
        name: "",
        description: "",
        phase_id: 1,
        document_type: "document",
        is_required: true,
        is_active: true,
      })
    } catch (err) {
      console.error("Error adding output template:", err)
      alert("Failed to add output template")
    }
  }

  const handleDeleteTemplate = async (templateId: number) => {
    if (confirm("Are you sure you want to delete this output template?")) {
      try {
        // In a real app, this would call the API to delete the template
        // await fetchApi(`/output-templates/${templateId}/`, { method: 'DELETE' });

        // For demo purposes, we'll just remove it from the state
        setOutputTemplates(outputTemplates.filter((template) => template.id !== templateId))
      } catch (err) {
        console.error("Error deleting output template:", err)
        alert("Failed to delete output template")
      }
    }
  }

  // Filter templates based on search term
  const filteredTemplates = outputTemplates.filter(
    (template) =>
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.phase_name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Output Templates</h1>
        </div>

        <Tabs defaultValue="outputs" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="phases" onClick={() => (window.location.href = "/settings/templates/phases")}>
              Phases
            </TabsTrigger>
            <TabsTrigger value="outputs">Outputs</TabsTrigger>
            <TabsTrigger
              value="ppap-elements"
              onClick={() => (window.location.href = "/settings/templates/ppap-elements")}
            >
              PPAP Elements
            </TabsTrigger>
          </TabsList>

          <TabsContent value="outputs" className="space-y-4 mt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
                      <Label htmlFor="name">Output Name</Label>
                      <Input id="name" name="name" value={newTemplate.name} onChange={handleInputChange} />
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
                      <Label htmlFor="phase_id">Phase</Label>
                      <Select
                        value={newTemplate.phase_id.toString()}
                        onValueChange={(value) => handleSelectChange("phase_id", Number.parseInt(value))}
                      >
                        <SelectTrigger id="phase_id">
                          <SelectValue placeholder="Select phase" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Planning</SelectItem>
                          <SelectItem value="2">Product Design & Development</SelectItem>
                          <SelectItem value="3">Process Design & Development</SelectItem>
                          <SelectItem value="4">Product & Process Validation</SelectItem>
                          <SelectItem value="5">Production</SelectItem>
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
                      <Select
                        value={newTemplate.is_required ? "true" : "false"}
                        onValueChange={(value) => handleSelectChange("is_required", value === "true")}
                      >
                        <SelectTrigger id="is_required">
                          <SelectValue placeholder="Is this output required?" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Yes</SelectItem>
                          <SelectItem value="false">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddTemplate}>Add Output Template</Button>
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
                      <TableHead>Phase</TableHead>
                      <TableHead>Document Type</TableHead>
                      <TableHead>Required</TableHead>
                      <TableHead>Status</TableHead>
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
                        </TableCell>
                      </TableRow>
                    ) : error ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center text-red-500">
                          {error}
                        </TableCell>
                      </TableRow>
                    ) : filteredTemplates.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          No output templates found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTemplates.map((template) => (
                        <TableRow key={template.id}>
                          <TableCell className="font-medium">
                            <div>
                              <div>{template.name}</div>
                              <div className="text-xs text-muted-foreground">{template.description}</div>
                            </div>
                          </TableCell>
                          <TableCell>{template.phase_name}</TableCell>
                          <TableCell className="capitalize">{template.document_type}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                template.is_required
                                  ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                                  : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                              }
                            >
                              {template.is_required ? "Required" : "Optional"}
                            </Badge>
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
                                <DropdownMenuItem>
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
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
