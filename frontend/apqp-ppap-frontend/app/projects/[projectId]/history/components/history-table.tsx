"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ChevronDown, ChevronUp, Eye } from "lucide-react"
import type { HistoryEntry } from "../types"
import { formatDate } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"

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
      <div className="space-y-2">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    )
  }

  if (data.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No history entries found.</div>
  }

  // Helper function to get the event type for rendering badge
  const getEventType = (entry: HistoryEntry): string => {
    if (entry.events && entry.events.length > 0) {
      return entry.events[0].type;
    }
    return entry.table_name || 'Unknown';
  };
  
  // Helper to get badge color based on event type
  const getBadgeVariant = (type: string): "default" | "secondary" | "destructive" | "outline" => {
    type = type.toLowerCase();
    if (type.includes('creat')) return "default";
    if (type.includes('updat')) return "secondary";
    if (type.includes('delet') || type.includes('remov')) return "destructive";
    return "outline";
  };
  
  // Get the description text
  const getEventDescription = (entry: HistoryEntry): string => {
    if (entry.events && entry.events.length > 0) {
      return entry.events[0].details;
    }
    return entry.event || 'No description available';
  };
  
  // Get source context if available
  const getSourceContext = (entry: HistoryEntry): string => {
    if (entry.sourceName) {
      if (entry.grandparentName && entry.parentName) {
        return `${entry.grandparentName} → ${entry.parentName} → ${entry.sourceName}`;
      } else if (entry.parentName) {
        return `${entry.parentName} → ${entry.sourceName}`;
      } else {
        return entry.sourceName;
      }
    }
    return '';
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[180px]">Date</TableHead>
          <TableHead className="w-[120px]">Type</TableHead>
          <TableHead className="w-[180px]">User</TableHead>
          <TableHead>Description</TableHead>
          <TableHead className="w-[100px] text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((entry) => (
          <TableRow key={entry.id}>
            <TableCell className="whitespace-nowrap">
              <div className="font-medium">
                {new Date(entry.created_at).toLocaleDateString()}
              </div>
              <div className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
              </div>
            </TableCell>
            <TableCell>
              <Badge variant={getBadgeVariant(getEventType(entry))}>
                {getEventType(entry)}
              </Badge>
              
              {entry.sourceName && (
                <div className="mt-1 text-xs text-muted-foreground truncate max-w-[120px]" title={getSourceContext(entry)}>
                  {getSourceContext(entry)}
                </div>
              )}
            </TableCell>
            <TableCell>{entry.created_by || 'System'}</TableCell>
            <TableCell>
              <div className="line-clamp-2">
                {getEventDescription(entry)}
              </div>
              
              {entry.events && entry.events.length > 1 && (
                <div className="mt-1 text-xs text-muted-foreground">
                  +{entry.events.length - 1} more events
                </div>
              )}
            </TableCell>
            <TableCell className="text-right">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEntrySelect(entry)}
                title="View details"
              >
                <Eye className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
