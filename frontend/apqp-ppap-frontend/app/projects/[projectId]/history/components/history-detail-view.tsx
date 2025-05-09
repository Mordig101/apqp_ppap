"use client"

import React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import type { HistoryEntry } from "../types"
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

  // Helper to get badge color based on event type
  const getBadgeVariant = (type: string): "default" | "secondary" | "destructive" | "outline" => {
    type = type.toLowerCase();
    if (type.includes('creat')) return "default";
    if (type.includes('updat')) return "secondary";
    if (type.includes('delet') || type.includes('remov')) return "destructive";
    return "outline";
  };
  
  // Display source context if available
  const getSourceContext = (): JSX.Element | null => {
    if (!entry.sourceName) return null;
    
    let breadcrumb = '';
    
    if (entry.grandparentName && entry.parentName) {
      breadcrumb = `${entry.grandparentName} → ${entry.parentName} → ${entry.sourceName}`;
    } else if (entry.parentName) {
      breadcrumb = `${entry.parentName} → ${entry.sourceName}`;
    } else {
      breadcrumb = entry.sourceName;
    }
    
    return (
      <div className="mb-4">
        <h4 className="text-sm font-medium mb-1">Source</h4>
        <p className="text-sm">{breadcrumb}</p>
      </div>
    );
  };
  
  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>History Details</DialogTitle>
          <DialogDescription>
            {entry.title || 'Event details'}
          </DialogDescription>
          <Button variant="ghost" size="icon" className="absolute right-4 top-4" onClick={onClose}>
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </DialogHeader>
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-1">Timestamp</h4>
              <p className="text-sm">{new Date(entry.created_at).toLocaleString()}</p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-1">User</h4>
              <p className="text-sm">{entry.created_by || 'System'}</p>
            </div>
            
            {getSourceContext()}
            
            {entry.events && entry.events.length > 0 ? (
              <div>
                <h4 className="text-sm font-medium mb-2">Events</h4>
                <div className="space-y-3">
                  {entry.events.map((event, index) => (
                    <div key={index} className="bg-muted p-3 rounded-md">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant={getBadgeVariant(event.type)}>
                          {event.type}
                        </Badge>
                        {event.timestamp && (
                          <span className="text-xs text-muted-foreground">
                            {new Date(event.timestamp).toLocaleTimeString()}
                          </span>
                        )}
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{event.details}</p>
                      {event.user && <p className="text-xs text-muted-foreground mt-2">By: {event.user}</p>}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <h4 className="text-sm font-medium mb-1">Action</h4>
                <p className="text-sm whitespace-pre-wrap">{entry.event}</p>
              </div>
            )}
            
            {entry.details && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-medium mb-1">Additional Details</h4>
                  <pre className="text-xs bg-muted p-2 rounded-md overflow-auto max-h-[300px]">
                    {JSON.stringify(entry.details, null, 2)}
                  </pre>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
