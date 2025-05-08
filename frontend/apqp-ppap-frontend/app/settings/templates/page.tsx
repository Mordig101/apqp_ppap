"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"

export default function TemplatesPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to phases templates by default
    router.push("/settings/templates/phases")
  }, [router])

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Templates</h1>
        </div>

        <Tabs defaultValue="phases" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="phases" onClick={() => router.push("/settings/templates/phases")}>
              Phases
            </TabsTrigger>
            <TabsTrigger value="outputs" onClick={() => router.push("/settings/templates/outputs")}>
              Outputs
            </TabsTrigger>
            <TabsTrigger value="ppap-elements" onClick={() => router.push("/settings/templates/ppap-elements")}>
              PPAP Elements
            </TabsTrigger>
          </TabsList>

          <TabsContent value="phases" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Phase Templates</CardTitle>
                <CardDescription>Manage phase templates for APQP projects.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="outputs" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Output Templates</CardTitle>
                <CardDescription>Manage output templates for APQP projects.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ppap-elements" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>PPAP Elements</CardTitle>
                <CardDescription>Manage PPAP elements for production part approval process.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
