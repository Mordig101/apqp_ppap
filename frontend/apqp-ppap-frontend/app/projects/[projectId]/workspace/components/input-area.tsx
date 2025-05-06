"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Output } from "@/config/api-types"

interface InputAreaProps {
  inputs: Output[]
  selectedInput: Output | null
  onSelectInput: (input: Output) => void
}

export function InputArea({ inputs, selectedInput, onSelectInput }: InputAreaProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">Inputs (Read Only)</CardTitle>
      </CardHeader>
      <CardContent>
        {inputs.length === 0 ? (
          <p className="text-gray-500">No inputs available</p>
        ) : (
          <div className="space-y-2">
            {inputs.map((input) => (
              <div
                key={input.id}
                className={`p-3 rounded-md cursor-pointer transition-colors ${
                  selectedInput?.id === input.id
                    ? "bg-blue-100 border border-blue-300"
                    : "bg-gray-50 hover:bg-gray-100 border border-gray-200"
                }`}
                onClick={() => onSelectInput(input)}
              >
                <h3 className="font-medium">{input.template_details?.name || "Unnamed Input"}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {input.status} • {input.user_details?.username || "Unassigned"}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
