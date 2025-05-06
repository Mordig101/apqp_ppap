"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Output } from "@/config/api-types"
import { getStatusColor } from "@/lib/utils"

interface OutputAreaProps {
  outputs: Output[]
  selectedOutput: Output | null
  onSelectOutput: (output: Output) => void
}

export function OutputArea({ outputs, selectedOutput, onSelectOutput }: OutputAreaProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">Outputs (Editable)</CardTitle>
      </CardHeader>
      <CardContent>
        {outputs.length === 0 ? (
          <p className="text-gray-500">No outputs available</p>
        ) : (
          <div className="space-y-2">
            {outputs.map((output) => (
              <div
                key={output.id}
                className={`p-3 rounded-md cursor-pointer transition-colors ${
                  selectedOutput?.id === output.id
                    ? "bg-blue-100 border border-blue-300"
                    : "bg-gray-50 hover:bg-gray-100 border border-gray-200"
                }`}
                onClick={() => onSelectOutput(output)}
              >
                <div className="flex justify-between items-start">
                  <h3 className="font-medium">{output.template_details?.name || "Unnamed Output"}</h3>
                  <Badge className={getStatusColor(output.status)}>{output.status}</Badge>
                </div>
                <p className="text-sm text-gray-500 mt-1">{output.user_details?.username || "Unassigned"}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
