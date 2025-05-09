"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useSearchParams, useParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { historyApi } from "@/config/api-utils"
import HistoryTable from "./components/history-table"
import HistoryFilters from "./components/history-filters"
import HistoryDetailView from "./components/history-detail-view"
import type { HistoryEntry, NestedHistory } from "./types"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function HistoryPage() {
  const params = useParams()
  const projectId = params.projectId as string
  
  const [activeTab, setActiveTab] = useState<string>("project")
  const [historyData, setHistoryData] = useState<HistoryEntry[]>([])
  const [nestedHistoryData, setNestedHistoryData] = useState<NestedHistory | null>(null)
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

  // Only fetch nested history data now
  const fetchNestedHistoryData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const data = await historyApi.getNestedHistory(projectId)
      // Fix typing issue - cast to NestedHistory explicitly
      setNestedHistoryData(data as NestedHistory)
      
      // For the initial project view, set the history data as well
      if (data?.project) {
        setHistoryData(data.project)
        setFilteredData(data.project)
      }
    } catch (err: any) {
      console.error("Error fetching nested history data:", err)
      setError("Failed to load history data. Please try again later.")
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    if (projectId) {
      fetchNestedHistoryData()
    }
  }, [projectId, fetchNestedHistoryData])

  // Update history data when tab changes - always use nested data
  useEffect(() => {
    if (nestedHistoryData) {
      let newHistoryData: HistoryEntry[] = [];
      
      switch (activeTab) {
        case 'project':
          newHistoryData = nestedHistoryData.project;
          break;
          
        case 'ppap':
          newHistoryData = nestedHistoryData.ppap.history;
          break;
          
        case 'phase':
          // Flatten all phase histories and add source info
          newHistoryData = Object.entries(nestedHistoryData.ppap.phases).flatMap(([phaseId, phase]) => 
            phase.history.map(entry => ({
              ...entry,
              sourceName: phase.name,
              sourceId: phaseId,
              sourceType: 'phase'
            }))
          );
          break;
          
        case 'output':
          // Flatten all output histories and add source info
          newHistoryData = Object.values(nestedHistoryData.ppap.phases).flatMap(phase => 
            Object.entries(phase.outputs).flatMap(([outputId, output]) => 
              output.history.map(entry => ({
                ...entry,
                sourceName: output.name,
                sourceId: outputId,
                sourceType: 'output',
                parentName: phase.name
              }))
            )
          );
          break;
          
        case 'document':
          // Flatten all document histories with source info
          newHistoryData = Object.values(nestedHistoryData.ppap.phases).flatMap(phase => 
            Object.values(phase.outputs).flatMap(output => 
              Object.entries(output.documents).flatMap(([docId, doc]) => 
                doc.history.map(entry => ({
                  ...entry,
                  sourceName: doc.name,
                  sourceId: docId,
                  sourceType: 'document',
                  parentName: output.name,
                  grandparentName: phase.name
                }))
              )
            )
          );
          break;
          
        case 'team':
          newHistoryData = nestedHistoryData.team.history;
          break;
          
        case 'user':
          // Flatten all user histories
          newHistoryData = nestedHistoryData.users.flatMap(user => 
            user.history.map(entry => ({
              ...entry,
              sourceName: user.username,
              sourceId: user.id.toString(),
              sourceType: 'user'
            }))
          );
          break;
          
        default:
          newHistoryData = [];
      }
      
      // Ensure all entries have an events array for consistent handling
      const processedData = newHistoryData.map(entry => {
        if (!entry.events || !Array.isArray(entry.events) || entry.events.length === 0) {
          // Create synthetic events from the event string
          return {
            ...entry,
            events: [{
              type: entry.table_name || 'action',
              details: entry.event,
              timestamp: entry.created_at,
              user: entry.created_by
            }]
          };
        }
        return entry;
      });

      // Sort by date (newest first)
      const sortedData = processedData.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      setHistoryData(sortedData);
      // Don't filter here, let applyFilters do its job
    }
  }, [activeTab, nestedHistoryData]);

  // Improved applyFilters to better handle events
  const applyFilters = useCallback(() => {
    if (!historyData.length) {
      setFilteredData([]);
      return;
    }
    
    let filtered = [...historyData];

    // Apply date range filter
    if (dateRange.from) {
      filtered = filtered.filter((entry) => new Date(entry.created_at) >= dateRange.from!);
    }

    if (dateRange.to) {
      filtered = filtered.filter((entry) => new Date(entry.created_at) <= dateRange.to!);
    }

    // Apply action type filter with improved event handling
    if (actionType) {
      filtered = filtered.filter((entry) => {
        // Check if entry has events array
        if (entry.events && entry.events.length > 0) {
          return entry.events.some((event) => 
            event.type.toLowerCase().includes(actionType.toLowerCase()) || 
            event.details.toLowerCase().includes(actionType.toLowerCase())
          );
        }
        
        // Fallback to checking the event string
        return entry.event.toLowerCase().includes(actionType.toLowerCase());
      });
    }

    // Apply search query with improved search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((entry) => {
        // Check title and event string
        const titleMatch = entry.title?.toLowerCase().includes(query) || false;
        const eventMatch = entry.event?.toLowerCase().includes(query) || false;
        
        // Check source information
        const sourceMatch = 
          (entry.sourceName?.toLowerCase().includes(query) || false) ||
          (entry.parentName?.toLowerCase().includes(query) || false) ||
          (entry.grandparentName?.toLowerCase().includes(query) || false);
        
        // Check events array
        const eventsMatch = entry.events?.some(event => 
          event.details.toLowerCase().includes(query) || 
          event.type.toLowerCase().includes(query) ||
          (event.user?.toLowerCase().includes(query) || false)
        ) || false;
        
        return titleMatch || eventMatch || eventsMatch || sourceMatch;
      });
    }

    setFilteredData(filtered);
  }, [historyData, dateRange, actionType, searchQuery]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSelectedEntry(null);
    // Don't reset filters when changing tabs
  };

  const handleEntrySelect = (entry: HistoryEntry) => {
    setSelectedEntry(entry);
  };

  const handleCloseDetail = () => {
    setSelectedEntry(null);
  };

  const handleFilterChange = (
    newDateRange: { from?: Date; to?: Date },
    newActionType: string | null,
    newSearchQuery: string,
  ) => {
    setDateRange(newDateRange);
    setActionType(newActionType);
    setSearchQuery(newSearchQuery);
  };

  const tableOptions = [
    { id: "project", label: "Project" },
    { id: "ppap", label: "PPAP" },
    { id: "phase", label: "Phases" },
    { id: "output", label: "Outputs" },
    { id: "document", label: "Documents" },
    { id: "user", label: "Users" },
    { id: "team", label: "Teams" },
  ];

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

                <HistoryTable 
                  data={filteredData} 
                  loading={loading} 
                  onEntrySelect={handleEntrySelect} 
                />
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {selectedEntry && <HistoryDetailView entry={selectedEntry} onClose={handleCloseDetail} />}
    </div>
  );
}
