"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { authApi } from "@/config/api-utils"
import Link from "next/link"

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null)

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem("auth_token")
    if (token) {
      // Verify token validity by fetching user data
      authApi
        .getCurrentUser()
        .then(() => {
          router.push("/dashboard")
        })
        .catch(() => {
          // If token is invalid, remove it
          localStorage.removeItem("auth_token")
        })
    }
  }, [router])

  // Check URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isRegistered = params.get('registered') === 'true';
    const isPending = params.get('pending') === 'true';
    
    if (isRegistered && isPending) {
      setMessage({
        type: 'info',
        text: 'Your registration is pending approval. An administrator will review your account soon.'
      });
    } else if (isRegistered) {
      setMessage({
        type: 'success',
        text: 'Registration successful! You can now log in.'
      });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      await authApi.login(username, password)
      router.push("/dashboard")
    } catch (err: any) {
      console.error("Login error:", err)
      setError(err.message || "Invalid username or password")
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-4">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">APQP/PPAP Manager</CardTitle>
            <CardDescription className="text-center">Enter your credentials to sign in to your account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="p-3 text-sm text-red-600 bg-red-100 rounded-md">{error}</div>}
              {message && <div className={`p-3 text-sm rounded-md ${message.type === 'info' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>{message.text}</div>}
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium">
                  Username
                </label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                    Signing in...
                  </span>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-3">
            <div className="text-center text-sm">
              Don't have an account?{" "}
              <Link href="/register" className="text-primary hover:underline">
                Register
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
