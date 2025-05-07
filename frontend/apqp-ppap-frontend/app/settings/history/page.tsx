"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Calendar, Download, Search } from "lucide-react"
import { format } from "date-fns"

interface HistoryRecord {
  id: string
  title: string
  event: string
  table_name: string
  created_at: string
  user?: string
  details?: string
}

export default function HistoryPage() {
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tableFilter, setTableFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const [userFilter, setUserFilter] = useState("all")

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true)
        // In a real app, this would fetch from the API
        // const data = await fetchApi<HistoryRecord[]>('/history/');

        // For demo purposes, we'll use mock data
        const mockData: HistoryRecord[] = [
          {
            id: "hist_1",
            title: "Project Alpha",
            event: "Project created with ID 1",
            table_name: "project",
            created_at: "2024-01-01T10:30:00Z",
            user: "admin",
            details: "Initial project creation",
          },
          {
            id: "hist_2",
            title: "PPAP for Project 1",
            event: "PPAP created with level 3",
            table_name: "ppap",
            created_at: "2024-01-01T11:15:00Z",
            user: "admin",
            details: "PPAP level 3 setup for Project Alpha",
          },
          {
            id: "hist_3",
            title: "Phase 1",
            event: "Phase created",
            table_name: "phase",
            created_at: "2024-01-01T14:20:00Z",
            user: "admin",
            details: "Planning phase created for Project Alpha",
          },
          {
            id: "hist_4",
            title: "Output 1",
            event: "Output created",
            table_name: "output",
            created_at: "2024-01-02T09:45:00Z",
            user: "john.doe",
            details: "Design FMEA output created for Phase 2",
          },
          {
            id: "hist_5",
            title: "Project Alpha",
            event: "Project status changed to In Progress",
            table_name: "project",
            created_at: "2024-01-03T16:30:00Z",
            user: "jane.smith",
            details: "Project status updated from Planning to In Progress",
          },
          {
            id: "hist_6",
            title: "Document 1",
            event: "Document uploaded",
            table_name: "document",
            created_at: "2024-01-04T11:20:00Z",
            user: "john.doe",
            details: "Process Flow Diagram document uploaded for Output 2",
          },
          {
            id: "hist_7",
            title: "Client A",
            event: "Client created",
            table_name: "client",
            created_at: "2024-01-05T14:15:00Z",
            user: "admin",
            details: "New client created",
          },
          {
            id: "hist_8",
            title: "User john.doe",
            event: "User created",
            table_name: "user",
            created_at: "2024-01-05T14:30:00Z",
            user: "admin",
            details: "New user created",
          },
        ]

        setHistoryRecords(mockData)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch history records")
        console.error("Error fetching history records:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [])

  // Get unique table names for filter
  const tableNames = ["all", ...new Set(historyRecords.map((record) => record.table_name))]

  // Get unique users for filter
  const userNames = ["all", ...new Set(historyRecords.map((record) => record.user).filter(Boolean) as string[])]

  // Filter history records based on search term and filters
  const filteredRecords = historyRecords.filter((record) => {
    // Apply search term filter
    const matchesSearch =
      record.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.event.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.details && record.details.toLowerCase().includes(searchTerm.toLowerCase()))

    // Apply table filter
    const matchesTable = tableFilter === "all" || record.table_name === tableFilter

    // Apply user filter
    const matchesUser = userFilter === "all" || record.user === userFilter

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

    return matchesSearch && matchesTable && matchesUser && matchesDate
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
  const getTableColor = (tableName: string) => {
    switch (tableName) {
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
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100"
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">History</h1>
          <Button variant="outline">
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
                        <SelectItem key={table} value={table}>
                          {table === "all" ? "All tables" : table.charAt(0).toUpperCase() + table.slice(1)}
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
                        <SelectItem key={user} value={user}>
                          {user === "all" ? "All users" : user}
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
                    <TableHead>Title</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Table</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Date & Time</TableHead>
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
                  ) : filteredRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        No history records found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{record.title}</TableCell>
                        <TableCell>
                          <div>
                            <div>{record.event}</div>
                            {record.details && (
                              <div className="text-xs text-muted-foreground mt-1">{record.details}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getTableColor(record.table_name)}>
                            {record.table_name}
                          </Badge>
                        </TableCell>
                        <TableCell>{record.user || "System"}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Calendar className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                            <span>{formatDate(record.created_at)}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
