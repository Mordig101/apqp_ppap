import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date | undefined | null): string {
  if (!date) return "N/A"

  const dateObj = typeof date === "string" ? new Date(date) : date
  return dateObj.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + "..."
}

export function getStatusColor(status: string): string {
  const statusMap: Record<string, string> = {
    "Not Started": "bg-gray-200 text-gray-800",
    "In Progress": "bg-blue-200 text-blue-800",
    "On Hold": "bg-yellow-200 text-yellow-800",
    Completed: "bg-green-200 text-green-800",
    Approved: "bg-green-300 text-green-900",
    Rejected: "bg-red-200 text-red-800",
    Cancelled: "bg-red-300 text-red-900",
    Planning: "bg-purple-200 text-purple-800",
    Archived: "bg-gray-300 text-gray-900",
    Draft: "bg-gray-200 text-gray-800",
  }

  return statusMap[status] || "bg-gray-200 text-gray-800"
}

export function calculateProgress(completed: number, total: number): number {
  if (total === 0) return 0
  return Math.round((completed / total) * 100)
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}
