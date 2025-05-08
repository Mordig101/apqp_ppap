export interface HistoryEvent {
    type: string
    details: string
    timestamp?: string
    user?: string
    changes?: Record<string, any>
  }
  
  export interface HistoryEntry {
    id: string
    title: string
    event: string
    table_name: string
    created_at: string
    events?: HistoryEvent[]
    user?: string
    project_id?: number
  }
  
  export interface FilterProps {
    dateRange: { from?: Date; to?: Date }
    actionType: string | null
    searchQuery: string
    onFilterChange: (dateRange: { from?: Date; to?: Date }, actionType: string | null, searchQuery: string) => void
  }
  
  export type ActionType =
    | "create"
    | "update"
    | "delete"
    | "status_change"
    | "complete"
    | "assign"
    | "upload"
    | "download"
    | "review"
    | "approve"
    | "reject"
  