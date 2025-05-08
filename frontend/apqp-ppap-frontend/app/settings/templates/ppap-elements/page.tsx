"use client"

import { Badge } from "@/components/ui/badge"

import type React from "react"
import type { PPAPElement } from "@/config/api-types"

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
import { AlertTriangle, Edit, MoreHorizontal, Plus, Search, Trash2, FileDown, RefreshCw, Check, X } from "lucide-react"
import { templateApi } from "@/config/api-utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"

export default function PPAPElementsPage() {
  const router = useRouter()
  const [ppapElements, setPPAPElements] = useState<PPAPElement[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedElement, setSelectedElement] = useState<PPAPElement | null>(null)
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
  const [sortField, setSortField] = useState<"name" | "level">("name")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [refreshing, setRefreshing] = useState(false)
  const [levelFilter, setLevelFilter] = useState<number | "all">("all")

  useEffect(() => {
    fetchPPAPElements()
  }, [])

  const fetchPPAPElements = async () => {
    try {
      setLoading(true)
      setError(null)
      setRefreshing(true)
      
      // Get the paginated response
      const response = await templateApi.getAllPPAPElements()
      
      // Check if we got a valid array back
      if (!Array.isArray(response)) {
        throw new Error("Invalid response format from API")
      }
      
      // Process the elements to add boolean flags based on the level string
      const processedElements = response.map(element => {
        // Parse the level string (e.g. "1,2,3,4,5") into boolean properties
        const levels = element.level ? element.level.split(',') : []
        
        return {
          ...element,
          level_1_required: levels.includes('1'),
          level_2_required: levels.includes('2'),
          level_3_required: levels.includes('3'),
          level_4_required: levels.includes('4'),
          level_5_required: levels.includes('5'),
          is_active: element.is_active !== undefined ? element.is_active : true // Default to true if not provided
        }
      })
      
      setPPAPElements(processedElements)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch PPAP elements")
      console.error("Error fetching PPAP elements:", err)
      toast({
        title: "Error",
        description: "Failed to fetch PPAP elements. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

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

  // Convert the level flags to a comma-separated string when creating/updating
  const getLevelString = (element) => {
    const levels = []
    if (element.level_1_required) levels.push('1')
    if (element.level_2_required) levels.push('2')
    if (element.level_3_required) levels.push('3')
    if (element.level_4_required) levels.push('4')
    if (element.level_5_required) levels.push('5')
    return levels.join(',') || 'custom'
  }

  const handleAddElement = async () => {
    try {
      // Validate input
      if (!newElement.name.trim()) {
        toast({
          title: "Validation Error",
          description: "Element name is required",
          variant: "destructive",
        })
        return
      }

      setLoading(true)
      
      // Convert boolean flags to level string
      const apiData = {
        name: newElement.name,
        description: newElement.description,
        level: getLevelString(newElement),
        is_active: newElement.is_active
      }
      
      const response = await templateApi.createPPAPElement(apiData)
      
      // Process the response to add the boolean flags
      const createdElement = {
        ...response,
        level_1_required: newElement.level_1_required,
        level_2_required: newElement.level_2_required,
        level_3_required: newElement.level_3_required,
        level_4_required: newElement.level_4_required,
        level_5_required: newElement.level_5_required
      }

      setPPAPElements([...ppapElements, createdElement])
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

      toast({
        title: "Success",
        description: "PPAP element created successfully",
      })
    } catch (err) {
      console.error("Error adding PPAP element:", err)
      toast({
        title: "Error",
        description: "Failed to add PPAP element. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEditElement = async () => {
    if (!selectedElement) return

    try {
      // Validate input
      if (!selectedElement.name.trim()) {
        toast({
          title: "Validation Error",
          description: "Element name is required",
          variant: "destructive",
        })
        return
      }

      setLoading(true)
      
      // Convert boolean flags to level string
      const apiData = {
        name: selectedElement.name,
        description: selectedElement.description,
        level: getLevelString(selectedElement),
        is_active: selectedElement.is_active
      }

      const response = await templateApi.updatePPAPElement(selectedElement.id, apiData)
      
      // Process the response to add the boolean flags
      const updatedElement = {
        ...response,
        level_1_required: selectedElement.level_1_required,
        level_2_required: selectedElement.level_2_required,
        level_3_required: selectedElement.level_3_required,
        level_4_required: selectedElement.level_4_required,
        level_5_required: selectedElement.level_5_required
      }

      setPPAPElements(ppapElements.map((element) => (element.id === selectedElement.id ? updatedElement : element)))
      setIsEditDialogOpen(false)
      setSelectedElement(null)

      toast({
        title: "Success",
        description: "PPAP element updated successfully",
      })
    } catch (err) {
      console.error("Error updating PPAP element:", err)
      toast({
        title: "Error",
        description: "Failed to update PPAP element. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteElement = async (elementId: number) => {
    if (confirm("Are you sure you want to delete this PPAP element? This action cannot be undone.")) {
      try {
        setLoading(true)
        await templateApi.deletePPAPElement(elementId)
        setPPAPElements(ppapElements.filter((element) => element.id !== elementId))

        toast({
          title: "Success",
          description: "PPAP element deleted successfully",
        })
      } catch (err) {
        console.error("Error deleting PPAP element:", err)
        toast({
          title: "Error",
          description: "Failed to delete PPAP element. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
  }

  const handleToggleStatus = async (element: PPAPElement) => {
    try {
      setLoading(true)
      const updatedElement = await templateApi.updatePPAPElement(element.id, {
        ...element,
        is_active: !element.is_active,
      })

      setPPAPElements(ppapElements.map((e) => (e.id === element.id ? updatedElement : e)))

      toast({
        title: "Success",
        description: `PPAP element ${updatedElement.is_active ? "activated" : "deactivated"} successfully`,
      })
    } catch (err) {
      console.error("Error updating PPAP element status:", err)
      toast({
        title: "Error",
        description: "Failed to update PPAP element status. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (field: "name" | "level") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Export elements to CSV
  const exportToCSV = () => {
    try {
      // Create CSV content
      const headers = ["ID", "Name", "Description", "Level 1", "Level 2", "Level 3", "Level 4", "Level 5", "Status"]
      const csvContent =
        headers.join(",") +
        "\n" +
        ppapElements
          .map((element) => {
            return [
              element.id,
              `"${element.name.replace(/"/g, '""')}"`,
              `"${element.description.replace(/"/g, '""')}"`,
              element.level_1_required ? "Yes" : "No",
              element.level_2_required ? "Yes" : "No",
              element.level_3_required ? "Yes" : "No",
              element.level_4_required ? "Yes" : "No",
              element.level_5_required ? "Yes" : "No",
              element.is_active ? "Active" : "Inactive",
            ].join(",")
          })
          .join("\n")

      // Create download link
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute("download", `ppap_elements_${new Date().toISOString().split("T")[0]}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Export Successful",
        description: "PPAP elements exported to CSV successfully",
      })
    } catch (err) {
      console.error("Error exporting PPAP elements:", err)
      toast({
        title: "Export Failed",
        description: "Failed to export PPAP elements. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Calculate level score (for sorting)
  const getLevelScore = (element: PPAPElement): number => {
    return (
      (element.level_1_required ? 1 : 0) +
      (element.level_2_required ? 2 : 0) +
      (element.level_3_required ? 4 : 0) +
      (element.level_4_required ? 8 : 0) +
      (element.level_5_required ? 16 : 0)
    )
  }

  // Filter elements based on search term and level filter
  const filteredElements = ppapElements.filter((element) => {
    const matchesSearch =
      element.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      element.description.toLowerCase().includes(searchTerm.toLowerCase())

    let matchesLevelFilter = true
    if (levelFilter !== "all") {
      const level = Number(levelFilter)
      switch (level) {
        case 1:
          matchesLevelFilter = element.level_1_required
          break
        case 2:
          matchesLevelFilter = element.level_2_required
          break
        case 3:
          matchesLevelFilter = element.level_3_required
          break
        case 4:
          matchesLevelFilter = element.level_4_required
          break
        case 5:
          matchesLevelFilter = element.level_5_required
          break
      }
    }

    return matchesSearch && matchesLevelFilter
  })

  // Sort elements
  const sortedElements = [...filteredElements].sort((a, b) => {
    if (sortField === "name") {
      return sortDirection === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
    } else {
      const scoreA = getLevelScore(a)
      const scoreB = getLevelScore(b)
      return sortDirection === "asc" ? scoreA - scoreB : scoreB - scoreA
    }
  })

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">PPAP Elements</h1>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={exportToCSV} disabled={loading || ppapElements.length === 0}>
              <FileDown className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={fetchPPAPElements} disabled={refreshing}>
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

        <Tabs defaultValue="ppap-elements" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="phases" onClick={() => router.push("/settings/templates/phases")}>
              Phases
            </TabsTrigger>
            <TabsTrigger value="outputs" onClick={() => router.push("/settings/templates/outputs")}>
              Outputs
            </TabsTrigger>
            <TabsTrigger value="ppap-elements">PPAP Elements</TabsTrigger>
          </TabsList>

          <TabsContent value="ppap-elements" className="space-y-4 mt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex flex-col sm:flex-row gap-2 flex-1">
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
                <select
                  className="h-10 w-full sm:w-[180px] rounded-md border border-input bg-background px-3 py-2"
                  value={levelFilter === "all" ? "all" : levelFilter.toString()}
                  onChange={(e) => setLevelFilter(e.target.value === "all" ? "all" : Number.parseInt(e.target.value))}
                >
                  <option value="all">All Levels</option>
                  <option value="1">Level 1</option>
                  <option value="2">Level 2</option>
                  <option value="3">Level 3</option>
                  <option value="4">Level 4</option>
                  <option value="5">Level 5</option>
                </select>
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
                      <Label htmlFor="name">
                        Element Name <span className="text-red-500">*</span>
                      </Label>
                      <Input id="name" name="name" value={newElement.name} onChange={handleInputChange} required />
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
                          <Switch
                            id="level_1_required"
                            checked={newElement.level_1_required}
                            onCheckedChange={(checked) => handleCheckboxChange("level_1_required", checked)}
                          />
                        </div>
                        <div className="flex flex-col items-center">
                          <Label htmlFor="level_2_required" className="mb-1">
                            Level 2
                          </Label>
                          <Switch
                            id="level_2_required"
                            checked={newElement.level_2_required}
                            onCheckedChange={(checked) => handleCheckboxChange("level_2_required", checked)}
                          />
                        </div>
                        <div className="flex flex-col items-center">
                          <Label htmlFor="level_3_required" className="mb-1">
                            Level 3
                          </Label>
                          <Switch
                            id="level_3_required"
                            checked={newElement.level_3_required}
                            onCheckedChange={(checked) => handleCheckboxChange("level_3_required", checked)}
                          />
                        </div>
                        <div className="flex flex-col items-center">
                          <Label htmlFor="level_4_required" className="mb-1">
                            Level 4
                          </Label>
                          <Switch
                            id="level_4_required"
                            checked={newElement.level_4_required}
                            onCheckedChange={(checked) => handleCheckboxChange("level_4_required", checked)}
                          />
                        </div>
                        <div className="flex flex-col items-center">
                          <Label htmlFor="level_5_required" className="mb-1">
                            Level 5
                          </Label>
                          <Switch
                            id="level_5_required"
                            checked={newElement.level_5_required}
                            onCheckedChange={(checked) => handleCheckboxChange("level_5_required", checked)}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="is_active">Status</Label>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="is_active"
                          checked={newElement.is_active}
                          onCheckedChange={(checked) => handleCheckboxChange("is_active", checked)}
                        />
                        <Label htmlFor="is_active">{newElement.is_active ? "Active" : "Inactive"}</Label>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddElement} disabled={loading}>
                      {loading ? "Adding..." : "Add PPAP Element"}
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
                      <TableHead>Description</TableHead>
                      <TableHead className="text-center cursor-pointer" onClick={() => handleSort("level")} colSpan={5}>
                        PPAP Levels {sortField === "level" && (sortDirection === "asc" ? "↑" : "↓")}
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                    <TableRow>
                      <TableHead colSpan={2}></TableHead>
                      <TableHead className="text-center">Level 1</TableHead>
                      <TableHead className="text-center">Level 2</TableHead>
                      <TableHead className="text-center">Level 3</TableHead>
                      <TableHead className="text-center">Level 4</TableHead>
                      <TableHead className="text-center">Level 5</TableHead>
                      <TableHead colSpan={2}></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading && ppapElements.length === 0 ? (
                      Array.from({ length: 5 }).map((_, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Skeleton className="h-4 w-40" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-60" />
                          </TableCell>
                          <TableCell className="text-center">
                            <Skeleton className="h-4 w-4 mx-auto" />
                          </TableCell>
                          <TableCell className="text-center">
                            <Skeleton className="h-4 w-4 mx-auto" />
                          </TableCell>
                          <TableCell className="text-center">
                            <Skeleton className="h-4 w-4 mx-auto" />
                          </TableCell>
                          <TableCell className="text-center">
                            <Skeleton className="h-4 w-4 mx-auto" />
                          </TableCell>
                          <TableCell className="text-center">
                            <Skeleton className="h-4 w-4 mx-auto" />
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
                        <TableCell colSpan={9} className="h-24 text-center text-red-500">
                          {error}
                        </TableCell>
                      </TableRow>
                    ) : sortedElements.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="h-24 text-center">
                          {searchTerm || levelFilter !== "all"
                            ? "No matching PPAP elements found"
                            : "No PPAP elements found"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      sortedElements.map((element) => (
                        <TableRow key={element.id}>
                          <TableCell className="font-medium">{element.name}</TableCell>
                          <TableCell>
                            {element.description 
                              ? (element.description.length > 60
                                 ? `${element.description.substring(0, 60)}...`
                                 : element.description)
                              : ""}
                          </TableCell>
                          <TableCell className="text-center">
                            {element.level_1_required ? (
                              <Check className="h-4 w-4 text-green-600 mx-auto" />
                            ) : (
                              <X className="h-4 w-4 text-red-600 mx-auto" />
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {element.level_2_required ? (
                              <Check className="h-4 w-4 text-green-600 mx-auto" />
                            ) : (
                              <X className="h-4 w-4 text-red-600 mx-auto" />
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {element.level_3_required ? (
                              <Check className="h-4 w-4 text-green-600 mx-auto" />
                            ) : (
                              <X className="h-4 w-4 text-red-600 mx-auto" />
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {element.level_4_required ? (
                              <Check className="h-4 w-4 text-green-600 mx-auto" />
                            ) : (
                              <X className="h-4 w-4 text-red-600 mx-auto" />
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {element.level_5_required ? (
                              <Check className="h-4 w-4 text-green-600 mx-auto" />
                            ) : (
                              <X className="h-4 w-4 text-red-600 mx-auto" />
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                element.is_active
                                  ? "bg-green-100 text-green-800 hover:bg-green-100"
                                  : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                              }
                            >
                              {element.is_active ? "Active" : "Inactive"}
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
                                    setSelectedElement(element)
                                    setIsEditDialogOpen(true)
                                  }}
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleToggleStatus(element)}>
                                  {element.is_active ? (
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

            {/* Edit Element Dialog */}
            {selectedElement && (
              <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit PPAP Element</DialogTitle>
                    <DialogDescription>Update PPAP element information.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit_name">
                        Element Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="edit_name"
                        value={selectedElement.name}
                        onChange={(e) =>
                          setSelectedElement({
                            ...selectedElement,
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
                        value={selectedElement.description}
                        onChange={(e) =>
                          setSelectedElement({
                            ...selectedElement,
                            description: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Required for PPAP Levels</Label>
                      <div className="grid grid-cols-5 gap-2 mt-2">
                        <div className="flex flex-col items-center">
                          <Label htmlFor="edit_level_1_required" className="mb-1">
                            Level 1
                          </Label>
                          <Switch
                            id="edit_level_1_required"
                            checked={selectedElement.level_1_required}
                            onCheckedChange={(checked) =>
                              setSelectedElement({
                                ...selectedElement,
                                level_1_required: checked,
                              })
                            }
                          />
                        </div>
                        <div className="flex flex-col items-center">
                          <Label htmlFor="edit_level_2_required" className="mb-1">
                            Level 2
                          </Label>
                          <Switch
                            id="edit_level_2_required"
                            checked={selectedElement.level_2_required}
                            onCheckedChange={(checked) =>
                              setSelectedElement({
                                ...selectedElement,
                                level_2_required: checked,
                              })
                            }
                          />
                        </div>
                        <div className="flex flex-col items-center">
                          <Label htmlFor="edit_level_3_required" className="mb-1">
                            Level 3
                          </Label>
                          <Switch
                            id="edit_level_3_required"
                            checked={selectedElement.level_3_required}
                            onCheckedChange={(checked) =>
                              setSelectedElement({
                                ...selectedElement,
                                level_3_required: checked,
                              })
                            }
                          />
                        </div>
                        <div className="flex flex-col items-center">
                          <Label htmlFor="edit_level_4_required" className="mb-1">
                            Level 4
                          </Label>
                          <Switch
                            id="edit_level_4_required"
                            checked={selectedElement.level_4_required}
                            onCheckedChange={(checked) =>
                              setSelectedElement({
                                ...selectedElement,
                                level_4_required: checked,
                              })
                            }
                          />
                        </div>
                        <div className="flex flex-col items-center">
                          <Label htmlFor="edit_level_5_required" className="mb-1">
                            Level 5
                          </Label>
                          <Switch
                            id="edit_level_5_required"
                            checked={selectedElement.level_5_required}
                            onCheckedChange={(checked) =>
                              setSelectedElement({
                                ...selectedElement,
                                level_5_required: checked,
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit_is_active">Status</Label>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="edit_is_active"
                          checked={selectedElement.is_active}
                          onCheckedChange={(checked) =>
                            setSelectedElement({
                              ...selectedElement,
                              is_active: checked,
                            })
                          }
                        />
                        <Label htmlFor="edit_is_active">{selectedElement.is_active ? "Active" : "Inactive"}</Label>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleEditElement} disabled={loading}>
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
