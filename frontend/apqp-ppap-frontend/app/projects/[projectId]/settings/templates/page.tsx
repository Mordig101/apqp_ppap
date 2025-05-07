"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function TemplatesPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to phases templates by default
    router.push("/settings/templates/phases")
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
    </div>
  )
}
