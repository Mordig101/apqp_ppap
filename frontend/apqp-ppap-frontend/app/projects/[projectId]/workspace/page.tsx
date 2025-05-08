"use client"

import type React from "react"

import { useState, useEffect, useCallback, useRef } from "react"
import { useParams, useSearchParams , useRouter} from "next/navigation"
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
  AlertTriangle,
  Upload,
  Trash2,
  MoreVertical,
  Trash,
  CheckSquare, 
  UploadCloud,
} from "lucide-react"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { API_ENDPOINTS } from "@/config/api";
import { projectApi, outputApi, documentApi , phaseApi , uploadDocument } from "@/config/api-utils"
import type { Project, Phase, Output , Document as DocumentType } from "@/config/api-types"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
interface Comment {
  id: string
  documentId: string
  user: string
  avatar: string
  date: string
  text: string
}

interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  outputId: string
  uploadDate: string
  data: string | ArrayBuffer | null
  status: "pending" | "uploading" | "success" | "error"
  progress: number
  error?: string
}

interface DocumentAssociationResponse {
  success: boolean
  message: string
  documentId?: number
}

interface DocumentData {
  id: number
  name: string
  description: string
  file_path: string
  file_type: string
  file_size: number
  uploader: number
  output: number
  version: string
  status: string
  history_id: string
  uploader_details?: {
    id: number
    username: string
  }
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
  const [comments, setComments] = useState<Comment[]>([])

  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [currentFile, setCurrentFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [documents, setDocuments] = useState<DocumentData[]>([])
  const [loadingDocuments, setLoadingDocuments] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [previousPhaseOutputs, setPreviousPhaseOutputs] = useState<Output[]>([])

 
  
  // Update your fetchProjectData function
  const fetchProjectData = useCallback(async () => {
    try {
      setLoading(true);
      const projectData = await projectApi.getProject(projectId) as Project;
      setProject(projectData);
  
      if (projectData?.ppap_details?.phases && Array.isArray(projectData.ppap_details.phases)) {
        const phasesData = projectData.ppap_details.phases;
        setPhases(phasesData);
  
        if (phasesData.length > 0) {
          // Find the first non-completed phase or default to first phase
          const activePhase = phasesData.find((p: Phase) => 
            p.status?.toLowerCase() !== 'completed') || phasesData[0];
          
          setSelectedPhase(activePhase);
          
          // Make sure outputs are properly set
          if (activePhase.outputs && Array.isArray(activePhase.outputs)) {
            console.log("Setting outputs:", activePhase.outputs);
            setOutputs(activePhase.outputs);
          } else {
            console.warn("No outputs found in phase:", activePhase);
            setOutputs([]);
          }
          
          // Get the previous phase outputs for inputs
          const phaseIndex = phasesData.findIndex((p: Phase) => p.id === activePhase.id);
          if (phaseIndex > 0) {
            const prevPhase = phasesData[phaseIndex - 1];
            if (prevPhase.outputs && Array.isArray(prevPhase.outputs)) {
              setPreviousPhaseOutputs(prevPhase.outputs);
            } else {
              console.warn("No outputs found in previous phase:", prevPhase);
              setPreviousPhaseOutputs([]);
            }
          } else {
            // First phase has no inputs
            setPreviousPhaseOutputs([]);
          }
        }
      }
    } catch (err: any) {
      console.error("Error fetching project data:", err);
      setError(err.message || "Failed to load project data");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId) {
      fetchProjectData().then(() => {
        // Initial phase selection will be handled by the fetchProjectData function
      });
    }
  }, [projectId, fetchProjectData]);
  
  /*useEffect(() => {
    if (projectId) {
      fetchProjectData()
    }
  }, [projectId, fetchProjectData])*/

  const fetchPreviousPhaseOutputs = useCallback(
    async (phaseId: number) => {
      try {
        if (!phases || phases.length === 0) return;
  
        // Find the current phase index
        const currentPhaseIndex = phases.findIndex((p) => p.id === phaseId);
        if (currentPhaseIndex <= 0) {
          // If this is the first phase or phase not found, there are no previous outputs
          setPreviousPhaseOutputs([]);
          return;
        }
  
        // Get the previous phase
        const previousPhase = phases[currentPhaseIndex - 1];
        
        // Check if the previous phase has outputs
        if (previousPhase && previousPhase.outputs && previousPhase.outputs.length > 0) {
          setPreviousPhaseOutputs(previousPhase.outputs);
          
          // For debugging - log the outputs
          console.log("Previous phase outputs:", previousPhase.outputs);
        } else {
          // If the previous phase doesn't have outputs directly accessible,
          // we might need to fetch them
          try {
            const previousPhaseData = await phaseApi.getPhase(previousPhase.id) as Phase;
            if (previousPhaseData && previousPhaseData.outputs) {
              setPreviousPhaseOutputs(previousPhaseData.outputs);
            }
            if (previousPhaseData && previousPhaseData.outputs) {
              setPreviousPhaseOutputs(previousPhaseData.outputs);
            } else {
              setPreviousPhaseOutputs([]);
            }
          } catch (error) {
            console.error("Error fetching previous phase details:", error);
            setPreviousPhaseOutputs([]);
          }
        }
      } catch (err: any) {
        console.error("Error fetching previous phase outputs:", err);
        setPreviousPhaseOutputs([]);
      }
    },
    [phases],
  );

  const handlePhaseChange = async (phaseId: number) => {
    const phase = phases.find((p) => p.id === phaseId);
    if (phase) {
      setSelectedPhase(phase);
      
      // Ensure we're setting outputs correctly from the phase
      if (phase.outputs && Array.isArray(phase.outputs)) {
        console.log("Setting outputs from phase:", phase.outputs);
        setOutputs(phase.outputs);
      } else {
        console.warn("No outputs found in the phase or invalid format:", phase);
        setOutputs([]);
      }
      
      setSelectedInput(null);
      setSelectedOutput(null);
      setActiveDocument(null);
      setDocuments([]);
  
      // Fetch outputs from the previous phase to use as inputs
      await fetchPreviousPhaseOutputs(phaseId);
    }
  };

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

  // Update the input select handler
const handleInputSelect = (inputId: string) => {
  // Convert to number for comparison
  const inputIdNum = Number(inputId);
  const selectedInputData = previousPhaseOutputs.find((input) => input.id === inputIdNum);
  
  if (selectedInputData) {
    setSelectedInput(inputId);

    // Make sure expanded inputs is tracked properly
    if (!expandedInputs.includes(inputId)) {
      setExpandedInputs([...expandedInputs, inputId]);
    }

    setActiveDocument({
      id: inputId,
      type: "input",
      name: selectedInputData.template_details?.name || "Unnamed Input",
      content: selectedInputData.description || "",
      status: selectedInputData.status,
      assignedTo: selectedInputData.user_details?.username || "",
    });

    if (viewMode !== "edit") {
      setViewMode(selectedOutput ? "split" : "input");
    }
  }
};

  const toggleViewMode = (mode: "input" | "split" | "output" | "edit") => {
    setViewMode(mode)
  }

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen)
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
      setNotificationType("success")
      setNotificationMessage("Document saved successfully")
      setShowNotification(true)

