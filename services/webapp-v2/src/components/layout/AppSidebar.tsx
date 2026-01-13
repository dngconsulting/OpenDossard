"use client"

import * as React from "react"

import { AppTitle } from "@/components/layout/AppTitle.tsx"
import { NavPages } from "@/components/navigation/NavPages.tsx"
import { NavUser } from "@/components/navigation/NavUser.tsx"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import {appData} from '@/statics/app-data.ts';


export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props} side="left">
      <SidebarHeader>
        <AppTitle app={appData.app}/>
      </SidebarHeader>
      <SidebarContent>
        <NavPages pages={appData.pages} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser/>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
