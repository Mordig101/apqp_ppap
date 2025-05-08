"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ChevronDown, ChevronUp, Eye } from "lucide-react"
import type { HistoryEntry } from "../types"
import { formatDate } from "@/lib/utils"

interface HistoryTableProps {
  data: HistoryEntry[]
  loading: boolean
  onEntrySelect: (entry: HistoryEntry) => void
}

export default function HistoryTable({ data, loading, onEntrySelect }: HistoryTableProps) {
  const [sortField, setSortField] = useState<string>("created_at")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  const sortedData = [...data].sort((a, b) => {
    if (sortField === "created_at") {
      const dateA = new Date(a.created_at).getTime()
      const dateB = new Date(b.created_at).getTime()
      return sortDirection === "asc" ? dateA - dateB : dateB - dateA
    }

    if (sortField === "title") {
      return sortDirection === "asc" ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title)
    }

    if (sortField === "event") {
      return sortDirection === "asc" ? a.event.localeCompare(b.event) : b.event.localeCompare(a.event)
    }

    return 0
  })

  const getEventTypeFromEntry = (entry: HistoryEntry): string => {
    if (entry.events && entry.events.length > 0) {
      return entry.events[0].type
    }

    // Try to infer from the event description
    const eventLower = entry.event.toLowerCase()
    if (eventLower.includes("creat")) return "create"
    if (eventLower.includes("updat")) return "update"
    if (eventLower.includes("delet")) return "delete"
    if (eventLower.includes("status")) return "status_change"
    if (eventLower.includes("complet")) return "complete"
    if (eventLower.includes("assign")) return "assign"
    if (eventLower.includes("upload")) return "upload"

    return "update" // Default
  }

  const getEventTypeBadgeColor = (type: string): string => {
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
        return "bg-emerald-100 text-emerald-800"
      case "assign":
        return "bg-indigo-100 text-indigo-800"
      case "upload":
        return "bg-amber-100 text-amber-800"
      case "download":
        return "bg-sky-100 text-sky-800"
      case "review":
        return "bg-violet-100 text-violet-800"
      case "approve":
        return "bg-teal-100 text-teal-800"
      case "reject":
        return "bg-rose-100 text-rose-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Event</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-40" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-60" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </TableCell>
                <TableCell className="text-right">
                  <Skeleton className="h-8 w-8 rounded-full ml-auto" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center">
        <p className="text-muted-foreground">No history records found</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="cursor-pointer" onClick={() => handleSort("created_at")}>
              <div className="flex items-center gap-1">
                Date
                {sortField === "created_at" &&
                  (sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
              </div>
            </TableHead>
            <TableHead className="cursor-pointer" onClick={() => handleSort("title")}>
              <div className="flex items-center gap-1">
                Title
                {sortField === "title" &&
                  (sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
              </div>
            </TableHead>
            <TableHead className="cursor-pointer" onClick={() => handleSort("event")}>
              <div className="flex items-center gap-1">
                Event
                {sortField === "event" &&
                  (sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
              </div>
            </TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map((entry) => {
            const eventType = getEventTypeFromEntry(entry)
            return (
              <TableRow key={entry.id} className="group">
                <TableCell className="font-mono text-xs">{formatDate(entry.created_at)}</TableCell>
                <TableCell className="font-medium">{entry.title}</TableCell>
                <TableCell className="max-w-md truncate">{entry.event}</TableCell>
                <TableCell>
                  <Badge className={getEventTypeBadgeColor(eventType)}>{eventType}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEntrySelect(entry)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Eye className="h-4 w-4" />
                    <span className="sr-only">View details</span>
                  </Button>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
