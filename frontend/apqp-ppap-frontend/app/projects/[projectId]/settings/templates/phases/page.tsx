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
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Edit, MoreHorizontal, Plus, Search, Trash2 } from "lucide-react"

interface PhaseTemplate {
  id: number
  name: string
  description: string
  order: number
  is_active: boolean
}

export default function PhaseTemplatesPage() {
  const [phaseTemplates, setPhaseTemplates] = useState<PhaseTemplate[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    description: "",
    order: 1,
    is_active: true,
  })

  useEffect(() => {
    const fetchPhaseTemplates = async () => {
      try {
        setLoading(true)
        // In a real app, this would fetch from the API
        // const data = await fetchApi<PhaseTemplate[]>('/phase-templates/');

        // For demo purposes, we'll use mock data
        const mockData: PhaseTemplate[] = [
          {
            id: 1,
            name: "Planning",
            description: "Define project goals, identify customer requirements, and establish the project team.",
            order: 1,
            is_active: true,
          },
          {
            id: 2,
            name: "Product Design & Development",
            description:
              "Develop and finalize product design, conduct design reviews, and perform design verification.",
            order: 2,
            is_active: true,
          },
          {
            id: 3,
            name: "Process Design & Development",
            description: "Develop manufacturing processes, create control plans, and establish quality standards.",
            order: 3,
            is_active: true,
          },
          {
            id: 4,
            name: "Product & Process Validation",
            description: "Validate product and process through production trials and testing.",
            order: 4,
            is_active: true,
          },
          {
            id: 5,
            name: "Production",
            description: "Launch full production, evaluate outcomes, and implement continuous improvement.",
            order: 5,
            is_active: true,
          },
        ]

        setPhaseTemplates(mockData)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch phase templates")
        console.error("Error fetching phase templates:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchPhaseTemplates()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setNewTemplate({
      ...newTemplate,
      [name]: value,
    })
  }

  const handleAddTemplate = async () => {
    try {
      // In a real app, this would call the API to create a template
      // const response = await fetchApi<PhaseTemplate>('/phase-templates/', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(newTemplate),
      // });

      // For demo purposes, we'll just add it to the state
      const mockNewTemplate: PhaseTemplate = {
        id: phaseTemplates.length + 1,
        name: newTemplate.name,
        description: newTemplate.description,
        order: newTemplate.order,
        is_active: newTemplate.is_active,
      }

      setPhaseTemplates([...phaseTemplates, mockNewTemplate])
      setIsAddDialogOpen(false)
      setNewTemplate({
        name: "",
        description: "",
        order: phaseTemplates.length + 1,
        is_active: true,
      })
    } catch (err) {
      console.error("Error adding phase template:", err)
      alert("Failed to add phase template")
    }
  }

  const handleDeleteTemplate = async (templateId: number) => {
    if (confirm("Are you sure you want to delete this phase template?")) {
      try {
        // In a real app, this would call the API to delete the template
        // await fetchApi(`/phase-templates/${templateId}/`, { method: 'DELETE' });

        // For demo purposes, we'll just remove it from the state
        setPhaseTemplates(phaseTemplates.filter((template) => template.id !== templateId))
      } catch (err) {
        console.error("Error deleting phase template:", err)
        alert("Failed to delete phase template")
      }
    }
  }

  // Filter templates based on search term
  const filteredTemplates = phaseTemplates.filter(
    (template) =>
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Phase Templates</h1>
        </div>

        <Tabs defaultValue="phases" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="phases">Phases</TabsTrigger>
            <TabsTrigger value="outputs" onClick={() => (window.location.href = "/settings/templates/outputs")}>
              Outputs
            </TabsTrigger>
            <TabsTrigger
              value="ppap-elements"
              onClick={() => (window.location.href = "/settings/templates/ppap-elements")}
            >
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
                      <Label htmlFor="name">Phase Name</Label>
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
                      <Label htmlFor="order">Order</Label>
                      <Input
                        id="order"
                        name="order"
                        type="number"
                        value={newTemplate.order}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddTemplate}>Add Phase Template</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
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
                    ) : filteredTemplates.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          No phase templates found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTemplates.map((template) => (
                        <TableRow key={template.id}>
                          <TableCell>{template.order}</TableCell>
                          <TableCell className="font-medium">{template.name}</TableCell>
                          <TableCell>{template.description}</TableCell>
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
