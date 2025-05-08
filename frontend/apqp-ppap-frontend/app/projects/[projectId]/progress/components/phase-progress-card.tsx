"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDate, getStatusColor } from "@/lib/utils"
import { ChevronRight } from "lucide-react"
import type { Phase } from "@/config/api-types"

interface PhaseProgressCardProps {
  phase: Phase
  progress: number
  onViewPhase: (phaseId: number) => void
}

export function PhaseProgressCard({ phase, progress, onViewPhase }: PhaseProgressCardProps) {
  const isOverdue = phase.deadline && new Date(phase.deadline) < new Date() && phase.status !== "Completed"

  return (
    <Card className={isOverdue ? "border-red-300" : ""}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-base">{phase.template_details?.name || `Phase ${phase.id}`}</CardTitle>
          <Badge className={getStatusColor(phase.status)}>{phase.status}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-xs text-muted-foreground">Progress</span>
              <span className="text-xs font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Start Date</p>
              <p className="font-medium">{formatDate(phase.started_at) || "Not started"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Deadline</p>
              <p className={`font-medium ${isOverdue ? "text-red-600" : ""}`}>
                {formatDate(phase.deadline) || "Not set"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Responsible</p>
              <p className="font-medium truncate">
                {phase.responsible_details
                  ? `${phase.responsible_details.person_details?.first_name || ""} ${phase.responsible_details.person_details?.last_name || ""}`
                  : "Unassigned"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Outputs</p>
              <p className="font-medium">{phase.outputs?.length || 0}</p>
            </div>
          </div>

          <Button variant="outline" size="sm" className="w-full" onClick={() => onViewPhase(phase.id)}>
            View Details
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
