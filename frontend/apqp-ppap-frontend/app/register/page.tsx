"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { authApi, departmentApi } from "@/config/api-utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Department } from "@/config/api-types"

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    departmentId: ""
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [departments, setDepartments] = useState<Department[]>([])
  const [loadingDepartments, setLoadingDepartments] = useState(false)

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem("auth_token")
    if (token) {
      authApi
        .getCurrentUser()
        .then(() => {
          router.push("/dashboard")
        })
        .catch(() => {
          localStorage.removeItem("auth_token")
        })
    }
  }, [router])
  
  // Fetch departments for dropdown
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setLoadingDepartments(true)
        const depts = await departmentApi.getAllDepartments()
        setDepartments(depts)
      } catch (error) {
        console.error("Error fetching departments:", error)
      } finally {
        setLoadingDepartments(false)
      }
    }
    
    fetchDepartments()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value })
  }
  
  const handleSelectChange = (value: string, field: string) => {
    setFormData({ ...formData, [field]: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    // Validation checks
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }
    
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long")
      return
    }

    setLoading(true)

    try {
      const response = await authApi.register(
        formData.username,
        formData.email, 
        formData.password,
        formData.firstName,
        formData.lastName,
        formData.phone,
        formData.address,
        formData.departmentId ? parseInt(formData.departmentId) : undefined
      )
      
      // Show success message and redirect
      router.push("/login?registered=true&pending=true")
    } catch (err: any) {
      console.error("Registration error:", err)
      setError(err.message || "Registration failed. Please try again.")
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-4">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Create an Account</CardTitle>
            <CardDescription className="text-center">Enter your information to register</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="p-3 text-sm text-red-600 bg-red-100 rounded-md">{error}</div>}
              
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium">
                  Username
                </label>
                <Input
                  id="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="firstName" className="text-sm font-medium">
                    First Name
                  </label>
                  <Input
                    id="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="lastName" className="text-sm font-medium">
                    Last Name
                  </label>
                  <Input
                    id="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium">
                  Phone Number
                </label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="address" className="text-sm font-medium">
                  Address
                </label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="departmentId" className="text-sm font-medium">
                  Department
                </label>
                <Select 
                  onValueChange={(value) => handleSelectChange(value, "departmentId")}
                  value={formData.departmentId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingDepartments ? "Loading departments..." : "Select department"} />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map(dept => (
                      <SelectItem key={dept.id} value={dept.id.toString()}>
                        {dept.name} {dept.responsible ? `(${dept.id})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium">
                  Confirm Password
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Registering...
                  </span>
                ) : (
                  "Register"
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-3">
            <div className="text-center text-sm">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </div>
            <p className="text-sm text-gray-500">
              Advanced Product Quality Planning and Production Part Approval Process
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}