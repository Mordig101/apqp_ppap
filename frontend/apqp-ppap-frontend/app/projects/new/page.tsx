"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertCircle, ArrowRight } from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { projectApi, clientApi, teamApi } from "@/config/api-utils"
import type { Client, Team, Project } from "@/config/api-types"
import { useEffect } from "react"

export default function NewProjectPage() {
  const router = useRouter()

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    clientId: "",
    teamId: "",
    ppapLevel: "3", // Default PPAP level
  })

  // Data state
  const [clients, setClients] = useState<Client[]>([])
  const [teams, setTeams] = useState<Team[]>([])

  // UI state
  const [loading, setLoading] = useState({
    clients: true,
    teams: true,
    submit: false,
  })
  const [errors, setErrors] = useState({
    clients: "",
    teams: "",
    form: "",
  })
  const [createdProject, setCreatedProject] = useState<Project | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)

  // Fetch clients and teams on component mount
  useEffect(() => {
    fetchClients()
    fetchTeams()
  }, [])

  // Fetch clients from API
  const fetchClients = async () => {
    try {
      const clientsData = await clientApi.getAllClients()
      setClients(clientsData)
    } catch (error: any) {
      console.error("Error fetching clients:", error)
      setErrors((prev) => ({ ...prev, clients: error.message || "Failed to fetch clients" }))
    } finally {
      setLoading((prev) => ({ ...prev, clients: false }))
    }
  }

  // Fetch teams from API
  const fetchTeams = async () => {
    try {
      const teamsData = await teamApi.getAllTeams()
      setTeams(teamsData)
    } catch (error: any) {
      console.error("Error fetching teams:", error)
      setErrors((prev) => ({ ...prev, teams: error.message || "Failed to fetch teams" }))
    } finally {
      setLoading((prev) => ({ ...prev, teams: false }))
    }
  }

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Validate form
  const validateForm = () => {
    let isValid = true
    const newErrors = { ...errors, form: "" }

    if (!formData.name.trim()) {
      newErrors.form = "Project name is required"
      isValid = false
    } else if (!formData.clientId) {
      newErrors.form = "Client is required"
      isValid = false
    } else if (!formData.teamId) {
      newErrors.form = "Team is required"
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading((prev) => ({ ...prev, submit: true }))
    setErrors((prev) => ({ ...prev, form: "" }))

    try {
      const projectData = {
        name: formData.name,
        description: formData.description,
        client_id: Number.parseInt(formData.clientId),
        team_id: Number.parseInt(formData.teamId),
        ppap_level: Number.parseInt(formData.ppapLevel),
      }

      const response = await projectApi.createProject(projectData)
      setCreatedProject(response)
      setShowSuccess(true)

      // Automatically redirect to APQP preparation after a short delay
      setTimeout(() => {
        router.push(`/projects/prepare-apqp?projectId=${response.id}`)
      }, 1500)
    } catch (error: any) {
      console.error("Error creating project:", error)
      setErrors((prev) => ({ ...prev, form: error.message || "Failed to create project" }))
    } finally {
      setLoading((prev) => ({ ...prev, submit: false }))
    }
  }

  // Handle "Skip APQP Setup" button click
  const handleSkipAPQP = () => {
    if (createdProject) {
      router.push(`/projects/${createdProject.id}`)
    }
  }

  // Handle "Continue to APQP Setup" button click
  const handleContinueToAPQP = () => {
    if (createdProject) {
      router.push(`/projects/prepare-apqp?projectId=${createdProject.id}`)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Create New Project</h2>
        </div>

        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
            <CardDescription>
              Enter the details for your new project. After creation, you'll be guided to set up APQP.
            </CardDescription>
          </CardHeader>

          {showSuccess ? (
            <CardContent className="space-y-6">
              <Alert className="bg-green-50 border-green-200">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full bg-green-500" />
                  <AlertTitle>Project Created Successfully</AlertTitle>
                </div>
                <AlertDescription>
                  Your project "{createdProject?.name}" has been created successfully. You will be redirected to the
                  APQP setup page shortly.
                </AlertDescription>
              </Alert>

              <div className="flex justify-between">
                <Button variant="outline" onClick={handleSkipAPQP}>
                  Skip APQP Setup
                </Button>
                <Button onClick={handleContinueToAPQP}>
                  Continue to APQP Setup <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          ) : (
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-6">
                {errors.form && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{errors.form}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="name">Project Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Enter project name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Enter project description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="clientId">Client *</Label>
                    {loading.clients ? (
                      <div className="flex items-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">Loading clients...</span>
                      </div>
                    ) : errors.clients ? (
                      <Alert variant="destructive" className="py-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{errors.clients}</AlertDescription>
                      </Alert>
                    ) : (
                      <Select
                        value={formData.clientId}
                        onValueChange={(value) => handleSelectChange("clientId", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a client" />
                        </SelectTrigger>
                        <SelectContent>
                          {clients.map((client) => (
                            <SelectItem key={client.id} value={client.id.toString()}>
                              {client.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="teamId">Team *</Label>
                    {loading.teams ? (
                      <div className="flex items-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">Loading teams...</span>
                      </div>
                    ) : errors.teams ? (
                      <Alert variant="destructive" className="py-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{errors.teams}</AlertDescription>
                      </Alert>
                    ) : (
                      <Select value={formData.teamId} onValueChange={(value) => handleSelectChange("teamId", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a team" />
                        </SelectTrigger>
                        <SelectContent>
                          {teams.map((team) => (
                            <SelectItem key={team.id} value={team.id.toString()}>
                              {team.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ppapLevel">PPAP Level</Label>
                  <Select value={formData.ppapLevel} onValueChange={(value) => handleSelectChange("ppapLevel", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select PPAP level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Level 1</SelectItem>
                      <SelectItem value="2">Level 2</SelectItem>
                      <SelectItem value="3">Level 3</SelectItem>
                      <SelectItem value="4">Level 4</SelectItem>
                      <SelectItem value="5">Level 5</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    The PPAP level determines the documentation requirements for the project.
                  </p>
                </div>
              </CardContent>

              <CardFooter className="flex justify-between">
                <Button variant="outline" type="button" onClick={() => router.push("/projects")}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading.submit}>
                  {loading.submit ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
                    </>
                  ) : (
                    "Create Project"
                  )}
                </Button>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </DashboardLayout>
  )
}