      setTimeout(() => {
        setShowNotification(false)
      }, 3000)
    }
  }

  const markAsComplete = async () => {
    if (selectedOutput && activeDocument) {
      try {
        await outputApi.updateOutput(Number(selectedOutput), { status: "Completed" })
        setNotificationType("success")
        setNotificationMessage("Document marked as complete")
        setShowNotification(true)

        setTimeout(() => {
          setShowNotification(false)
        }, 3000)

        fetchProjectData() // Refresh data after status change
      } catch (error: any) {
        console.error("Error marking output as complete:", error)
        setNotificationType("error")
        setNotificationMessage(error.message || "Failed to mark document as complete")
        setShowNotification(true)
      }
    }
  }

  const requestReview = () => {
    if (selectedOutput && activeDocument) {
      setNotificationType("info")
      setNotificationMessage("Review requested from team")
      setShowNotification(true)

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

      setTimeout(() => {
        setShowNotification(false)
      }, 3000)
    }
  }

  // Group inputs by name
  const groupedInputs = inputs.reduce(
    (acc, input) => {
      const key = input.template_details?.name || "Unnamed Output"
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
      const key = output.template_details?.name || "Unnamed Output"
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
    if (filterStatus !== "all" && output.status?.toLowerCase() !== filterStatus) return false
    if (filterOwner !== "all" && output.template_details?.name !== filterOwner) return false
    if (!showCompleted && output.status?.toLowerCase() === "completed") return false
    if (searchOutputQuery && !output.template_details?.name?.toLowerCase().includes(searchOutputQuery.toLowerCase()))
      return false
    return true
  })

  // Filter inputs based on search
  const filteredInputs = inputs.filter((input) =>
    searchInputQuery ? input.template_details?.name?.toLowerCase().includes(searchInputQuery.toLowerCase()) : true,
  )

  const copyToClipboard = () => {
    if (activeDocument) {
      navigator.clipboard.writeText(activeDocument.content)
      setNotificationType("success")
      setNotificationMessage("Content copied to clipboard!")
      setShowNotification(true)
      setTimeout(() => setShowNotification(false), 3000)
    }
  }

  // Add this function to your component
