"use client"

import { useEffect, useState } from "react"
import { fetchApi } from "@/config/api-utils"
import type { History } from "@/config/api-types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

export default function ProjectHistoryPage({ params }: { params: { projectId: string } }) {
  const [history, setHistory] = useState<History[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true)
        const data = await fetchApi<History[]>(`/history/project/?project_id=${params.projectId}`)
        // Ensure we always have an array
        const historyArray = Array.isArray(data) ? data : data ? [data] : []
        setHistory(historyArray)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch history")
        console.error("Error fetching history:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [params.projectId])

  // Get appropriate color for event type badge
  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "create":
        return "bg-green-100 text-green-800"
      case "update":
        return "bg-blue-100 text-blue-800"
      case "delete":
        return "bg-red-100 text-red-800"
      case "status_change":
        return "bg-purple-100 text-purple-800"
      case "complete":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy h:mm a")
    } catch (err) {
      return "Invalid date"
    }
  }

  if (loading) {
    return <div className="text-center py-10">Loading history...</div>
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">{error}</div>
  }

  if (history.length === 0) {
    return <div className="text-center py-10">No history records found</div>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Project History</h1>

      <div className="space-y-4">
        {history.map((item) => (
          <Card key={item.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle>{item.title}</CardTitle>
                <Badge>{item.table_name}</Badge>
              </div>
              <p className="text-sm text-gray-500">{formatDate(item.created_at)}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {item.events ? (
                  item.events.map((event, index) => (
                    <div key={index} className="border-l-2 border-gray-200 pl-4">
                      <div className="flex items-center gap-2">
                        <Badge className={getEventTypeColor(event.type)}>{event.type}</Badge>
                        <span className="text-sm text-gray-500">{formatDate(event.timestamp)}</span>
                      </div>
                      <p className="mt-1">{event.details}</p>
                    </div>
                  ))
                ) : (
                  <div className="border-l-2 border-gray-200 pl-4">
                    <p>{item.event}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
