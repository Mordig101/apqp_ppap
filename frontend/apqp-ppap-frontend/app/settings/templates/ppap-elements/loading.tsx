import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function PPAPElementsLoading() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-64" />
        </div>

        <Tabs defaultValue="ppap-elements" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="phases">Phases</TabsTrigger>
            <TabsTrigger value="outputs">Outputs</TabsTrigger>
            <TabsTrigger value="ppap-elements">PPAP Elements</TabsTrigger>
          </TabsList>

          <TabsContent value="ppap-elements" className="space-y-4 mt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <Skeleton className="h-10 w-full sm:w-64" />
              <Skeleton className="h-10 w-full sm:w-48" />
            </div>

            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-4 w-60" />
                      <Skeleton className="h-4 w-8" />
                      <Skeleton className="h-4 w-8" />
                      <Skeleton className="h-4 w-8" />
                      <Skeleton className="h-4 w-8" />
                      <Skeleton className="h-4 w-8" />
                      <Skeleton className="h-8 w-8" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