const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
  if (event.target.files && event.target.files.length > 0) {
    const file = event.target.files[0];
    setCurrentFile(file);
    
    // Reset error and progress if previously set
    setUploadError("");
    setUploadProgress(0);
  }
};
  const fetchDocumentsForOutput = async (outputId: number) => {
    try {
      setLoadingDocuments(true)
      
      // Make a real API call to get documents for this output
      const response = await fetch(`${API_ENDPOINTS.documents}?output=${outputId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch documents: ${response.statusText}`);
      }
      
      const data = await response.json();
      const documents = data.results || []; // Assuming paginated response
      
      // Update documents state
      setDocuments(documents);
      
    } catch (err: any) {
      console.error("Error fetching documents:", err)
      setNotificationType("error")
      setNotificationMessage("Failed to load documents")
      setShowNotification(true)
    } finally {
      setLoadingDocuments(false)
    }
  }

  // When selecting an output
// Update the handleOutputSelect function at line 534
const handleOutputSelect = (outputId: string) => {
  // Convert string ID to number for proper comparison
  const outputIdNum = Number(outputId);
  const selectedOutputDoc = outputs.find((output) => output.id === outputIdNum);
  
  if (selectedOutputDoc) {
    setSelectedOutput(outputId);

    // Fix: Track expanded outputs by ID, not by name
    if (!expandedOutputs.includes(outputId)) {
      setExpandedOutputs([...expandedOutputs, outputId]);
    }

    // Set active document with proper data
    setActiveDocument({
      id: outputId,
      type: "output",
      name: selectedOutputDoc.template_details?.name || "Unnamed Output",
      content: selectedOutputDoc.description || "", 
      status: selectedOutputDoc.status,
      dueDate: "",
      assignedTo: selectedOutputDoc.user_details?.username || "",
    });

    if (viewMode !== "edit") {
      setViewMode(selectedInput ? "split" : "output");
    }

    // Fetch documents for this output
    fetchDocumentsForOutput(outputIdNum);

    // Load files from local storage for this output
    loadFilesForOutput(outputId);
  }
};

  // Function to open file dialog
  const openFileDialog = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  // Function to handle file upload
  // Update this function for proper upload handling
  const handleFileUpload = async () => {
    if (!currentFile || !selectedOutput) {
      setUploadError("Please select a file and an output");
      return;
    }
  
    setIsUploading(true);
    setUploadProgress(0);
    setUploadError("");
  
    try {
      // Get uploader ID - could be from auth context or project members
      let uploaderId;
      if (project?.team_details?.members && project.team_details.members.length > 0) {
        const userMember = project.team_details.members.find(m => m.is_user);
        uploaderId = userMember?.id || project.team_details.members[0].id;
      } else {
        uploaderId = "1"; // Default fallback
      }
      
      // Use the dedicated upload service
      const responseData = await uploadDocument(
        currentFile,
        selectedOutput,
        uploaderId.toString(),
        (progress) => setUploadProgress(progress)
      );
      
      // Handle successful upload
      setNotificationType("success");
      setNotificationMessage("File uploaded successfully");
      setShowNotification(true);
      
      // Refresh documents
      fetchDocumentsForOutput(Number(selectedOutput));
      
      // Clear form
      setCurrentFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setShowUploadDialog(false);
      
    } catch (error: any) {
      console.error("Error uploading file:", error);
      setUploadError(error.message || "Failed to upload file");
      setNotificationType("error");
      setNotificationMessage(error.message || "Failed to upload file");
      setShowNotification(true);
    } finally {
      setIsUploading(false);
    }
  };

  // Function to remove a file
  const removeFile = (fileId: string) => {
    setUploadedFiles((prev) => prev.filter((file) => file.id !== fileId))

    // Remove from local storage
    try {
      const filesInStorage = JSON.parse(localStorage.getItem("uploadedFiles") || "{}")
      delete filesInStorage[fileId]
      localStorage.setItem("uploadedFiles", JSON.stringify(filesInStorage))

      // Refresh documents for this output if an output is selected
      if (selectedOutput) {
        fetchDocumentsForOutput(Number(selectedOutput))
      }
    } catch (error) {
      console.error("Error removing file from storage:", error)
    }
  }

  // Function to load files from local storage for the current output
  const loadFilesForOutput = (outputId: string) => {
    try {
      const filesInStorage = JSON.parse(localStorage.getItem("uploadedFiles") || "{}")
      const outputFiles: UploadedFile[] = []

      Object.values(filesInStorage).forEach((file: any) => {
        if (file.outputId === outputId) {
          outputFiles.push({
            ...file,
            status: "success",
            progress: 100,
          })
        }
      })

      setUploadedFiles(outputFiles)
    } catch (error) {
      console.error("Error loading files from storage:", error)
    }
  }

  // Add this function to get file type icon
  const getFileTypeIcon = (fileType: string) => {
    const type = fileType.toLowerCase()
    if (type.includes("pdf")) {
      return <FileText className="h-4 w-4 text-red-500" />
    } else if (type.includes("word") || type.includes("doc")) {
      return <FileText className="h-4 w-4 text-blue-500" />
    } else if (type.includes("excel") || type.includes("sheet") || type.includes("xls")) {
      return <FileText className="h-4 w-4 text-green-500" />
    } else if (type.includes("powerpoint") || type.includes("presentation") || type.includes("ppt")) {
      return <FileText className="h-4 w-4 text-orange-500" />
    } else if (type.includes("image") || type.includes("jpg") || type.includes("png") || type.includes("jpeg")) {
      return <FileText className="h-4 w-4 text-purple-500" />
    } else {
      return <FileText className="h-4 w-4 text-gray-500" />
    }
  }

  useEffect(() => {
    if (projectId) {
      fetchProjectData();
    }
  }, [projectId, fetchProjectData]);

  useEffect(() => {
    if (selectedPhase) {
      fetchPreviousPhaseOutputs(selectedPhase.id);
    }
  }, [selectedPhase, fetchPreviousPhaseOutputs]);

  useEffect(() => {
    // Debug logging to understand data structure
    if (phases.length > 0) {
      console.log("Phases loaded:", phases);
      if (selectedPhase) {
        console.log("Selected phase:", selectedPhase);
        console.log("Selected phase outputs:", outputs);
        console.log("Previous phase outputs (inputs):", previousPhaseOutputs);
      }
    }
  }, [phases, selectedPhase, outputs, previousPhaseOutputs]);

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
                {phase.template_details?.name?.split(":")[0] || `Phase ${phase.id}`}
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
                <h3 className="text-2xl font-bold">{selectedPhase?.template_details?.name || "Select a phase"}</h3>
                <p className="text-muted-foreground">{selectedPhase?.template_details?.description}</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium">Progress</p>
                  <div className="flex items-center mt-1">
                    <Progress value={50} className="h-2 w-40 mr-2" />
                    <span>50%</span>
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
                      {previousPhaseOutputs.length > 0 ? (
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
                              <div className="p-4">
                                {previousPhaseOutputs.length > 0 ? (
                                  <div className="space-y-2 pr-4">
                                    {previousPhaseOutputs
                                      .filter((output) => searchInputQuery
                                        ? (output.template_details?.name || "")
                                            .toLowerCase()
                                            .includes(searchInputQuery.toLowerCase())
                                        : true
                                      )
                                      .map((output) => (
                                        <div key={output.id} className="border rounded-md overflow-hidden">
                                          <div
                                            className="p-3 bg-card hover:bg-muted/50 cursor-pointer flex items-center justify-between"
                                            onClick={() => toggleInputExpansion(output.id.toString())}
                                          >
                                            <div className="flex items-center">
                                              <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                                              <div>
                                                <div className="font-medium">
                                                  {output.template_details?.name || "Unnamed Output"}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                  {output.description || "No description available"}
                                                </div>
                                              </div>
                                            </div>
                                            <div className="flex items-center">
                                              <div className="text-xs text-muted-foreground text-right mr-2">
                                                <div>Status: {output.status || "Not Started"}</div>
                                                <div>
                                                  By: {output.user_details?.username || "Unassigned"}
                                                </div>
                                              </div>
                                              <ChevronDown
                                                className={`h-4 w-4 transition-transform ${
                                                  expandedInputs.includes(output.id.toString()) ? "rotate-180" : ""
                                                }`}
                                              />
                                            </div>
                                          </div>

                                          {expandedInputs.includes(output.id.toString()) && (
                                            <div className="border-t bg-muted/20 divide-y">
                                              <div
                                                className={`p-2 pl-8 hover:bg-muted cursor-pointer flex items-center
                                                  ${selectedInput === output.id.toString() ? "bg-muted/50 font-medium" : ""}
                                                `}
                                                onClick={() => handleInputSelect(output.id.toString())}
                                              >
                                                <FileText className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                                                <span className="text-sm">
                                                  {output.template_details?.name || "Unnamed Output"}
                                                </span>
                                              </div>
                                              
                                              {/* Documents list */}
                                              {output.documents && output.documents.length > 0 && (
                                                <div className="pl-8 pr-2 py-2 border-t">
                                                  <p className="text-xs font-medium text-muted-foreground mb-2">
                                                    Associated Documents:
                                                  </p>
                                                  {output.documents.map((doc) => (
                                                    <div key={doc.id} className="flex items-center text-sm py-1">
                                                      {getFileTypeIcon(doc.file_type)}
                                                      <span className="ml-2">
                                                        {doc.name} (v{doc.version})
                                                      </span>
                                                    </div>
                                                  ))}
                                                </div>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                                    <Info className="h-12 w-12 mb-4 opacity-20" />
                                    <p>No inputs available from previous phase</p>
                                    {selectedPhase && phases.findIndex((p) => p.id === selectedPhase.id) === 0 && (
                                      <p className="text-sm mt-2">This is the first phase of the project</p>
                                    )}
                                  </div>
                                )}
                              </div>
                            </ScrollArea>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                          <Info className="h-12 w-12 mb-4 opacity-20" />
                          <p>No inputs available from previous phase</p>
                          {selectedPhase && phases.findIndex((p) => p.id === selectedPhase.id) === 0 && (
                            <p className="text-sm mt-2">This is the first phase of the project</p>
                          )}
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
                        <div className="p-4">
                          <div className="space-y-4">
                            {outputs.length > 0 ? (
                              outputs
                                .filter((output) => searchOutputQuery
                                  ? (output.template_details?.name || "").toLowerCase().includes(searchOutputQuery.toLowerCase())
                                  : true
                                )
                                .map((output) => (
                                  <div key={output.id} className={`border rounded-md overflow-hidden ${
                                    output.status?.toLowerCase() === "completed"
                                      ? "border-green-200"
                                      : output.status?.toLowerCase() === "in-progress"
                                        ? "border-blue-200"
                                        : "border-gray-200"
                                  }`}>
                                    <div className={`p-3 cursor-pointer flex items-center justify-between
                                      ${
                                        output.status?.toLowerCase() === "completed"
                                          ? "bg-green-50/50"
                                          : output.status?.toLowerCase() === "in-progress"
                                            ? "bg-blue-50/50"
                                            : "bg-muted/50"
                                      }
                                      hover:bg-muted/70
                                    `}
                                    onClick={() => toggleOutputExpansion(output.id.toString())}>
                                      <div className="flex items-center">
                                        {getStatusIcon(output.status || "")}
                                        <div className="ml-2">
                                          <div className="font-medium">{output.template_details?.name || "Unnamed Output"}</div>
                                          <div className="text-xs text-muted-foreground">{output.description || "No description"}</div>
                                        </div>
                                      </div>
                                      <div className="flex items-center">
                                        <div className="flex flex-col items-end mr-2">
                                          <Badge variant="outline" className={`${getStatusBadgeClass(output.status || "")}`}>
                                            <div className="flex items-center">
                                              <span>{output.status?.replace("-", " ") || "Not Started"}</span>
                                            </div>
                                          </Badge>
                                        </div>
                                        <ChevronDown className={`h-4 w-4 transition-transform ${expandedOutputs.includes(output.id.toString()) ? "rotate-180" : ""}`} />
                                      </div>
                                    </div>
                                    
                                    {expandedOutputs.includes(output.id.toString()) && (
                                      <div className="border-t bg-muted/20 divide-y">
                                        <div
                                          className={`p-2 pl-8 hover:bg-muted cursor-pointer flex items-center justify-between
                                            ${selectedOutput === output.id.toString() ? "bg-muted/50 font-medium" : ""}
                                          `}
                                          onClick={() => handleOutputSelect(output.id.toString())}
                                        >
                                          <div className="flex items-center">
                                            <FileText className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                                            <span className="text-sm">{output.template_details?.name || "Unnamed Output"}</span>
                                          </div>
                                          <Badge variant="outline" className={`${getStatusBadgeClass(output.status || "")} text-xs`}>
                                            {output.status?.replace("-", " ") || "Not Started"}
                                          </Badge>
                                        </div>
                                        
                                        {/* Show documents if any */}
                                        {output.documents && output.documents.length > 0 && (
                                          <div className="pl-8 pr-2 py-2">
                                            <p className="text-xs font-medium text-muted-foreground mb-1">Documents:</p>
                                            {output.documents.map(doc => (
                                              <div key={doc.id} className="flex items-center text-sm py-1">
                                                {getFileTypeIcon(doc.file_type)}
                                                <span className="ml-2">{doc.name}</span>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ))
                            ) : (
                              <div className="text-center py-8 text-muted-foreground">
                                <p>No outputs available for the current phase</p>
                              </div>
                            )}
                          </div>
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
                      <div className="flex items-center space-x-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Upload className="h-4 w-4 mr-2" />
                              Upload
                              <ChevronDown className="h-4 w-4 ml-1" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setShowUploadDialog(true)}>
                              <UploadCloud className="h-4 w-4 mr-2" />
                              Upload Document
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={markAsComplete}>
                              <CheckSquare className="h-4 w-4 mr-2" />
                              Mark as Complete
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={requestReview}>
                              <Eye className="h-4 w-4 mr-2" />
                              Request Review
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
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
                                          ? `Phase ${selectedPhase.id}: ${selectedPhase.template_details?.name || ""}`
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
                                          {inputs.find((input) => input.id === Number(selectedInput))?.template_details?.name}
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
                                      <Button variant="outline" size="sm" onClick={() => setShowUploadDialog(true)}>
                                        <FileUp className="h-4 w-4 mr-2" />
                                        Attach File
                                      </Button>
                                      <Button variant="outline" size="sm">
                                        <GitBranch className="h-4 w-4 mr-2" />
                                        Add Diagram
                                      </Button>
                                    </div>

                                    {/* Document List */}
                                    {loadingDocuments ? (
                                      <div className="flex justify-center items-center h-20">
                                        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-gray-900"></div>
                                      </div>
                                    ) : documents.length > 0 ? (
                                      <div className="mt-4 space-y-2">
                                        <h5 className="text-sm font-medium">Associated Documents</h5>
                                        {documents.map((doc) => (
                                          <Card key={doc.id} className="p-3">
                                            <div className="flex items-center justify-between">
                                              <div className="flex items-center">
                                                {getFileTypeIcon(doc.file_type)}
                                                <div className="ml-2">
                                                  <p className="text-sm font-medium">{doc.name}</p>
                                                  <div className="flex items-center mt-1">
                                                    <p className="text-xs text-muted-foreground mr-3">
                                                      {(doc.file_size / 1024).toFixed(2)} KB • {doc.file_type}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                      v{doc.version}
                                                    </p>
                                                  </div>
                                                </div>
                                              </div>
                                              <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                  <Button variant="ghost" size="icon">
                                                    <MoreVertical className="h-4 w-4" />
                                                  </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                  <DropdownMenuItem 
                                                    onClick={() => window.open(`${API_URL}/media/${doc.file_path}`, '_blank')}
                                                  >
                                                    <Eye className="h-4 w-4 mr-2" />
                                                    View
                                                  </DropdownMenuItem>
                                                  <DropdownMenuItem
                                                    onClick={() => {
                                                      const link = document.createElement('a');
                                                      link.href = `${API_URL}/media/${doc.file_path}`;
                                                      link.download = doc.name;
                                                      document.body.appendChild(link);
                                                      link.click();
                                                      document.body.removeChild(link);
                                                    }}
                                                  >
                                                    <Download className="h-4 w-4 mr-2" />
                                                    Download
                                                  </DropdownMenuItem>
                                                  <DropdownMenuSeparator />
                                                  <DropdownMenuItem
                                                    onClick={async () => {
                                                      try {
                                                        await documentApi.deleteDocument(doc.id);
                                                        setNotificationType("info");
                                                        setNotificationMessage("Document deleted successfully");
                                                        setShowNotification(true);
                                                        // Refresh the document list
                                                        fetchDocumentsForOutput(Number(selectedOutput));
                                                      } catch (err) {
                                                        console.error("Error deleting document:", err);
                                                        setNotificationType("error");
                                                        setNotificationMessage("Failed to delete document");
                                                        setShowNotification(true);
                                                      }
                                                    }}
                                                    className="text-red-600"
                                                  >
                                                    <Trash className="h-4 w-4 mr-2" />
                                                    Delete
                                                  </DropdownMenuItem>
                                                </DropdownMenuContent>
                                              </DropdownMenu>
                                            </div>
                                          </Card>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="mt-4 p-4 border border-dashed rounded-md text-center text-muted-foreground">
                                        <p>No documents attached to this output</p>
                                        <p className="text-sm mt-1">Upload a file to associate it with this output</p>
                                      </div>
                                    )}

                                    {/* Recently Uploaded Files */}
                                    {uploadedFiles.length > 0 && (
                                        <div className="mt-4 space-y-2">
                                          <h5 className="text-sm font-medium">Recently Uploaded Files</h5>
                                          {uploadedFiles.map((file) => (
                                            <Card key={file.id} className="p-2">
                                              <div className="flex items-center justify-between">
                                                <div className="flex items-center">
                                                  {getFileTypeIcon(file.type)}
                                                  <div className="ml-2">
                                                    <p className="text-sm font-medium">{file.name}</p>
                                                    <div className="flex items-center">
                                                      <p className="text-xs text-muted-foreground mr-3">
                                                        {(file.size / 1024).toFixed(2)} KB
                                                      </p>
                                                      {file.status === "uploading" && (
                                                        <div className="w-20">
                                                          <Progress value={file.progress} className="h-1" />
                                                        </div>
                                                      )}
                                                      {file.status === "success" && (
                                                        <Badge variant="outline" className="bg-green-50 text-green-600 text-xs">
                                                          Uploaded
                                                        </Badge>
                                                      )}
                                                      {file.status === "error" && (
                                                        <Badge variant="outline" className="bg-red-50 text-red-600 text-xs">
                                                          Failed
                                                        </Badge>
                                                      )}
                                                    </div>
                                                  </div>
                                                </div>
                                                <Button 
                                                  variant="ghost" 
                                                  size="icon" 
                                                  onClick={() => removeFile(file.id)}
                                                >
                                                  <X className="h-4 w-4" />
                                                </Button>
                                              </div>
                                              {file.status === "error" && file.error && (
                                                <p className="text-xs text-red-500 mt-1 ml-6">{file.error}</p>
                                              )}
                                            </Card>
                                          ))}
                                        </div>
                                      )}
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
      {/* File Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload File for {activeDocument?.name || "Output"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div
              className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 cursor-pointer hover:bg-muted/50"
              onClick={openFileDialog}
            >
              <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />
              <Upload className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-sm font-medium">Click to select a file or drag and drop</p>
              <p className="text-xs text-muted-foreground mt-1">
                Supported formats: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, JPG, PNG
              </p>
            </div>

            {currentFile && (
              <div className="border rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {getFileTypeIcon(currentFile.type)}
                    <div className="ml-2">
                      <p className="text-sm font-medium">{currentFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(currentFile.size / 1024).toFixed(2)} KB • {currentFile.type || "Unknown type"}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setCurrentFile(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {isUploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Uploading...</span>
                  <span className="text-sm">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            {uploadError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{uploadError}</AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleFileUpload} disabled={!currentFile || isUploading}>
              {isUploading ? "Uploading..." : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
