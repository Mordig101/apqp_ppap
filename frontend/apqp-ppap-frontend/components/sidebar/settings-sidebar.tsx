"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { 
  Sliders, Users, Shield, History, FileText, 
  Folder, FolderTree, Database
} from "lucide-react"
import { cn } from "@/lib/utils"

const settingsNavItems = [
  {
    title: "General",
    href: "/settings/general",
    icon: Sliders,
  },
  {
    title: "Users",
    href: "/settings/users",
    icon: Users,
  },
  {
    title: "Authorizations",
    href: "/settings/authorizations",
    icon: Shield,
  },
  {
    title: "History",
    href: "/settings/history",
    icon: History,
  },
  {
    title: "Templates",
    href: "/settings/templates",
    icon: FileText,
    subItems: [
      {
        title: "Phases",
        href: "/settings/templates/phases",
        icon: Folder,
      },
      {
        title: "Outputs",
        href: "/settings/templates/outputs",
        icon: FolderTree,
      },
      {
        title: "PPAP Elements",
        href: "/settings/templates/ppap-elements",
        icon: Database,
      },
    ],
  },
]

export function SettingsSidebar() {
  const pathname = usePathname()

  return (
    <div className="space-y-4">
      <div className="px-3 py-2">
        <h2 className="mb-2 px-4 text-lg font-semibold">Settings</h2>
        <div className="space-y-1">
          {settingsNavItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)
            
            return (
              <div key={item.href}>
                <Link href={item.href}>
                  <div
                    className={cn(
                      "flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                      isActive ? "bg-accent text-accent-foreground" : "transparent"
                    )}
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    <span>{item.title}</span>
                  </div>
                </Link>
                
                {isActive && item.subItems && (
                  <div className="ml-4 mt-1 space-y-1">
                    {item.subItems.map((subItem) => {
                      const isSubActive = pathname === subItem.href
                      
                      return (
                        <Link key={subItem.href} href={subItem.href}>
                          <div
                            className={cn(
                              "flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                              isSubActive ? "bg-accent text-accent-foreground" : "transparent"
                            )}
                          >
                            <subItem.icon className="mr-2 h-4 w-4" />
                            <span>{subItem.title}</span>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}