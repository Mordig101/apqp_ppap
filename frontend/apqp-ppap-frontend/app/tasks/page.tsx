"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, ArrowLeft } from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import type { TodoSummary, User } from "@/config/api-types"
import { todoApi, authApi } from "@/config/api-utils"

export default function TasksPage() {
  const [userTodos, setUserTodos] = useState<TodoSummary[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserAndTasks = async () => {
      try {
        setLoading(true)
        
        // Get current user
        const user = await authApi.getCurrentUser()
        setCurrentUser(user)
        
        // If user is logged in, fetch their todos
        if (user && user.id) {
          const todos = await todoApi.getUserTodos(user.id)
          setUserTodos(todos)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch tasks")
        console.error("Error fetching task data:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchUserAndTasks()
  }, [])

  // Get appropriate color for status badge
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Planning":
        return "bg-blue-100 text-blue-800"
      case "In Progress":
        return "bg-yellow-100 text-yellow-800"
      case "On Hold":
        return "bg-orange-100 text-orange-800"
      case "Completed":
        return "bg-green-100 text-green-800"
      case "Archived":
        return "bg-gray-100 text-gray-800"
      case "Not Started":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Get appropriate color for role badge
  const getRoleColor = (role: string) => {
    switch (role) {
      case "contributor":
        return "bg-blue-100 text-blue-800"
      case "reviewer":
        return "bg-purple-100 text-purple-800"
      case "approver":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-10">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-500 mb-2" />
          <p>Loading tasks...</p>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="text-center py-10 text-red-500">{error}</div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">My Tasks</h1>
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>All Tasks</CardTitle>
              {currentUser && (
                <span className="text-sm text-gray-500">
                  {userTodos.length} task{userTodos.length !== 1 ? 's' : ''} assigned to {currentUser.username}
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {userTodos.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">You don't have any tasks assigned to you.</p>
                <Link href="/dashboard">
                  <Button variant="secondary">Return to Dashboard</Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="py-2 px-4 font-medium">Task</th>
                      <th className="py-2 px-4 font-medium">Project</th>
                      <th className="py-2 px-4 font-medium">Phase</th>
                      <th className="py-2 px-4 font-medium">Role</th>
                      <th className="py-2 px-4 font-medium">Status</th>
                      <th className="py-2 px-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userTodos.map((todo) => (
                      <tr key={todo.id} className="border-b hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <Link href={`/projects/${todo.project_id}/workspace?output=${todo.output_id}`} className="font-medium hover:underline text-blue-600">
                            {todo.output_name}
                          </Link>
                        </td>
                        <td className="py-4 px-4">{todo.project_name}</td>
                        <td className="py-4 px-4">{todo.phase_name}</td>
                        <td className="py-4 px-4">
                          <Badge className={getRoleColor(todo.role)}>{todo.role_display}</Badge>
                        </td>
                        <td className="py-4 px-4">
                          <Badge className={getStatusColor(todo.status)}>{todo.status}</Badge>
                        </td>
                        <td className="py-4 px-4">
                          <Link href={`/projects/${todo.project_id}/workspace?output=${todo.output_id}`}>
                            <Button size="sm">View</Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {userTodos.length > 0 && (
          <>
            <h2 className="text-xl font-bold mt-8">Task Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Task stats cards */}
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">
                    {userTodos.filter(t => t.status === "In Progress").length}
                  </div>
                  <p className="text-sm text-gray-500">In Progress</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">
                    {userTodos.filter(t => t.status === "Completed").length}
                  </div>
                  <p className="text-sm text-gray-500">Completed</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">
                    {userTodos.filter(t => t.role === "reviewer").length}
                  </div>
                  <p className="text-sm text-gray-500">Review Tasks</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">
                    {userTodos.filter(t => t.role === "approver").length}
                  </div>
                  <p className="text-sm text-gray-500">Approval Tasks</p>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}