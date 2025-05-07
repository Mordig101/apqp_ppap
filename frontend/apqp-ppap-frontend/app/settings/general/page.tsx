"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { authApi } from "@/config/api-utils"
import type { User } from "@/config/api-types"

export default function GeneralSettingsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [settings, setSettings] = useState({
    companyName: "APQP/PPAP Manager",
    language: "en",
    timezone: "UTC",
    dateFormat: "MM/DD/YYYY",
    emailNotifications: true,
    systemNotifications: true,
    theme: "light",
  })

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        setLoading(true)
        const userData = await authApi.getCurrentUser()
        setUser(userData)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch user data")
        console.error("Error fetching user data:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchCurrentUser()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setSettings({
      ...settings,
      [name]: value,
    })
  }

  const handleSwitchChange = (name: string, checked: boolean) => {
    setSettings({
      ...settings,
      [name]: checked,
    })
  }

  const handleSelectChange = (name: string, value: string) => {
    setSettings({
      ...settings,
      [name]: value,
    })
  }

  const handleSaveSettings = () => {
    // In a real app, this would save to the backend
    alert("Settings saved successfully")
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">General Settings</h1>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
                <CardDescription>Configure your company details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    name="companyName"
                    value={settings.companyName}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Select value={settings.language} onValueChange={(value) => handleSelectChange("language", value)}>
                      <SelectTrigger id="language">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select value={settings.timezone} onValueChange={(value) => handleSelectChange("timezone", value)}>
                      <SelectTrigger id="timezone">
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="EST">Eastern Time (EST)</SelectItem>
                        <SelectItem value="CST">Central Time (CST)</SelectItem>
                        <SelectItem value="MST">Mountain Time (MST)</SelectItem>
                        <SelectItem value="PST">Pacific Time (PST)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateFormat">Date Format</Label>
                  <Select
                    value={settings.dateFormat}
                    onValueChange={(value) => handleSelectChange("dateFormat", value)}
                  >
                    <SelectTrigger id="dateFormat">
                      <SelectValue placeholder="Select date format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>Your account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <div className="flex items-center justify-center h-24">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
                  </div>
                ) : error ? (
                  <div className="p-4 text-red-600 bg-red-100 rounded-md">{error}</div>
                ) : user ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input id="username" value={user.username} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" value={user.email} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input id="firstName" value={user.first_name} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" value={user.last_name} disabled />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">No user data available</div>
                )}

                <div className="flex justify-end">
                  <Button variant="outline">Change Password</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>Configure how you receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="emailNotifications">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                  </div>
                  <Switch
                    id="emailNotifications"
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => handleSwitchChange("emailNotifications", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="systemNotifications">System Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive notifications within the application</p>
                  </div>
                  <Switch
                    id="systemNotifications"
                    checked={settings.systemNotifications}
                    onCheckedChange={(checked) => handleSwitchChange("systemNotifications", checked)}
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Notification Types</h3>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch id="projectUpdates" defaultChecked />
                      <Label htmlFor="projectUpdates">Project updates</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="phaseChanges" defaultChecked />
                      <Label htmlFor="phaseChanges">Phase status changes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="outputAssignments" defaultChecked />
                      <Label htmlFor="outputAssignments">Output assignments</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="documentApprovals" defaultChecked />
                      <Label htmlFor="documentApprovals">Document approvals</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="deadlineReminders" defaultChecked />
                      <Label htmlFor="deadlineReminders">Deadline reminders</Label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Appearance Settings</CardTitle>
                <CardDescription>Customize the look and feel of the application</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="theme">Theme</Label>
                  <Select value={settings.theme} onValueChange={(value) => handleSelectChange("theme", value)}>
                    <SelectTrigger id="theme">
                      <SelectValue placeholder="Select theme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Dashboard Layout</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="border rounded-md p-4 cursor-pointer hover:border-primary">
                      <div className="h-20 bg-muted rounded-md mb-2"></div>
                      <p className="text-sm text-center">Default</p>
                    </div>
                    <div className="border rounded-md p-4 cursor-pointer hover:border-primary">
                      <div className="h-20 bg-muted rounded-md mb-2"></div>
                      <p className="text-sm text-center">Compact</p>
                    </div>
                    <div className="border rounded-md p-4 cursor-pointer hover:border-primary">
                      <div className="h-20 bg-muted rounded-md mb-2"></div>
                      <p className="text-sm text-center">Expanded</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end">
          <Button onClick={handleSaveSettings}>Save Settings</Button>
        </div>
      </div>
    </DashboardLayout>
  )
}
