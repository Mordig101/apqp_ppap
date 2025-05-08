import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { DashboardLayout } from "@/components/layout/dashboard-layout"

export default function ProgressLoading() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-2 w-full" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array(4)
                  .fill(0)
                  .map((_, i) => (
                    <Card key={i}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <Skeleton className="h-4 w-24 mb-2" />
                            <Skeleton className="h-8 w-12" />
                          </div>
                          <Skeleton className="h-8 w-8 rounded-full" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>

              <div>
                <Skeleton className="h-6 w-40 mb-4" />
                <div className="space-y-2">
                  {Array(3)
                    .fill(0)
                    .map((_, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-muted rounded-md">
                        <div>
                          <Skeleton className="h-5 w-32 mb-2" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                        <Skeleton className="h-8 w-8 rounded-full" />
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array(3)
                  .fill(0)
                  .map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-muted rounded-md">
                      <div>
                        <Skeleton className="h-5 w-32 mb-2" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <Skeleton className="h-8 w-16" />
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array(3)
                  .fill(0)
                  .map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-muted rounded-md">
                      <div>
                        <Skeleton className="h-5 w-32 mb-2" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <Skeleton className="h-8 w-16" />
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
