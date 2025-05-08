"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import type { FilterProps } from "../types"

export default function HistoryFilters({ dateRange, actionType, searchQuery, onFilterChange }: FilterProps) {
  const [localDateRange, setLocalDateRange] = useState<{ from?: Date; to?: Date }>(dateRange)
  const [localActionType, setLocalActionType] = useState<string | null>(actionType)
  const [localSearchQuery, setLocalSearchQuery] = useState<string>(searchQuery)
  const [datePickerOpen, setDatePickerOpen] = useState<boolean>(false)

  useEffect(() => {
    setLocalDateRange(dateRange)
    setLocalActionType(actionType)
    setLocalSearchQuery(searchQuery)
  }, [dateRange, actionType, searchQuery])

  const handleDateRangeChange = (range: { from?: Date; to?: Date }) => {
    setLocalDateRange(range)
    onFilterChange(range, localActionType, localSearchQuery)
  }

  const handleActionTypeChange = (value: string) => {
    const newActionType = value === "all" ? null : value
    setLocalActionType(newActionType)
    onFilterChange(localDateRange, newActionType, localSearchQuery)
  }

  const handleSearchQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearchQuery(e.target.value)
    onFilterChange(localDateRange, localActionType, e.target.value)
  }

  const clearFilters = () => {
    setLocalDateRange({})
    setLocalActionType(null)
    setLocalSearchQuery("")
    onFilterChange({}, null, "")
  }

  const actionTypes = [
    { value: "all", label: "All Actions" },
    { value: "create", label: "Create" },
    { value: "update", label: "Update" },
    { value: "delete", label: "Delete" },
    { value: "status_change", label: "Status Change" },
    { value: "complete", label: "Complete" },
    { value: "assign", label: "Assign" },
    { value: "upload", label: "Upload" },
    { value: "download", label: "Download" },
    { value: "review", label: "Review" },
    { value: "approve", label: "Approve" },
    { value: "reject", label: "Reject" },
  ]

  const hasActiveFilters = localDateRange.from || localDateRange.to || localActionType || localSearchQuery.length > 0

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-1/3">
          <Label htmlFor="date-range" className="mb-2 block text-sm">
            Date Range
          </Label>
          <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button
                id="date-range"
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !localDateRange.from && !localDateRange.to && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {localDateRange.from ? (
                  localDateRange.to ? (
                    <>
                      {format(localDateRange.from, "LLL dd, y")} - {format(localDateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(localDateRange.from, "LLL dd, y")
                  )
                ) : (
                  "Select date range"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={localDateRange.from}
                selected={localDateRange}
                onSelect={(range) => {
                  handleDateRangeChange(range || {})
                  if (range?.to) {
                    setDatePickerOpen(false)
                  }
                }}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="w-full md:w-1/3">
          <Label htmlFor="action-type" className="mb-2 block text-sm">
            Action Type
          </Label>
          <Select value={localActionType || "all"} onValueChange={handleActionTypeChange}>
            <SelectTrigger id="action-type" className="w-full">
              <SelectValue placeholder="Select action type" />
            </SelectTrigger>
            <SelectContent>
              {actionTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-full md:w-1/3">
          <Label htmlFor="search" className="mb-2 block text-sm">
            Search
          </Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              type="search"
              placeholder="Search history..."
              className="pl-8"
              value={localSearchQuery}
              onChange={handleSearchQueryChange}
            />
          </div>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">Showing filtered results</div>
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 gap-1">
            <X className="h-4 w-4" />
            Clear filters
          </Button>
        </div>
      )}
    </div>
  )
}
