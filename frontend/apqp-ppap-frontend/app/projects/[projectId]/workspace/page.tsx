"use client"

import { useEffect, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { InputArea } from "./components/input-area"
import { OutputArea } from "./components/output-area"
import { projectApi } from "@/config/api-utils"
import type { Project, Phase, Output } from "@/config/api-types"

export default function WorkspacePage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const projectId = Number(params.projectId)
  const outputIdParam = searchParams.get("output")

  const [project, setProject] = useState<Project | null>(null)
  const [phases, setPhases] = useState<Phase[]>([])
  const [selectedPhase, setSelectedPhase] = useState<Phase | null>(null)
  const [inputs, setInputs] = useState<Output[]>([])
  const [outputs, setOutputs] = useState<Output[]>([])
  const [selectedInput, setSelectedInput] = useState<Output | null>(null)
  const [selectedOutput, setSelectedOutput] = useState<Output | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        const projectData = await projectApi.getProject(projectId)
        setProject(projectData)

        if (projectData.ppap_details?.phases) {
          setPhases(projectData.ppap_details.phases)

          // Select the first phase by default
          if (projectData.ppap_details.phases.length > 0) {
            const firstPhase = projectData.ppap_details.phases[0]
            setSelectedPhase(firstPhase)

            // Set outputs for the first phase
            if (firstPhase.outputs) {
              setOutputs(firstPhase.outputs)

              // If output ID is in URL params, select it
              if (outputIdParam) {
                const outputId = Number(outputIdParam)
                const output = firstPhase.outputs.find((o) => o.id === outputId)
                if (output) {
                  setSelectedOutput(output)
                }
              }
            }

            // For inputs, we'd typically get outputs from the previous phase
            // This is simplified for now
            setInputs([])
          }
        }
      } catch (err) {
        console.error("Error fetching project data:", err)
        setError("Failed to load project data")
      } finally {
        setLoading(false)
      }
    }

    if (projectId) {
      fetchProjectData()
    }
  }, [projectId, outputIdParam])

  const handlePhaseChange = (phaseId: string) => {
    const phase = phases.find((p) => p.id === Number(phaseId))
    if (phase) {
      setSelectedPhase(phase)

      // Update outputs for the selected phase
      if (phase.outputs) {
        setOutputs(phase.outputs)
        setSelectedOutput(null)
      }

      // For inputs, we'd typically get outputs from the previous phase
      // This is simplified for now
      setInputs([])
      setSelectedInput(null)
    }
  }

  const handleSelectInput = (input: Output) => {
    setSelectedInput(input)
  }

  const handleSelectOutput = (output: Output) => {
    setSelectedOutput(output)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-3xl font-bold">Workspace</h1>

          <div className="flex space-x-2">
            <Button variant="outline">Save Draft</Button>
            <Button>Mark as Complete</Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
          </div>
        ) : error ? (
          <div className="p-4 text-red-600 bg-red-100 rounded-md">{error}</div>
        ) : (
          <>
            {/* Phase Tabs */}
            {phases.length > 0 ? (
              <Tabs defaultValue={selectedPhase?.id.toString()} onValueChange={handlePhaseChange} className="w-full">
                <TabsList className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
                  {phases.map((phase) => (
                    <TabsTrigger key={phase.id} value={phase.id.toString()}>
                      {phase.template_details?.name || `Phase ${phase.id}`}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {phases.map((phase) => (
                  <TabsContent key={phase.id} value={phase.id.toString()}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <InputArea inputs={inputs} selectedInput={selectedInput} onSelectInput={handleSelectInput} />
                      <OutputArea
                        outputs={phase.outputs || []}
                        selectedOutput={selectedOutput}
                        onSelectOutput={handleSelectOutput}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Input Preview */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Input Preview</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {selectedInput ? (
                            <div>
                              <h3 className="font-medium">{selectedInput.template_details?.name}</h3>
                              <p className="mt-2">{selectedInput.description || "No description available"}</p>

                              {selectedInput.documents && selectedInput.documents.length > 0 ? (
                                <div className="mt-4">
                                  <h4 className="font-medium text-sm">Attached Documents</h4>
                                  <ul className="mt-2 space-y-2">
                                    {selectedInput.documents.map((doc) => (
                                      <li key={doc.id} className="text-blue-600 hover:underline">
                                        {doc.name} (v{doc.version})
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ) : (
                                <p className="mt-4 text-gray-500">No documents attached</p>
                              )}
                            </div>
                          ) : (
                            <p className="text-gray-500">Select an input to preview</p>
                          )}
                        </CardContent>
                      </Card>

                      {/* Output Editing */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Output Editing</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {selectedOutput ? (
                            <div>
                              <h3 className="font-medium">{selectedOutput.template_details?.name}</h3>

                              <div className="mt-4">
                                <label className="block text-sm font-medium mb-2">Description</label>
                                <textarea
                                  className="w-full p-2 border rounded-md min-h-[100px]"
                                  placeholder="Enter description..."
                                  defaultValue={selectedOutput.description || ""}
                                ></textarea>
                              </div>

                              <div className="mt-4">
                                <h4 className="font-medium text-sm">Attached Documents</h4>
                                {selectedOutput.documents && selectedOutput.documents.length > 0 ? (
                                  <ul className="mt-2 space-y-2">
                                    {selectedOutput.documents.map((doc) => (
                                      <li key={doc.id} className="flex justify-between items-center">
                                        <span className="text-blue-600 hover:underline">
                                          {doc.name} (v{doc.version})
                                        </span>
                                        <Button variant="outline" size="sm">
                                          View
                                        </Button>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="mt-2 text-gray-500">No documents attached</p>
                                )}

                                <Button className="mt-4" variant="outline">
                                  Upload Document
                                </Button>
                              </div>

                              <div className="mt-6 flex justify-end space-x-2">
                                <Button variant="outline">Save Draft</Button>
                                <Button>Mark as Complete</Button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-gray-500">Select an output to edit</p>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No phases found for this project</p>
                <Button className="mt-4">Create First Phase</Button>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
