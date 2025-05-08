"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { fetchApi } from "@/config/api-utils"
import { API_ENDPOINTS } from "@/config/api"
import HistoryTable from "./components/history-table"
import HistoryFilters from "./components/history-filters"
import HistoryDetailView from "./components/history-detail-view"
import type { HistoryEntry } from "./types"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function HistoryPage({ params }: { params: { projectId: string } }) {
  const [activeTab, setActiveTab] = useState<string>("project")
  const [historyData, setHistoryData] = useState<HistoryEntry[]>([])
  const [filteredData, setFilteredData] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null)
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({})
  const [actionType, setActionType] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>("")

  const searchParams = useSearchParams()
  const initialTab = searchParams.get("table") || "project"

  useEffect(() => {
    setActiveTab(initialTab)
  }, [initialTab])

  useEffect(() => {
    fetchHistoryData(activeTab)
  }, [activeTab, params.projectId])

  useEffect(() => {
    applyFilters()
  }, [historyData, dateRange, actionType, searchQuery])

  const fetchHistoryData = async (tableName: string) => {
    try {
      setLoading(true)
      setError(null)

      const endpoint = `${API_ENDPOINTS.history}${tableName}/?project_id=${params.projectId}`
      const data = await fetchApi<HistoryEntry[]>(endpoint)

      // Ensure we have an array of history entries
      const historyArray = Array.isArray(data) ? data : []

      // Sort by date (newest first)
      const sortedData = historyArray.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )

      setHistoryData(sortedData)
      setFilteredData(sortedData)
    } catch (err) {
      console.error("Error fetching history data:", err)
      setError("Failed to load history data. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...historyData]

    // Apply date range filter
    if (dateRange.from) {
      filtered = filtered.filter((entry) => new Date(entry.created_at) >= dateRange.from!)
    }

    if (dateRange.to) {
      filtered = filtered.filter((entry) => new Date(entry.created_at) <= dateRange.to!)
    }

    // Apply action type filter
    if (actionType) {
      filtered = filtered.filter((entry) => {
        if (entry.events && entry.events.length > 0) {
          return entry.events.some((event) => event.type === actionType)
        }
        // For entries without explicit event types, try to infer from the event description
        return entry.event.toLowerCase().includes(actionType.toLowerCase())
      })
    }

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (entry) =>
          entry.title.toLowerCase().includes(query) ||
          entry.event.toLowerCase().includes(query) ||
          (entry.events && entry.events.some((event) => event.details.toLowerCase().includes(query))),
      )
    }

    setFilteredData(filtered)
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    setSelectedEntry(null)
    setDateRange({})
    setActionType(null)
    setSearchQuery("")
  }

  const handleEntrySelect = (entry: HistoryEntry) => {
    setSelectedEntry(entry)
  }

  const handleCloseDetail = () => {
    setSelectedEntry(null)
  }

  const handleFilterChange = (
    newDateRange: { from?: Date; to?: Date },
    newActionType: string | null,
    newSearchQuery: string,
  ) => {
    setDateRange(newDateRange)
    setActionType(newActionType)
    setSearchQuery(newSearchQuery)
  }

  const tableOptions = [
    { id: "project", label: "Project" },
    { id: "ppap", label: "PPAP" },
    { id: "phase", label: "Phases" },
    { id: "output", label: "Outputs" },
    { id: "document", label: "Documents" },
    { id: "user", label: "Users" },
    { id: "team", label: "Teams" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold">Project History</h1>
      </div>

      <Card>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 mb-6">
              {tableOptions.map((option) => (
                <TabsTrigger key={option.id} value={option.id} className="text-sm">
                  {option.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {tableOptions.map((option) => (
              <TabsContent key={option.id} value={option.id} className="space-y-4">
                <HistoryFilters
                  dateRange={dateRange}
                  actionType={actionType}
                  searchQuery={searchQuery}
                  onFilterChange={handleFilterChange}
                />

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <HistoryTable data={filteredData} loading={loading} onEntrySelect={handleEntrySelect} />
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {selectedEntry && <HistoryDetailView entry={selectedEntry} onClose={handleCloseDetail} />}
    </div>
  )
}
