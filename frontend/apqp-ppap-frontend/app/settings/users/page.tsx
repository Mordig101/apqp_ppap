"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UsersTab } from "./users"
import { ClientsTab } from "./clients"
import { TeamsTab } from "./teams"

export default function UsersAndClientsPage() {
  const [activeTab, setActiveTab] = useState("users")

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid grid-cols-4 w-[800px]">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="clients">Clients</TabsTrigger>
            <TabsTrigger value="client-teams">Client Teams</TabsTrigger>
            <TabsTrigger value="organization-teams">Organization Teams</TabsTrigger>
          </TabsList>

          {/* USERS TAB */}
          <TabsContent value="users" className="space-y-4 mt-6">
            <UsersTab />
          </TabsContent>

          {/* CLIENTS TAB */}
          <TabsContent value="clients" className="space-y-4 mt-6">
            <ClientsTab />
          </TabsContent>
          
          {/* CLIENT TEAMS TAB */}
          <TabsContent value="client-teams" className="space-y-4 mt-6">
            <TeamsTab teamType="client" />
          </TabsContent>
          
          {/* ORGANIZATION TEAMS TAB */}
          <TabsContent value="organization-teams" className="space-y-4 mt-6">
            <TeamsTab teamType="organization" />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
