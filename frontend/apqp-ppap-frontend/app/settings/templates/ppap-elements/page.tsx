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
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Edit, MoreHorizontal, Plus, Search, Trash2 } from "lucide-react"

interface PPAPElement {
  id: number
  name: string
  description: string
  level_1_required: boolean
  level_2_required: boolean
  level_3_required: boolean
  level_4_required: boolean
  level_5_required: boolean
  is_active: boolean
}

export default function PPAPElementsPage() {
  const [ppapElements, setPPAPElements] = useState<PPAPElement[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newElement, setNewElement] = useState({
    name: "",
    description: "",
    level_1_required: false,
    level_2_required: false,
    level_3_required: true,
    level_4_required: true,
    level_5_required: true,
    is_active: true,
  })

  useEffect(() => {
    const fetchPPAPElements = async () => {
      try {
        setLoading(true)
        // In a real app, this would fetch from the API
        // const data = await fetchApi<PPAPElement[]>('/ppap-elements/');

        // For demo purposes, we'll use mock data
        const mockData: PPAPElement[] = [
          {
            id: 1,
            name: "Design Records",
            description: "Engineering drawings, CAD data, specifications",
            level_1_required: true,
            level_2_required: true,
            level_3_required: true,
            level_4_required: true,
            level_5_required: true,
            is_active: true,
          },
          {
            id: 2,
            name: "Engineering Change Documents",
            description: "Documents for all authorized engineering changes",
            level_1_required: false,
            level_2_required: true,
            level_3_required: true,
            level_4_required: true,
            level_5_required: true,
            is_active: true,
          },
          {
            id: 3,
            name: "Customer Engineering Approval",
            description: "Evidence of customer engineering approval",
            level_1_required: false,
            level_2_required: false,
            level_3_required: true,
            level_4_required: true,
            level_5_required: true,
            is_active: true,
          },
          {
            id: 4,
            name: "Design FMEA",
            description: "Design Failure Mode and Effects Analysis",
            level_1_required: false,
            level_2_required: false,
            level_3_required: true,
            level_4_required: true,
            level_5_required: true,
            is_active: true,
          },
          {
            id: 5,
            name: "Process Flow Diagram",
            description: "Visual representation of the manufacturing process",
            level_1_required: false,
            level_2_required: false,
            level_3_required: true,
            level_4_required: true,
            level_5_required: true,
            is_active: true,
          },
        ]

        setPPAPElements(mockData)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch PPAP elements")
        console.error("Error fetching PPAP elements:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchPPAPElements()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setNewElement({
      ...newElement,
      [name]: value,
    })
  }

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setNewElement({
      ...newElement,
      [name]: checked,
    })
  }

  const handleAddElement = async () => {
    try {
      // In a real app, this would call the API to create a PPAP element
      // const response = await fetchApi<PPAPElement>('/ppap-elements/', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(newElement),
      // });

      // For demo purposes, we'll just add it to the state
      const mockNewElement: PPAPElement = {
        id: ppapElements.length + 1,
        name: newElement.name,
        description: newElement.description,
        level_1_required: newElement.level_1_required,
        level_2_required: newElement.level_2_required,
        level_3_required: newElement.level_3_required,
        level_4_required: newElement.level_4_required,
        level_5_required: newElement.level_5_required,
        is_active: newElement.is_active,
      }

      setPPAPElements([...ppapElements, mockNewElement])
      setIsAddDialogOpen(false)
      setNewElement({
        name: "",
        description: "",
        level_1_required: false,
        level_2_required: false,
        level_3_required: true,
        level_4_required: true,
        level_5_required: true,
        is_active: true,
      })
    } catch (err) {
      console.error("Error adding PPAP element:", err)
      alert("Failed to add PPAP element")
    }
  }

  const handleDeleteElement = async (elementId: number) => {
    if (confirm("Are you sure you want to delete this PPAP element?")) {
      try {
        // In a real app, this would call the API to delete the PPAP element
        // await fetchApi(`/ppap-elements/${elementId}/`, { method: 'DELETE' });

        // For demo purposes, we'll just remove it from the state
        setPPAPElements(ppapElements.filter((element) => element.id !== elementId))
      } catch (err) {
        console.error("Error deleting PPAP element:", err)
        alert("Failed to delete PPAP element")
      }
    }
  }

  // Filter elements based on search term
  const filteredElements = ppapElements.filter(
    (element) =>
      element.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      element.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">PPAP Elements</h1>
        </div>

        <Tabs defaultValue="ppap-elements" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="phases" onClick={() => (window.location.href = "/settings/templates/phases")}>
              Phases
            </TabsTrigger>
            <TabsTrigger value="outputs" onClick={() => (window.location.href = "/settings/templates/outputs")}>
              Outputs
            </TabsTrigger>
            <TabsTrigger value="ppap-elements">PPAP Elements</TabsTrigger>
          </TabsList>

          <TabsContent value="ppap-elements" className="space-y-4 mt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search PPAP elements..."
                  className="pl-8 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add PPAP Element
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New PPAP Element</DialogTitle>
                    <DialogDescription>
                      Create a new PPAP element for production part approval process.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Element Name</Label>
                      <Input id="name" name="name" value={newElement.name} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <textarea
                        id="description"
                        name="description"
                        className="w-full min-h-[100px] p-2 border rounded-md"
                        value={newElement.description}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Required for PPAP Levels</Label>
                      <div className="grid grid-cols-5 gap-2 mt-2">
                        <div className="flex flex-col items-center">
                          <Label htmlFor="level_1_required" className="mb-1">
                            Level 1
                          </Label>
                          <input
                            type="checkbox"
                            id="level_1_required"
                            checked={newElement.level_1_required}
                            onChange={(e) => handleCheckboxChange("level_1_required", e.target.checked)}
                            className="h-4 w-4"
                          />
                        </div>
                        <div className="flex flex-col items-center">
                          <Label htmlFor="level_2_required" className="mb-1">
                            Level 2
                          </Label>
                          <input
                            type="checkbox"
                            id="level_2_required"
                            checked={newElement.level_2_required}
                            onChange={(e) => handleCheckboxChange("level_2_required", e.target.checked)}
                            className="h-4 w-4"
                          />
                        </div>
                        <div className="flex flex-col items-center">
                          <Label htmlFor="level_3_required" className="mb-1">
                            Level 3
                          </Label>
                          <input
                            type="checkbox"
                            id="level_3_required"
                            checked={newElement.level_3_required}
                            onChange={(e) => handleCheckboxChange("level_3_required", e.target.checked)}
                            className="h-4 w-4"
                          />
                        </div>
                        <div className="flex flex-col items-center">
                          <Label htmlFor="level_4_required" className="mb-1">
                            Level 4
                          </Label>
                          <input
                            type="checkbox"
                            id="level_4_required"
                            checked={newElement.level_4_required}
                            onChange={(e) => handleCheckboxChange("level_4_required", e.target.checked)}
                            className="h-4 w-4"
                          />
                        </div>
                        <div className="flex flex-col items-center">
                          <Label htmlFor="level_5_required" className="mb-1">
                            Level 5
                          </Label>
                          <input
                            type="checkbox"
                            id="level_5_required"
                            checked={newElement.level_5_required}
                            onChange={(e) => handleCheckboxChange("level_5_required", e.target.checked)}
                            className="h-4 w-4"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddElement}>Add PPAP Element</Button>
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
                      <TableHead>Description</TableHead>
                      <TableHead className="text-center">Level 1</TableHead>
                      <TableHead className="text-center">Level 2</TableHead>
                      <TableHead className="text-center">Level 3</TableHead>
                      <TableHead className="text-center">Level 4</TableHead>
                      <TableHead className="text-center">Level 5</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="h-24 text-center">
                          <div className="flex justify-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-gray-900"></div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : error ? (
                      <TableRow>
                        <TableCell colSpan={8} className="h-24 text-center text-red-500">
                          {error}
                        </TableCell>
                      </TableRow>
                    ) : filteredElements.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="h-24 text-center">
                          No PPAP elements found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredElements.map((element) => (
                        <TableRow key={element.id}>
                          <TableCell className="font-medium">{element.name}</TableCell>
                          <TableCell>{element.description}</TableCell>
                          <TableCell className="text-center">{element.level_1_required ? "✓" : "–"}</TableCell>
                          <TableCell className="text-center">{element.level_2_required ? "✓" : "–"}</TableCell>
                          <TableCell className="text-center">{element.level_3_required ? "✓" : "–"}</TableCell>
                          <TableCell className="text-center">{element.level_4_required ? "✓" : "–"}</TableCell>
                          <TableCell className="text-center">{element.level_5_required ? "✓" : "–"}</TableCell>
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
                                  onClick={() => handleDeleteElement(element.id)}
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
