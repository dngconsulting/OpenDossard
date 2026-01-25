'use client';

import { type LucideIcon } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import useUserStore from '@/store/UserStore';

type PageItem = {
  name: string;
  url: string;
  icon: LucideIcon;
  requiredRoles?: string[];
};

export function NavPages({
  pages,
}: {
  pages: PageItem[];
}) {
  const location = useLocation();
  const { state } = useSidebar();
  const user = useUserStore(s => s.user);
  const isCollapsed = state === 'collapsed';

  // Filter pages based on user roles
  const visiblePages = pages.filter(page => {
    if (!page.requiredRoles || page.requiredRoles.length === 0) {
      return true;
    }
    if (!user?.roles) {
      return false;
    }
    return page.requiredRoles.some(role => user.roles.includes(role));
  });

  return (
    <SidebarGroup>
      {!isCollapsed && <SidebarGroupLabel>Navigation</SidebarGroupLabel>}
      <SidebarMenu>
        {visiblePages.map(item => {
          const isActive =
            location.pathname === item.url ||
            (item.url !== '/' && location.pathname.startsWith(item.url));

          const menuButton = (
            <SidebarMenuButton asChild isActive={isActive}>
              <Link to={item.url} className="relative">
                <div className="nav-icon-wrapper shrink-0">
                  <item.icon />
                </div>
                {!isCollapsed && <span className="text-sidebar-foreground">{item.name}</span>}
              </Link>
            </SidebarMenuButton>
          );

          return (
            <SidebarMenuItem key={item.name}>
              {isCollapsed ? (
                <Tooltip>
                  <TooltipTrigger asChild>{menuButton}</TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8}>
                    {item.name}
                  </TooltipContent>
                </Tooltip>
              ) : (
                menuButton
              )}
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
