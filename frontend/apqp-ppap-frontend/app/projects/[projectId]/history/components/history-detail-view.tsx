"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { HistoryEntry } from "../types"
import { format } from "date-fns"
import { X } from "lucide-react"

interface HistoryDetailViewProps {
  entry: HistoryEntry
  onClose: () => void
}

export default function HistoryDetailView({ entry, onClose }: HistoryDetailViewProps) {
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy h:mm:ss a")
    } catch (err) {
      return "Invalid date"
    }
  }

  const getEventTypeColor = (type: string): string => {
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

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl">{entry.title}</DialogTitle>
          <Button variant="ghost" size="icon" className="absolute right-4 top-4" onClick={onClose}>
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </DialogHeader>

        <div className="flex flex-col md:flex-row gap-2 text-sm text-muted-foreground mb-4">
          <div>
            <span className="font-medium">Date:</span> {formatDate(entry.created_at)}
          </div>
          {entry.user && (
            <div className="md:ml-4">
              <span className="font-medium">User:</span> {entry.user}
            </div>
          )}
          <div className="md:ml-4">
            <span className="font-medium">Table:</span> {entry.table_name}
          </div>
        </div>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium mb-2">Event Summary</h3>
              <p>{entry.event}</p>
            </div>

            {entry.events && entry.events.length > 0 ? (
              <div>
                <h3 className="text-sm font-medium mb-2">Detailed Events</h3>
                <div className="space-y-4">
                  {entry.events.map((event, index) => (
                    <div key={index} className="border-l-2 border-gray-200 pl-4 py-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={getEventTypeColor(event.type)}>{event.type}</Badge>
                        {event.timestamp && (
                          <span className="text-xs text-muted-foreground">{formatDate(event.timestamp)}</span>
                        )}
                        {event.user && <span className="text-xs">by {event.user}</span>}
                      </div>
                      <p className="text-sm">{event.details}</p>

                      {event.changes && Object.keys(event.changes).length > 0 && (
                        <div className="mt-2 text-sm">
                          <h4 className="font-medium mb-1">Changes:</h4>
                          <ul className="space-y-1">
                            {Object.entries(event.changes).map(([field, value], i) => (
                              <li key={i} className="flex gap-2">
                                <span className="font-mono">{field}:</span>
                                <span>{JSON.stringify(value)}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </ScrollArea>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
