"use client"

import { useState, useEffect } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Textarea } from "@/components/ui/textarea"
import {
  FileUp,
  Plus,
  Save,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Download,
  Pencil,
  Eye,
  Search,
  Filter,
  ArrowRight,
  Info,
  Maximize2,
  GitBranch,
  MessageSquare,
  History,
  Users,
  Copy,
  CheckCircle,
  X,
  ChevronDown,
} from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { projectApi } from "@/config/api-utils"
import type { Project, Phase, Output } from "@/config/api-types"

interface Comment {
  id: string
  documentId: string
  user: string
  avatar: string
  date: string
  text: string
}

export default function WorkspacePage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const projectId = Number(params.projectId)
  const outputIdParam = searchParams.get("output")

  const [project, setProject] = useState<Project | null>(null)
  const [phases, setPhases] = useState<Phase[]>([])
  const [selectedPhase, setSelectedPhase] = useState<Phase | null>(null)
  const [outputs, setOutputs] = useState<Output[]>([])
  const [inputs, setInputs] = useState<Output[]>([])
  const [selectedInput, setSelectedInput] = useState<string | null>(null)
  const [selectedOutput, setSelectedOutput] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"input" | "split" | "output" | "edit">("split")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showComments, setShowComments] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [searchInputQuery, setSearchInputQuery] = useState("")
  const [searchOutputQuery, setSearchOutputQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterOwner, setFilterOwner] = useState("all")
  const [showCompleted, setShowCompleted] = useState(true)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [showActivityFeed, setShowActivityFeed] = useState(false)
  const [expandedInputs, setExpandedInputs] = useState<string[]>([])
  const [expandedOutputs, setExpandedOutputs] = useState<string[]>([])
  const [showNotification, setShowNotification] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState("")
  const [notificationType, setNotificationType] = useState<"success" | "error" | "info">("info")
  const [activeDocument, setActiveDocument] = useState<{
    id: string
    type: "input" | "output"
    name: string
    content: string
    status?: string
    dueDate?: string
    assignedTo?: string
    lastUpdated?: string
    updatedBy?: string
  } | null>(null)

  // Sample comments for documents - in a real app, these would come from the API
  const [comments, setComments] = useState<Comment[]>([
    {
      id: "1",
      documentId: "1",
      user: "John Doe",
      avatar: "JD",
      date: "2023-02-10T14:30:00",
      text: "Please review the risk assessment section and provide feedback.",
    },
    {
      id: "2",
      documentId: "1",
      user: "Jane Smith",
      avatar: "JS",
      date: "2023-02-11T09:15:00",
      text: "The risk assessment looks good, but we should add more details about potential failure modes in the assembly process.",
    },
    {
      id: "3",
      documentId: "2",
      user: "Mike Johnson",
      avatar: "MJ",
      date: "2023-03-06T11:20:00",
      text: "The current flow doesn't account for the quality check after step 3. Please update.",
    },
  ])

  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        setLoading(true)
        const projectData = await projectApi.getProject(projectId)
        setProject(projectData)

        // Fetch phases for the project
        if (projectData.ppap) {
          try {
            // In a real app, you would fetch phases for the PPAP
            // For now, we'll use sample data
            const phasesData = [
              {
                id: 1,
                template: 1,
                responsible: null,
                ppap: projectData.ppap,
                status: "Not Started",
                history_id: "history_id",
                name: "Phase 1: Planning",
                description: "Define project goals and requirements",
                progress: 100,
                template_details: {
                  name: "Phase 1: Planning",
                  description: "Define project goals and requirements",
                },
              },
              {
                id: 2,
                template: 2,
                responsible: null,
                ppap: projectData.ppap,
                status: "In Progress",
                history_id: "history_id",
                name: "Phase 2: Product Design & Development",
                description: "Develop and finalize product design",
                progress: 85,
                template_details: {
                  name: "Phase 2: Product Design & Development",
                  description: "Develop and finalize product design",
                },
              },
              {
                id: 3,
                template: 3,
                responsible: null,
                ppap: projectData.ppap,
                status: "Not Started",
                history_id: "history_id",
                name: "Phase 3: Process Design & Development",
                description: "Develop manufacturing processes",
                progress: 60,
                template_details: {
                  name: "Phase 3: Process Design & Development",
                  description: "Develop manufacturing processes",
                },
              },
            ]

            setPhases(phasesData)

            // Select the first phase by default
            if (phasesData.length > 0) {
              const firstPhase = phasesData[0]
              setSelectedPhase(firstPhase)

              // Fetch outputs for the selected phase
              // In a real app, you would fetch outputs for the phase
              // For now, we'll use sample data
              const outputsData = [
                {
                  id: "1",
                  name: "Design FMEA",
                  phase: 2,
                  type: "document",
                  status: "completed",
                  dueDate: "2023-02-15",
                  assignedTo: "Engineering Team",
                  description: "Failure Mode and Effects Analysis for the product design",
                  content:
                    "# Design FMEA\n\n## Component: Main Housing\n\n| Failure Mode | Potential Effects | Severity (1-10) | Potential Causes | Occurrence (1-10) | Current Controls | Detection (1-10) | RPN | Recommended Actions |\n|--------------|-------------------|-----------------|------------------|-------------------|------------------|------------------|-----|---------------------|\n| Cracking | Product failure, safety hazard | 9 | Material too brittle, impact damage | 4 | Material testing, drop tests | 3 | 108 | Evaluate alternative materials with higher impact resistance |\n| Warping | Poor fit, leakage | 7 | Thermal stress, improper cooling | 5 | Thermal cycling tests | 4 | 140 | Modify cooling process, add reinforcement ribs |\n| Discoloration | Customer dissatisfaction | 3 | UV exposure, chemical reaction | 6 | Accelerated aging tests | 2 | 36 | Add UV stabilizers to material |",
                  template_details: {
                    name: "Design FMEA",
                    description: "Failure Mode and Effects Analysis for the product design",
                  },
                },
                {
                  id: "2",
                  name: "Process Flow Diagram",
                  phase: 3,
                  type: "document",
                  status: "in-progress",
                  dueDate: "2023-03-10",
                  assignedTo: "Production Team",
                  description: "Visual representation of the manufacturing process flow",
                  content:
                    "# Process Flow Diagram\n\n## Manufacturing Process Overview\n\nRaw Material Receiving → Inspection → Material Preparation → Component Fabrication → Sub-Assembly → Final Assembly → Testing → Packaging → Shipping",
                  template_details: {
                    name: "Process Flow Diagram",
                    description: "Visual representation of the manufacturing process flow",
                  },
                },
              ]

              setOutputs(outputsData)

              // Fetch inputs (outputs from previous phases)
              const inputsData = [
                {
                  id: "3",
                  name: "Project Charter",
                  phase: 1,
                  type: "document",
                  status: "completed",
                  lastUpdated: "2023-01-15",
                  updatedBy: "John Doe",
                  description: "Defines the project scope, objectives, and participants",
                  content:
                    "# Project Charter\n\n## Project Overview\nThis project aims to develop a new manufacturing process for our flagship product line. The process should improve efficiency by 30% while maintaining or improving quality standards.",
                  template_details: {
                    name: "Project Charter",
                    description: "Defines the project scope, objectives, and participants",
                  },
                },
                {
                  id: "4",
                  name: "Customer Requirements",
                  phase: 1,
                  type: "document",
                  status: "completed",
                  lastUpdated: "2023-01-20",
                  updatedBy: "Jane Smith",
                  description: "Detailed list of customer specifications and requirements",
                  content:
                    '# Customer Requirements Document\n\n## Product Specifications\n- Dimensions: 10" x 5" x 2" (±0.05")\n- Weight: 1.5 lbs maximum\n- Material: Food-grade stainless steel\n- Finish: Brushed, no visible tooling marks\n- Operating temperature range: -20°C to 150°C',
                  template_details: {
                    name: "Customer Requirements",
                    description: "Detailed list of customer specifications and requirements",
                  },
                },
              ]

              setInputs(inputsData)

              // If output ID is in URL params, select it
              if (outputIdParam) {
                const outputId = outputIdParam
                const output = outputsData.find((o) => o.id === outputId)
                if (output) {
                  setSelectedOutput(output.id)
                  setActiveDocument({
                    id: output.id,
                    type: "output",
                    name: output.name,
                    content: output.content,
                    status: output.status,
                    dueDate: output.dueDate,
                    assignedTo: output.assignedTo,
                  })
                }
              }
            }
          } catch (err: any) {
            console.error("Error fetching phases:", err)
            setError(err.message || "Failed to load phases")
          }
        }
      } catch (err: any) {
        console.error("Error fetching project data:", err)
        setError(err.message || "Failed to load project data")
      } finally {
        setLoading(false)
      }
    }

    if (projectId) {
      fetchProjectData()
    }
  }, [projectId, outputIdParam])

  const handlePhaseChange = async (phaseId: number) => {
    const phase = phases.find((p) => p.id === phaseId)
    if (phase) {
      setSelectedPhase(phase)

      // In a real app, you would fetch outputs for the selected phase
      // For now, we'll filter our sample data
      const phaseOutputs = outputs.filter((o) => o.phase === phaseId)
      setOutputs(phaseOutputs)

      // Get inputs from previous phases
      const phaseInputs = inputs.filter((i) => i.phase < phaseId)
      setInputs(phaseInputs)

      setSelectedInput(null)
      setSelectedOutput(null)
      setActiveDocument(null)
    }
  }

  const toggleInputExpansion = (inputId: string) => {
    if (expandedInputs.includes(inputId)) {
      setExpandedInputs(expandedInputs.filter((id) => id !== inputId))
    } else {
      setExpandedInputs([...expandedInputs, inputId])
    }
  }

  const toggleOutputExpansion = (outputId: string) => {
    if (expandedOutputs.includes(outputId)) {
      setExpandedOutputs(expandedOutputs.filter((id) => id !== outputId))
    } else {
      setExpandedOutputs([...expandedOutputs, outputId])
    }
  }

  const handleInputSelect = (inputId: string) => {
    const selectedInputDoc = inputs.find((input) => input.id === inputId)
    if (selectedInputDoc) {
      setSelectedInput(inputId)

      // Make sure the parent group is expanded
      if (!expandedInputs.includes(selectedInputDoc.name)) {
        setExpandedInputs([...expandedInputs, selectedInputDoc.name])
      }

      setActiveDocument({
        id: inputId,
        type: "input",
        name: selectedInputDoc.name,
        content: selectedInputDoc.content,
        lastUpdated: selectedInputDoc.lastUpdated,
        updatedBy: selectedInputDoc.updatedBy,
      })

      // If in edit mode, switch to input or split view
      if (viewMode === "edit") {
        setViewMode(selectedOutput ? "split" : "input")
      }
    }
  }

  const handleOutputSelect = (outputId: string) => {
    const selectedOutputDoc = outputs.find((output) => output.id === outputId)
    if (selectedOutputDoc) {
      setSelectedOutput(outputId)

      // Make sure the parent group is expanded
      if (!expandedOutputs.includes(selectedOutputDoc.name)) {
        setExpandedOutputs([...expandedOutputs, selectedOutputDoc.name])
      }

      setActiveDocument({
        id: outputId,
        type: "output",
        name: selectedOutputDoc.name,
        content: selectedOutputDoc.content,
        status: selectedOutputDoc.status,
        dueDate: selectedOutputDoc.dueDate,
        assignedTo: selectedOutputDoc.assignedTo,
      })

      // If not in edit mode, keep current view or switch to output
      if (viewMode !== "edit") {
        setViewMode(selectedInput ? "split" : "output")
      }
    }
  }

  const toggleViewMode = (mode: "input" | "split" | "output" | "edit") => {
    setViewMode(mode)
  }

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen)
    // Reset any active document when exiting fullscreen
    if (isFullScreen) {
      document.body.style.overflow = "auto"
    } else {
      document.body.style.overflow = "hidden"
    }
  }

  const toggleActivityFeed = () => {
    setShowActivityFeed(!showActivityFeed)
  }

  const saveDocument = () => {
    if (selectedOutput && activeDocument) {
      // In a real app, this would save to the backend using the API
      // For example:
      // outputApi.updateOutput(Number(selectedOutput), {
      //   description: activeDocument.content,
      // })

      setNotificationType("success")
      setNotificationMessage("Document saved successfully")
      setShowNotification(true)

      // Hide notification after 3 seconds
      setTimeout(() => {
        setShowNotification(false)
      }, 3000)
    }
  }

  const markAsComplete = () => {
    if (selectedOutput && activeDocument) {
      // In a real app, this would update the document status using the API
      // For example:
      // changeStatus("output", Number(selectedOutput), "completed")

      setNotificationType("success")
      setNotificationMessage("Document marked as complete")
      setShowNotification(true)

      // Hide notification after 3 seconds
      setTimeout(() => {
        setShowNotification(false)
      }, 3000)
    }
  }

  const requestReview = () => {
    if (selectedOutput && activeDocument) {
      // In a real app, this would trigger a review workflow
      setNotificationType("info")
      setNotificationMessage("Review requested from team")
      setShowNotification(true)

      // Hide notification after 3 seconds
      setTimeout(() => {
        setShowNotification(false)
      }, 3000)
    }
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-green-500 text-white"
      case "in-progress":
      case "in progress":
        return "bg-yellow-500 text-white"
      case "not-started":
      case "not started":
        return "bg-gray-300 text-gray-700"
      default:
        return "bg-gray-300 text-gray-700"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case "in-progress":
      case "in progress":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "not-started":
      case "not started":
        return <AlertCircle className="h-4 w-4 text-gray-500" />
      default:
        return null
    }
  }

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return <FileText className="h-4 w-4 text-red-500" />
      case "excel":
        return <FileText className="h-4 w-4 text-green-500" />
      case "word":
        return <FileText className="h-4 w-4 text-blue-500" />
      case "powerpoint":
        return <FileText className="h-4 w-4 text-orange-500" />
      case "visio":
        return <GitBranch className="h-4 w-4 text-purple-500" />
      default:
        return <FileText className="h-4 w-4 text-gray-500" />
    }
  }

  const documentComments = selectedOutput ? comments.filter((comment) => comment.documentId === selectedOutput) : []

  const addComment = () => {
    if (newComment.trim() && selectedOutput) {
      // In a real app, this would save to the backend
      const newCommentObj = {
        id: `comment-${Date.now()}`,
        documentId: selectedOutput,
        user: "Current User",
        avatar: "CU",
        date: new Date().toISOString(),
        text: newComment.trim(),
      }

      setComments([...comments, newCommentObj])
      setNewComment("")
      setNotificationType("success")
      setNotificationMessage("Comment added")
      setShowNotification(true)

      // Hide notification after 3 seconds
      setTimeout(() => {
        setShowNotification(false)
      }, 3000)
    }
  }

  const copyToClipboard = () => {
    if (activeDocument) {
      navigator.clipboard.writeText(activeDocument.content)
      setNotificationType("success")
      setNotificationMessage("Content copied to clipboard")
      setShowNotification(true)

      // Hide notification after 3 seconds
      setTimeout(() => {
        setShowNotification(false)
      }, 3000)
    }
  }

  // Group inputs by name
  const groupedInputs = inputs.reduce(
    (acc, input) => {
      const key = input.name
      if (!acc[key]) {
        acc[key] = []
      }
      acc[key].push(input)
      return acc
    },
    {} as Record<string, typeof inputs>,
  )

  // Group outputs by name
  const groupedOutputs = outputs.reduce(
    (acc, output) => {
      const key = output.name
      if (!acc[key]) {
        acc[key] = []
      }
      acc[key].push(output)
      return acc
    },
    {} as Record<string, typeof outputs>,
  )

  // Filter outputs based on search and filters
  const filteredOutputs = outputs.filter((output) => {
    // Apply status filter
    if (filterStatus !== "all" && output.status?.toLowerCase() !== filterStatus) return false
    // Apply owner filter
    if (filterOwner !== "all" && output.assignedTo !== filterOwner) return false
    // Apply completed filter
    if (!showCompleted && output.status?.toLowerCase() === "completed") return false
    // Apply search query
    if (searchOutputQuery && !output.name.toLowerCase().includes(searchOutputQuery.toLowerCase())) return false
    return true
  })

  // Filter inputs based on search
  const filteredInputs = inputs.filter((input) =>
    searchInputQuery ? input.name.toLowerCase().includes(searchInputQuery.toLowerCase()) : true,
  )

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Project Workspace</h2>
            <p className="text-muted-foreground">
              {project ? project.name : `Project ${projectId}`} - Manage project deliverables
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={toggleActivityFeed}>
                    <History className="h-4 w-4 mr-2" />
                    Activity
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>View recent activity</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={toggleFullScreen}>
                    <Maximize2 className="h-4 w-4 mr-2" />
                    Full Screen
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Toggle full screen mode</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Export all project deliverables</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Phase Progress Indicator */}
        <div className="flex items-center justify-between w-full px-4 py-2 mb-6 bg-white rounded-lg shadow-sm overflow-x-auto">
          {phases.map((phase, index) => (
            <div key={phase.id} className="flex flex-col items-center relative min-w-[100px]">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center z-10 cursor-pointer
                  ${
                    selectedPhase?.id === phase.id
                      ? "bg-primary text-primary-foreground ring-2 ring-offset-2 ring-primary"
                      : phase.status?.toLowerCase() === "completed"
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                  }
                `}
                onClick={() => handlePhaseChange(phase.id)}
              >
                {phase.id}
              </div>
              <span
                className={`text-xs mt-2 font-medium whitespace-nowrap
                  ${selectedPhase?.id === phase.id ? "text-primary" : "text-muted-foreground"}
                `}
              >
                {phase.name?.split(":")[0] || `Phase ${phase.id}`}
              </span>
              {index < phases.length - 1 && (
                <div
                  className={`absolute top-5 left-[calc(100%_-_10px)] h-0.5 w-[calc(100%_+_20px)] -z-10 
                    ${phase.status?.toLowerCase() === "completed" ? "bg-green-500" : "bg-gray-200 dark:bg-gray-700"}
                  `}
                ></div>
              )}
            </div>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
          </div>
        ) : error ? (
          <div className="p-4 text-red-600 bg-red-100 rounded-md">{error}</div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold">{selectedPhase?.name || "Select a phase"}</h3>
                <p className="text-muted-foreground">{selectedPhase?.description}</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium">Progress</p>
                  <div className="flex items-center mt-1">
                    <Progress value={selectedPhase?.progress || 0} className="h-2 w-40 mr-2" />
                    <span>{selectedPhase?.progress || 0}%</span>
                  </div>
                </div>
                <Badge variant="outline" className={`${getStatusBadgeClass(selectedPhase?.status || "")}`}>
                  {selectedPhase?.status || "Not Started"}
                </Badge>
              </div>
            </div>

            <div>
              {/* Top Section - Input/Output Selection */}
              <div className="border rounded-lg bg-card shadow-sm mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                  {/* Inputs Panel */}
                  <div className="border-b md:border-b-0 md:border-r">
                    <div className="flex items-center justify-between p-4 border-b">
                      <h3 className="font-semibold flex items-center">
                        <ArrowRight className="h-4 w-4 mr-2" />
                        Inputs (Previous Phase)
                      </h3>
                      <Button variant="outline" size="sm">
                        <Copy className="h-4 w-4 mr-2" />
                        Copy All
                      </Button>
                    </div>
                    <div className="p-4">
                      {inputs.length > 0 ? (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <div className="relative">
                              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="Search inputs..."
                                className="pl-10 h-9"
                                value={searchInputQuery}
                                onChange={(e) => setSearchInputQuery(e.target.value)}
                              />
                            </div>

                            <ScrollArea className="h-[250px]">
                              <div className="space-y-2 pr-4">
                                {Object.keys(groupedInputs).length > 0 ? (
                                  Object.entries(groupedInputs).map(([name, documents]) => (
                                    <div key={name} className="border rounded-md overflow-hidden">
                                      <div
                                        className="p-3 bg-card hover:bg-muted/50 cursor-pointer flex items-center justify-between"
                                        onClick={() => toggleInputExpansion(name)}
                                      >
                                        <div className="flex items-center">
                                          <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                                          <div>
                                            <div className="font-medium">{name}</div>
                                            <div className="text-xs text-muted-foreground">
                                              {documents[0].description}
                                            </div>
                                          </div>
                                        </div>
                                        <div className="flex items-center">
                                          <div className="text-xs text-muted-foreground text-right mr-2">
                                            <div>
                                              Updated:{" "}
                                              {documents[0].lastUpdated
                                                ? new Date(documents[0].lastUpdated).toLocaleDateString()
                                                : "N/A"}
                                            </div>
                                            <div>By: {documents[0].updatedBy || "Unknown"}</div>
                                          </div>
                                          <ChevronDown
                                            className={`h-4 w-4 transition-transform ${expandedInputs.includes(name) ? "rotate-180" : ""}`}
                                          />
                                        </div>
                                      </div>

                                      {expandedInputs.includes(name) && (
                                        <div className="border-t bg-muted/20 divide-y">
                                          {documents.map((doc) => (
                                            <div
                                              key={doc.id}
                                              className={`p-2 pl-8 hover:bg-muted cursor-pointer flex items-center
                                                ${selectedInput === doc.id ? "bg-muted/50 font-medium" : ""}
                                              `}
                                              onClick={() => handleInputSelect(doc.id)}
                                            >
                                              <FileText className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                                              <span className="text-sm">
                                                {doc.type === "document" ? `${name}.doc` : `${name}.${doc.type}`}
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  ))
                                ) : (
                                  <div className="text-center py-8 text-muted-foreground">
                                    <p>No inputs available for this phase</p>
                                  </div>
                                )}
                              </div>
                            </ScrollArea>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                          <Info className="h-12 w-12 mb-4 opacity-20" />
                          <p>No inputs available for this phase</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Outputs Panel */}
                  <div>
                    <div className="flex items-center justify-between p-4 border-b">
                      <h3 className="font-semibold flex items-center">
                        <ArrowRight className="h-4 w-4 mr-2" />
                        Outputs (Current Phase)
                      </h3>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        New
                      </Button>
                    </div>
                    <div className="p-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="relative flex-1">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Search outputs..."
                              className="pl-10 h-9"
                              value={searchOutputQuery}
                              onChange={(e) => setSearchOutputQuery(e.target.value)}
                            />
                          </div>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" size="sm" className="ml-2">
                                <Filter className="mr-2 h-4 w-4" />
                                Filters
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-72">
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label>Status</Label>
                                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="All statuses" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="all">All statuses</SelectItem>
                                      <SelectItem value="completed">Completed</SelectItem>
                                      <SelectItem value="in-progress">In Progress</SelectItem>
                                      <SelectItem value="not-started">Not Started</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <Label>Assigned To</Label>
                                  <Select value={filterOwner} onValueChange={setFilterOwner}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="All assignees" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="all">All assignees</SelectItem>
                                      <SelectItem value="Engineering Team">Engineering Team</SelectItem>
                                      <SelectItem value="Quality Team">Quality Team</SelectItem>
                                      <SelectItem value="Production Team">Production Team</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id="show-completed"
                                    checked={showCompleted}
                                    onCheckedChange={(checked) => setShowCompleted(checked as boolean)}
                                  />
                                  <Label htmlFor="show-completed">Show completed outputs</Label>
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>

                        <ScrollArea className="h-[250px]">
                          <div className="space-y-2 pr-4">
                            {Object.keys(groupedOutputs).length > 0 ? (
                              Object.entries(groupedOutputs).map(([name, documents]) => {
                                const mainDoc = documents[0] // Use the first document for main display
                                return (
                                  <div
                                    key={name}
                                    className={`border rounded-md overflow-hidden ${
                                      mainDoc.status?.toLowerCase() === "completed"
                                        ? "border-green-200"
                                        : mainDoc.status?.toLowerCase() === "in-progress"
                                          ? "border-blue-200"
                                          : "border-gray-200"
                                    }`}
                                  >
                                    <div
                                      className={`p-3 cursor-pointer flex items-center justify-between
                                        ${
                                          mainDoc.status?.toLowerCase() === "completed"
                                            ? "bg-green-50/50"
                                            : mainDoc.status?.toLowerCase() === "in-progress"
                                              ? "bg-blue-50/50"
                                              : "bg-muted/50"
                                        }
                                        hover:bg-muted/70
                                      `}
                                      onClick={() => toggleOutputExpansion(name)}
                                    >
                                      <div className="flex items-center">
                                        {getStatusIcon(mainDoc.status || "")}
                                        <div className="ml-2">
                                          <div className="font-medium">{name}</div>
                                          <div className="text-xs text-muted-foreground">{mainDoc.description}</div>
                                        </div>
                                      </div>
                                      <div className="flex items-center">
                                        <div className="flex flex-col items-end mr-2">
                                          <Badge
                                            variant="outline"
                                            className={`${getStatusBadgeClass(mainDoc.status || "")}`}
                                          >
                                            <div className="flex items-center">
                                              <span>{mainDoc.status?.replace("-", " ") || "Not Started"}</span>
                                            </div>
                                          </Badge>
                                          <div className="text-xs text-muted-foreground mt-1">
                                            Due:{" "}
                                            {mainDoc.dueDate ? new Date(mainDoc.dueDate).toLocaleDateString() : "N/A"}
                                          </div>
                                        </div>
                                        <ChevronDown
                                          className={`h-4 w-4 transition-transform ${expandedOutputs.includes(name) ? "rotate-180" : ""}`}
                                        />
                                      </div>
                                    </div>

                                    <div className="px-3 py-1.5 border-t border-gray-100 bg-white/50 flex items-center text-xs text-muted-foreground">
                                      <Users className="h-3 w-3 mr-1" />
                                      <span>{mainDoc.assignedTo || "Unassigned"}</span>
                                      {comments.filter((c) => documents.some((doc) => doc.id === c.documentId)).length >
                                        0 && (
                                        <div className="ml-4 flex items-center">
                                          <MessageSquare className="h-3 w-3 mr-1" />
                                          <span>
                                            {
                                              comments.filter((c) => documents.some((doc) => doc.id === c.documentId))
                                                .length
                                            }{" "}
                                            comments
                                          </span>
                                        </div>
                                      )}
                                    </div>

                                    {expandedOutputs.includes(name) && (
                                      <div className="border-t bg-muted/20 divide-y">
                                        {documents.map((doc) => (
                                          <div
                                            key={doc.id}
                                            className={`p-2 pl-8 hover:bg-muted cursor-pointer flex items-center justify-between
                                              ${selectedOutput === doc.id ? "bg-muted/50 font-medium" : ""}
                                            `}
                                            onClick={() => handleOutputSelect(doc.id)}
                                          >
                                            <div className="flex items-center">
                                              <FileText className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                                              <span className="text-sm">
                                                {doc.type === "document" ? `${name}.doc` : `${name}.${doc.type}`}
                                              </span>
                                            </div>
                                            <Badge
                                              variant="outline"
                                              size="sm"
                                              className={`${getStatusBadgeClass(doc.status || "")} text-xs`}
                                            >
                                              {doc.status?.replace("-", " ") || "Not Started"}
                                            </Badge>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )
                              })
                            ) : (
                              <div className="text-center py-8 text-muted-foreground">
                                <p>No outputs found matching your criteria</p>
                              </div>
                            )}
                          </div>
                        </ScrollArea>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Section - Document Viewer */}
              <div
                className={`border rounded-lg bg-card shadow-sm ${isFullScreen ? "fixed inset-0 z-50 m-0 rounded-none border-0" : ""}`}
              >
                <div className="flex items-center justify-between p-4 border-b">
                  <h3 className="font-semibold">{activeDocument ? activeDocument.name : "Document Workspace"}</h3>
                  <div className="flex items-center space-x-2">
                    {/* View Mode Controls */}
                    <div className="flex items-center border rounded-md overflow-hidden">
                      <Button
                        variant={viewMode === "input" ? "default" : "ghost"}
                        size="sm"
                        className="rounded-none h-8"
                        onClick={() => toggleViewMode("input")}
                        disabled={!selectedInput}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Input
                      </Button>
                      <Button
                        variant={viewMode === "split" ? "default" : "ghost"}
                        size="sm"
                        className="rounded-none h-8"
                        onClick={() => toggleViewMode("split")}
                        disabled={!selectedInput || !selectedOutput}
                      >
                        Split
                      </Button>
                      <Button
                        variant={viewMode === "output" ? "default" : "ghost"}
                        size="sm"
                        className="rounded-none h-8"
                        onClick={() => toggleViewMode("output")}
                        disabled={!selectedOutput}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Output
                      </Button>
                      <Button
                        variant={viewMode === "edit" ? "default" : "ghost"}
                        size="sm"
                        className="rounded-none h-8"
                        onClick={() => toggleViewMode("edit")}
                        disabled={!selectedOutput}
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </div>

                    {selectedOutput && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowComments(!showComments)}
                        className="relative"
                      >
                        <MessageSquare className="h-4 w-4" />
                        {documentComments.length > 0 && (
                          <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-4 h-4 flex items-center justify-center">
                            {documentComments.length}
                          </span>
                        )}
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={toggleFullScreen}>
                      {isFullScreen ? <X className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div
                  className={`${isFullScreen ? "h-[calc(100vh-64px)]" : "min-h-[400px] max-h-[calc(100vh-500px)]"} flex flex-col`}
                >
                  {activeDocument ? (
                    <div className="h-full flex flex-col">
                      {/* Document View based on viewMode */}
                      <div className="h-full flex flex-col md:flex-row">
                        {/* Input Preview Panel */}
                        {(viewMode === "input" || viewMode === "split") && selectedInput && (
                          <div
                            className={`h-full overflow-auto ${viewMode === "split" ? "w-full md:w-1/2 border-b md:border-b-0 md:border-r" : "w-full"}`}
                          >
                            <div className="p-4">
                              <div className="prose max-w-none">
                                <div className="flex items-center justify-between mb-4">
                                  <div className="flex items-center">
                                    <Badge variant="outline" className="mr-2">
                                      Input Document
                                    </Badge>
                                    <span className="text-sm text-muted-foreground">
                                      Last updated:{" "}
                                      {activeDocument.type === "input" && activeDocument.lastUpdated
                                        ? new Date(activeDocument.lastUpdated).toLocaleDateString()
                                        : "N/A"}
                                    </span>
                                  </div>
                                  <div className="flex space-x-2">
                                    <Button variant="outline" size="sm" onClick={copyToClipboard}>
                                      <Copy className="h-4 w-4 mr-2" />
                                      Copy
                                    </Button>
                                    <Button variant="outline" size="sm">
                                      <Download className="h-4 w-4 mr-2" />
                                      Download
                                    </Button>
                                  </div>
                                </div>
                                <div className="bg-yellow-50 p-2 border-l-4 border-yellow-500 my-4">
                                  <h4 className="text-yellow-800 font-medium">Key Requirements</h4>
                                  <ul className="text-yellow-700">
                                    <li>Requirement 1: This is a highlighted key requirement</li>
                                    <li>Requirement 2: Another important requirement</li>
                                    <li>Risk 1: Potential risk identified in this document</li>
                                  </ul>
                                </div>
                                <div className="whitespace-pre-wrap">
                                  {activeDocument.type === "input" && activeDocument.content}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Output Viewing/Editing Panel */}
                        {(viewMode === "output" || viewMode === "split" || viewMode === "edit") && selectedOutput && (
                          <div
                            className={`h-full overflow-auto ${viewMode === "split" ? "w-full md:w-1/2" : "w-full"}`}
                          >
                            {viewMode !== "edit" ? (
                              <div className="p-4">
                                <div className="prose max-w-none">
                                  <div className="flex items-center justify-between mb-4">
                                    <Badge
                                      variant="outline"
                                      className={`${getStatusBadgeClass(activeDocument.type === "output" ? activeDocument.status || "" : "")}`}
                                    >
                                      {activeDocument.type === "output" && activeDocument.status?.replace("-", " ")}
                                    </Badge>
                                    <div className="text-sm text-muted-foreground">
                                      Due:{" "}
                                      {activeDocument.type === "output" && activeDocument.dueDate
                                        ? new Date(activeDocument.dueDate).toLocaleDateString()
                                        : "N/A"}
                                    </div>
                                  </div>
                                  <div className="whitespace-pre-wrap">
                                    {activeDocument.type === "output" && activeDocument.content}
                                  </div>
                                  <div className="bg-muted p-4 rounded-md mt-4">
                                    <h4>Document Metadata</h4>
                                    <ul className="list-none p-0">
                                      <li>
                                        <strong>Type:</strong> document
                                      </li>
                                      <li>
                                        <strong>Phase:</strong>{" "}
                                        {activeDocument.type === "output" && selectedPhase
                                          ? `Phase ${selectedPhase.id}: ${selectedPhase.name}`
                                          : "N/A"}
                                      </li>
                                      <li>
                                        <strong>Assigned To:</strong>{" "}
                                        {activeDocument.type === "output" && activeDocument.assignedTo
                                          ? activeDocument.assignedTo
                                          : "Unassigned"}
                                      </li>
                                    </ul>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="p-4 space-y-4 overflow-auto">
                                <div className="bg-white border rounded-md p-4">
                                  <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-medium">{activeDocument.name}</h3>
                                    <Badge
                                      variant="outline"
                                      className={`${getStatusBadgeClass(activeDocument.type === "output" ? activeDocument.status || "" : "")}`}
                                    >
                                      {activeDocument.type === "output" && activeDocument.status?.replace("-", " ")}
                                    </Badge>
                                  </div>

                                  {/* Rich Text Editor Placeholder */}
                                  <div className="min-h-[300px] border rounded-md p-4 mb-4">
                                    <Textarea
                                      className="w-full h-full min-h-[300px] p-2 focus:outline-none resize-none"
                                      defaultValue={activeDocument.content}
                                    />
                                  </div>

                                  {/* Reference Panel */}
                                  {selectedInput && (
                                    <div className="bg-muted/20 p-3 rounded-md mb-4">
                                      <h4 className="text-sm font-medium mb-2">Reference from Input</h4>
                                      <div className="text-sm text-muted-foreground">
                                        <p>
                                          <strong>Source:</strong>{" "}
                                          {inputs.find((input) => input.id === selectedInput)?.name}
                                        </p>
                                        <p className="mt-1">
                                          Key requirements and information from the input document would be displayed
                                          here for easy reference while editing.
                                        </p>
                                      </div>
                                    </div>
                                  )}

                                  {/* Attachments */}
                                  <div className="mb-4">
                                    <h4 className="text-sm font-medium mb-2">Attachments</h4>
                                    <div className="flex items-center space-x-2">
                                      <Button variant="outline" size="sm">
                                        <FileUp className="h-4 w-4 mr-2" />
                                        Attach File
                                      </Button>
                                      <Button variant="outline" size="sm">
                                        <GitBranch className="h-4 w-4 mr-2" />
                                        Add Diagram
                                      </Button>
                                    </div>
                                  </div>

                                  {/* Action Buttons */}
                                  <div className="flex flex-wrap justify-end gap-2 mt-6">
                                    <Button variant="outline" onClick={() => toggleViewMode("output")}>
                                      Cancel
                                    </Button>
                                    <Button variant="outline" onClick={requestReview}>
                                      Request Review
                                    </Button>
                                    <Button variant="outline" onClick={markAsComplete}>
                                      Mark as Done
                                    </Button>
                                    <Button onClick={saveDocument}>
                                      <Save className="h-4 w-4 mr-2" />
                                      Save Changes
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Comments Section */}
                            {showComments && (
                              <div className="border-t p-4">
                                <h3 className="text-lg font-medium mb-4">Comments</h3>
                                <div className="space-y-4 w-full">
                                  {documentComments.length > 0 ? (
                                    documentComments.map((comment) => (
                                      <div key={comment.id} className="flex space-x-3">
                                        <Avatar className="h-8 w-8">
                                          <AvatarFallback>{comment.avatar}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                          <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium">{comment.user}</p>
                                            <span className="text-xs text-muted-foreground">
                                              {new Date(comment.date).toLocaleString()}
                                            </span>
                                          </div>
                                          <p className="text-sm mt-1">{comment.text}</p>
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-center text-muted-foreground">No comments yet</p>
                                  )}
                                  <div className="mt-4">
                                    <textarea
                                      className="w-full min-h-[80px] p-2 border rounded-md"
                                      placeholder="Add a comment..."
                                      value={newComment}
                                      onChange={(e) => setNewComment(e.target.value)}
                                    ></textarea>
                                    <div className="flex justify-end mt-2">
                                      <Button size="sm" onClick={addComment}>
                                        Add Comment
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4">
                      <FileText className="h-12 w-12 mb-4 opacity-20" />
                      <p>Select an input and output to start working</p>
                      <p className="text-sm mt-2">
                        You can view inputs from previous phases and edit outputs for the current phase
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Activity Feed Panel */}
        {showActivityFeed && (
          <div className="fixed right-0 top-0 h-full w-80 bg-background border-l shadow-lg z-50 overflow-auto">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold">Recent Activity</h3>
              <Button variant="ghost" size="icon" onClick={toggleActivityFeed}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>JD</AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <p className="text-sm">
                      <span className="font-medium">John Doe</span> modified{" "}
                      <span className="text-primary">Design Verification Plan</span>
                    </p>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <span>2 hours ago</span>
                      <span className="mx-1">•</span>
                      <span>Phase 2</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>JS</AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <p className="text-sm">
                      <span className="font-medium">Jane Smith</span> added a document to{" "}
                      <span className="text-primary">Voice of the Customer</span>
                    </p>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <span>5 hours ago</span>
                      <span className="mx-1">•</span>
                      <span>Phase 1</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notification */}
        {showNotification && (
          <div
            className={`fixed bottom-4 right-4 p-4 rounded-md shadow-md z-50 flex items-center space-x-2
              ${
                notificationType === "success"
                  ? "bg-green-100 text-green-800 border border-green-200"
                  : notificationType === "error"
                    ? "bg-red-100 text-red-800 border border-red-200"
                    : "bg-blue-100 text-blue-800 border border-blue-200"
              }`}
          >
            {notificationType === "success" ? (
              <CheckCircle className="h-5 w-5" />
            ) : notificationType === "error" ? (
              <AlertCircle className="h-5 w-5" />
            ) : (
              <Info className="h-5 w-5" />
            )}
            <span>{notificationMessage}</span>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
