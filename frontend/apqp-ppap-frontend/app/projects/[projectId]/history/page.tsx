"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { projectApi } from "@/config/api-utils"
import type { History } from "@/config/api-types"
import { formatDate } from "@/lib/utils"

export default function HistoryPage() {
  const params = useParams()
  const projectId = Number(params.projectId)

  const [history, setHistory] = useState<History[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await projectApi.getProjectHistory(projectId)
        setHistory(data)
      } catch (err) {
        console.error("Error fetching project history:", err)
        setError("Failed to load project history")
      } finally {
        setLoading(false)
      }
    }

    if (projectId) {
      fetchHistory()
    }
  }, [projectId])

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Project History</h1>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
          </div>
        ) : error ? (
          <div className="p-4 text-red-600 bg-red-100 rounded-md">{error}</div>
        ) : history.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Activity Log</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{formatDate(item.created_at)}</TableCell>
                      <TableCell>
                        {item.events && item.events.length > 0 ? item.events[0].type : "Unknown event"}
                      </TableCell>
                      <TableCell>{item.table_name}</TableCell>
                      <TableCell>
                        {item.events && item.events.length > 0 ? item.events[0].details : "No details available"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No history records found</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
