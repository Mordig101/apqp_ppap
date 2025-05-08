import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList } from "@/components/ui/tabs"

export default function HistoryLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <Skeleton className="h-8 w-48" />
      </div>

      <Card>
        <CardContent className="p-6">
          <Tabs defaultValue="project" className="w-full">
            <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 mb-6">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </TabsList>

            <div className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <Skeleton className="h-10 w-full md:w-1/3" />
                <Skeleton className="h-10 w-full md:w-1/3" />
                <Skeleton className="h-10 w-full md:w-1/3" />
              </div>

              <div className="rounded-md border">
                <div className="h-10 px-4 border-b flex items-center">
                  <Skeleton className="h-4 w-full" />
                </div>

                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="p-4 border-b last:border-0">
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-4 w-5/6" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
