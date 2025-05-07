"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function SettingsPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to general settings by default
    router.push("/settings/general")
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
    </div>
  )
}
