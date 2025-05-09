"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Calendar, Download, Search, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react"
import { format } from "date-fns"
import { historyApi } from "@/config/api-utils"

interface HistoryEvent {
  type: string;
  details: string;
  timestamp: string;
  user?: string;
}

interface HistoryRecord {
  id: string;
  title?: string;
  events: HistoryEvent[];
  table_name?: string;
  created_at: string;
  created_by?: string;
  started_at?: string;
  updated_at?: string | null;
  deadline?: string | null;
  finished_at?: string | null;
  details?: any;
  sourceName?: string;
  parentName?: string;
  grandparentName?: string;
}

export default function HistoryPage() {
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tableFilter, setTableFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const [userFilter, setUserFilter] = useState("all")
  const [eventTypeFilter, setEventTypeFilter] = useState("all")
  
  // Pagination state
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)

  // Fetch history data from API
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Call the API that gets nested history for all projects
        const response = await historyApi.getAllProjectsNestedHistory(page, pageSize)
        
        if (!response || !response.results) {
          throw new Error("Invalid response format from API")
        }
        
        // Set pagination information
        setTotalPages(response.pages || 1)
        setTotalRecords(response.total || 0)
        
        // Process the nested history data into a flat array of records
        const flattenedRecords: HistoryRecord[] = []
        
        // Process each project's nested history
        Object.entries(response.results).forEach(([projectId, projectData]) => {
          const projectName = projectData.project_name
          const nestedHistory = projectData.history
          
          // Add project history
          if (nestedHistory.project && Array.isArray(nestedHistory.project) && nestedHistory.project.length > 0) {
            nestedHistory.project.forEach(record => {
              // For each event in the record, create a separate history item
              if (record.events && record.events.length > 0) {
                record.events.forEach((event, index) => {
                  flattenedRecords.push({
                    ...record,
                    title: projectName,
                    sourceName: projectName,
                    table_name: 'project',
                    // If it's not the first event, create a new ID to avoid duplicates
                    id: index === 0 ? record.id : `${record.id}-${index}`,
                    // For multiple events, just show the current one
                    events: [event]
                  })
                })
              } else {
                // If no events, still add the record
                flattenedRecords.push({
                  ...record,
                  title: projectName,
                  sourceName: projectName,
                  table_name: 'project',
                })
              }
            })
          }
          
          // Add PPAP history
          if (nestedHistory.ppap && nestedHistory.ppap.history && Array.isArray(nestedHistory.ppap.history) && nestedHistory.ppap.history.length > 0) {
            nestedHistory.ppap.history.forEach(record => {
              if (record.events && record.events.length > 0) {
                record.events.forEach((event, index) => {
                  flattenedRecords.push({
                    ...record,
                    title: `PPAP for ${projectName}`,
                    sourceName: 'PPAP',
                    parentName: projectName,
                    table_name: 'ppap',
                    id: index === 0 ? record.id : `${record.id}-${index}`,
                    events: [event]
                  })
                })
              } else {
                flattenedRecords.push({
                  ...record,
                  title: `PPAP for ${projectName}`,
                  sourceName: 'PPAP',
                  parentName: projectName,
                  table_name: 'ppap'
                })
              }
            })
          }
          
          // Add phase history
          if (nestedHistory.ppap && nestedHistory.ppap.phases) {
            Object.entries(nestedHistory.ppap.phases).forEach(([phaseId, phase]) => {
              // Add phase history
              if (phase.history && Array.isArray(phase.history) && phase.history.length > 0) {
                phase.history.forEach(record => {
                  if (record.events && record.events.length > 0) {
                    record.events.forEach((event, index) => {
                      flattenedRecords.push({
                        ...record,
                        title: phase.name,
                        sourceName: phase.name,
                        parentName: 'PPAP',
                        grandparentName: projectName,
                        table_name: 'phase',
                        id: index === 0 ? record.id : `${record.id}-${index}`,
                        events: [event]
                      })
                    })
                  } else {
                    flattenedRecords.push({
                      ...record,
                      title: phase.name,
                      sourceName: phase.name,
                      parentName: 'PPAP',
                      grandparentName: projectName,
                      table_name: 'phase'
                    })
                  }
                })
              }
              
              // Add output history
              if (phase.outputs) {
                Object.entries(phase.outputs).forEach(([outputId, output]) => {
                  if (output.history && Array.isArray(output.history) && output.history.length > 0) {
                    output.history.forEach(record => {
                      if (record.events && record.events.length > 0) {
                        record.events.forEach((event, index) => {
                          flattenedRecords.push({
                            ...record,
                            title: output.name,
                            sourceName: output.name,
                            parentName: phase.name, 
                            grandparentName: projectName,
                            table_name: 'output',
                            id: index === 0 ? record.id : `${record.id}-${index}`,
                            events: [event]
                          })
                        })
                      } else {
                        flattenedRecords.push({
                          ...record,
                          title: output.name,
                          sourceName: output.name,
                          parentName: phase.name, 
                          grandparentName: projectName,
                          table_name: 'output'
                        })
                      }
                    })
                  }
                  
                  // Add document history
                  if (output.documents) {
                    Object.entries(output.documents).forEach(([docId, doc]) => {
                      if (doc.history && Array.isArray(doc.history) && doc.history.length > 0) {
                        doc.history.forEach(record => {
                          if (record.events && record.events.length > 0) {
                            record.events.forEach((event, index) => {
                              flattenedRecords.push({
                                ...record,
                                title: doc.name,
                                sourceName: doc.name,
                                parentName: output.name,
                                grandparentName: phase.name,
                                table_name: 'document',
                                id: index === 0 ? record.id : `${record.id}-${index}`,
                                events: [event]
                              })
                            })
                          } else {
                            flattenedRecords.push({
                              ...record,
                              title: doc.name,
                              sourceName: doc.name,
                              parentName: output.name,
                              grandparentName: phase.name,
                              table_name: 'document'
                            })
                          }
                        })
                      }
                    })
                  }
                })
              }
            })
          }
          
          // Add team history
          if (nestedHistory.team && nestedHistory.team.history && Array.isArray(nestedHistory.team.history) && nestedHistory.team.history.length > 0) {
            nestedHistory.team.history.forEach(record => {
              if (record.events && record.events.length > 0) {
                record.events.forEach((event, index) => {
                  flattenedRecords.push({
                    ...record,
                    title: `Team for ${projectName}`,
                    sourceName: 'Team',
                    parentName: projectName,
                    table_name: 'team',
                    id: index === 0 ? record.id : `${record.id}-${index}`,
                    events: [event]
                  })
                })
              } else {
                flattenedRecords.push({
                  ...record,
                  title: `Team for ${projectName}`,
                  sourceName: 'Team',
                  parentName: projectName,
                  table_name: 'team'
                })
              }
            })
            
            // Add person history
            if (nestedHistory.team.persons) {
              Object.entries(nestedHistory.team.persons).forEach(([personId, person]) => {
                if (person.history && Array.isArray(person.history) && person.history.length > 0) {
                  person.history.forEach(record => {
                    if (record.events && record.events.length > 0) {
                      record.events.forEach((event, index) => {
                        flattenedRecords.push({
                          ...record,
                          title: person.name,
                          sourceName: person.name,
                          parentName: 'Team',
                          grandparentName: projectName,
                          table_name: 'person',
                          id: index === 0 ? record.id : `${record.id}-${index}`,
                          events: [event]
                        })
                      })
                    } else {
                      flattenedRecords.push({
                        ...record,
                        title: person.name,
                        sourceName: person.name,
                        parentName: 'Team',
                        grandparentName: projectName,
                        table_name: 'person'
                      })
                    }
                  })
                }
              })
            }
          }
          
          // Add user history
          if (nestedHistory.users && Array.isArray(nestedHistory.users) && nestedHistory.users.length > 0) {
            nestedHistory.users.forEach(user => {
              if (user.history && Array.isArray(user.history) && user.history.length > 0) {
                user.history.forEach(record => {
                  if (record.events && record.events.length > 0) {
                    record.events.forEach((event, index) => {
                      flattenedRecords.push({
                        ...record,
                        title: user.username,
                        sourceName: user.username,
                        parentName: projectName,
                        table_name: 'user',
                        id: index === 0 ? record.id : `${record.id}-${index}`,
                        events: [event]
                      })
                    })
                  } else {
                    flattenedRecords.push({
                      ...record,
                      title: user.username,
                      sourceName: user.username,
                      parentName: projectName,
                      table_name: 'user'
                    })
                  }
                })
              }
            })
          }
        })
        
        // Sort by date (newest first)
        const sortedRecords = flattenedRecords.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        
        setHistoryRecords(sortedRecords)
      } catch (err: any) {
        setError(err.message || "Failed to fetch history records")
        console.error("Error fetching history records:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [page, pageSize])

  // Get unique table names for filter
  const tableNames = ["all", ...new Set(historyRecords.map((record) => record.table_name))]

  // Get unique users for filter
  const userNames = ["all", ...new Set(historyRecords
    .map((record) => record.created_by || record.events?.[0]?.user)
    .filter(Boolean) as string[])]
    
  // Get unique event types for filter
  const eventTypes = ["all", ...new Set(historyRecords
    .flatMap(record => record.events?.map(event => event.type) || [])
    .filter(Boolean))]

  // Filter history records based on search term and filters
  const filteredRecords = historyRecords.filter((record) => {
    // Apply search term filter
    const matchesSearch =
      !searchTerm ||
      (record.title?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (record.events && record.events.some(event => event.details.toLowerCase().includes(searchTerm.toLowerCase()))) ||
      (record.sourceName?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (record.parentName?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (record.grandparentName?.toLowerCase().includes(searchTerm.toLowerCase()) || false)

    // Apply table filter
    const matchesTable = tableFilter === "all" || record.table_name === tableFilter

    // Apply user filter
    const matchesUser = userFilter === "all" || 
      record.created_by === userFilter ||
      record.events?.some(event => event.user === userFilter)

    // Apply event type filter
    const matchesEventType = eventTypeFilter === "all" ||
      record.events?.some(event => event.type === eventTypeFilter)

    // Apply date filter
    let matchesDate = true
    const recordDate = new Date(record.created_at)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const lastWeek = new Date(today)
    lastWeek.setDate(lastWeek.getDate() - 7)
    const lastMonth = new Date(today)
    lastMonth.setMonth(lastMonth.getMonth() - 1)

    if (dateFilter === "today") {
      matchesDate = recordDate.toDateString() === today.toDateString()
    } else if (dateFilter === "yesterday") {
      matchesDate = recordDate.toDateString() === yesterday.toDateString()
    } else if (dateFilter === "last_week") {
      matchesDate = recordDate >= lastWeek
    } else if (dateFilter === "last_month") {
      matchesDate = recordDate >= lastMonth
    }

    return matchesSearch && matchesTable && matchesUser && matchesDate && matchesEventType
  })

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy h:mm a")
    } catch (err) {
      return "Invalid date"
    }
  }

  // Get appropriate color for table name badge
  const getTableColor = (tableName: string = '') => {
    switch (tableName.toLowerCase()) {
      case "project":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100"
      case "ppap":
        return "bg-purple-100 text-purple-800 hover:bg-purple-100"
      case "phase":
        return "bg-green-100 text-green-800 hover:bg-green-100"
      case "output":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
      case "document":
        return "bg-orange-100 text-orange-800 hover:bg-orange-100"
      case "client":
        return "bg-pink-100 text-pink-800 hover:bg-pink-100"
      case "user":
        return "bg-indigo-100 text-indigo-800 hover:bg-indigo-100"
      case "team":
        return "bg-cyan-100 text-cyan-800 hover:bg-cyan-100"
      case "person":
        return "bg-rose-100 text-rose-800 hover:bg-rose-100"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100"
    }
  }
  
  // Get event details for display
  const getEventDetails = (record: HistoryRecord): { eventText: string, detailsText: string | null } => {
    if (record.events && record.events.length > 0) {
      const mainEvent = record.events[0]
      return {
        eventText: mainEvent.details,
        detailsText: record.events.length > 1 ? `+${record.events.length - 1} more events` : null
      }
    }
    
    return { 
      eventText: "No event details", 
      detailsText: null 
    }
  }
  
  // Get context path (breadcrumb) for an item
  const getContextPath = (record: HistoryRecord): string => {
    if (record.grandparentName && record.parentName && record.sourceName) {
      return `${record.grandparentName} → ${record.parentName} → ${record.sourceName}`
    } else if (record.parentName && record.sourceName) {
      return `${record.parentName} → ${record.sourceName}`
    } else if (record.sourceName) {
      return record.sourceName
    }
    return ''
  }
  
  // Export history data as CSV
  const exportToCSV = () => {
    // Headers for CSV
    const headers = [
      "Title", "Event", "Event Type", "Table", "User", "Date & Time", "Context Path"
    ].join(',')
    
    // Process each record
    const rows = filteredRecords.map(record => {
      const eventDetails = getEventDetails(record)
      const contextPath = getContextPath(record)
      const date = formatDate(record.created_at)
      const user = record.created_by || record.events?.[0]?.user || 'System'
      const eventType = record.events?.[0]?.type || 'unknown'
      
      // Escape any commas or quotes in data
      const escapeCsvValue = (value: string) => {
        if (value.includes(',') || value.includes('"')) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      }
      
      return [
        escapeCsvValue(record.title || ''),
        escapeCsvValue(eventDetails.eventText),
        escapeCsvValue(eventType),
        escapeCsvValue(record.table_name || ''),
        escapeCsvValue(user),
        escapeCsvValue(date),
        escapeCsvValue(contextPath)
      ].join(',')
    }).join('\n')
    
    // Combine headers and rows
    const csvContent = `${headers}\n${rows}`
    
    // Create a blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `history-export-${new Date().toISOString().slice(0, 10)}.csv`)
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">History</h1>
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export History
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>History Records</CardTitle>
            <CardDescription>View and filter history records across the system</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search history..."
                  className="pl-8 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="w-full sm:w-auto">
                  <Select value={tableFilter} onValueChange={setTableFilter}>
                    <SelectTrigger className="w-full sm:w-[150px]">
                      <SelectValue placeholder="Filter by table" />
                    </SelectTrigger>
                    <SelectContent>
                      {tableNames.map((table) => (
                        <SelectItem key={table} value={table || ''}>
                          {table === "all" ? "All tables" : table?.charAt(0).toUpperCase() + table?.slice(1) || 'Unknown'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full sm:w-auto">
                  <Select value={userFilter} onValueChange={setUserFilter}>
                    <SelectTrigger className="w-full sm:w-[150px]">
                      <SelectValue placeholder="Filter by user" />
                    </SelectTrigger>
                    <SelectContent>
                      {userNames.map((user) => (
                        <SelectItem key={user} value={user || ''}>
                          {user === "all" ? "All users" : user || 'System'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full sm:w-auto">
                  <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
                    <SelectTrigger className="w-full sm:w-[150px]">
                      <SelectValue placeholder="Filter by event type" />
                    </SelectTrigger>
                    <SelectContent>
                      {eventTypes.map((type) => (
                        <SelectItem key={type} value={type || ''}>
                          {type === "all" ? "All event types" : type || 'Unknown'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full sm:w-auto">
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger className="w-full sm:w-[150px]">
                      <SelectValue placeholder="Filter by date" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="yesterday">Yesterday</SelectItem>
                      <SelectItem value="last_week">Last 7 days</SelectItem>
                      <SelectItem value="last_month">Last 30 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Title</TableHead>
                    <TableHead className="w-1/3">Event</TableHead>
                    <TableHead className="w-[100px]">Type</TableHead>
                    <TableHead className="w-[100px]">Table</TableHead>
                    <TableHead className="w-[120px]">User</TableHead>
                    <TableHead className="w-[180px]">Date & Time</TableHead>
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
                        <div className="flex flex-col items-center gap-2">
                          <AlertCircle className="h-5 w-5" />
                          <p>{error}</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        No history records found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRecords.map((record) => {
                      const { eventText } = getEventDetails(record)
                      const contextPath = getContextPath(record)
                      const eventType = record.events?.[0]?.type || 'unknown'
                      
                      return (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">
                            <div>{record.title || 'Untitled'}</div>
                            {contextPath && (
                              <div className="text-xs text-muted-foreground truncate max-w-[180px]" title={contextPath}>
                                {contextPath}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div>{eventText}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-sky-50 text-sky-700 hover:bg-sky-50">
                              {eventType}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getTableColor(record.table_name)}>
                              {record.table_name || 'unknown'}
                            </Badge>
                          </TableCell>
                          <TableCell>{record.created_by || record.events?.[0]?.user || 'System'}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Calendar className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                              <span>{formatDate(record.created_at)}</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
            
            {/* Pagination Controls */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {filteredRecords.length} of {totalRecords} records
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                  disabled={page === 1 || loading}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="sr-only">Previous Page</span>
                </Button>
                <div className="text-sm">
                  Page {page} of {totalPages}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={page === totalPages || loading}
                >
                  <ChevronRight className="h-4 w-4" />
                  <span className="sr-only">Next Page</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}