"use client"

import { type LucideIcon } from "lucide-react"
import { Link, useLocation } from 'react-router-dom'

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function NavPages({
  pages,
}: {
  pages: {
    name: string
    url: string
    icon: LucideIcon
  }[]
}) {
  const location = useLocation()
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  return (
    <SidebarGroup>
      {!isCollapsed && <SidebarGroupLabel>Navigation</SidebarGroupLabel>}
      <SidebarMenu>
        {pages.map((item) => {
          const isActive = location.pathname === item.url ||
            (item.url !== '/' && location.pathname.startsWith(item.url))

          const menuButton = (
            <SidebarMenuButton asChild isActive={isActive}>
              <Link to={item.url} className="relative">
                <div className="nav-icon-wrapper shrink-0">
                  <item.icon />
                </div>
                {!isCollapsed && (
                  <span className="text-sidebar-foreground">
                    {item.name}
                  </span>
                )}
              </Link>
            </SidebarMenuButton>
          )

          return (
            <SidebarMenuItem key={item.name}>
              {isCollapsed ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    {menuButton}
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8}>
                    {item.name}
                  </TooltipContent>
                </Tooltip>
              ) : (
                menuButton
              )}
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
