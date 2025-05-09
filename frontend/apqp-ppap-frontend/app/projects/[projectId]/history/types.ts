export interface HistoryEvent {
  type: string;
  details: string;
  timestamp?: string;
  user?: string;
}

export interface HistoryEntry {
  id: string;
  title?: string;
  event: string;
  events?: HistoryEvent[];
  created_at: string;
  created_by?: string;
  table_name?: string;
  record_id?: string;
  project_id?: string;
  
  // Additional properties for nested history context
  sourceName?: string;
  sourceId?: string;
  sourceType?: string;
  parentName?: string;
  grandparentName?: string;
}

export interface NestedHistoryDocument {
  name: string;
  history: HistoryEntry[];
}

export interface NestedHistoryOutput {
  name: string;
  history: HistoryEntry[];
  documents: {
    [documentId: string]: NestedHistoryDocument;
  };
}

export interface NestedHistoryPhase {
  name: string;
  history: HistoryEntry[];
  outputs: {
    [outputId: string]: NestedHistoryOutput;
  };
}

export interface NestedHistoryPerson {
  name: string;
  history: HistoryEntry[];
}

export interface NestedHistoryUser {
  id: number;
  username: string;
  history: HistoryEntry[];
}

export interface NestedHistory {
  project: HistoryEntry[];
  ppap: {
    history: HistoryEntry[];
    phases: {
      [phaseId: string]: NestedHistoryPhase;
    };
  };
  team: {
    history: HistoryEntry[];
    persons: {
      [personId: string]: NestedHistoryPerson;
    };
  };
  users: NestedHistoryUser[];
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
