import { User, LogOut, Moon, Sun, Monitor, ChevronUp } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import { useTheme } from '@/components/theme-provider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import useUserStore from '@/store/UserStore.ts';

export function NavUser() {
  const navigate = useNavigate();
  const { isMobile, state } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const { logout, user } = useUserStore();
  const { theme, setTheme } = useTheme();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const menuButton = (
    <SidebarMenuButton
      size="lg"
      className={`data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:cursor-pointer sidebar-card ${isCollapsed ? '!p-2 justify-center' : '!p-3'}`}
    >
      <Avatar className={`rounded-lg ring-2 ring-sidebar-primary/30 shrink-0 ${isCollapsed ? 'h-8 w-8' : 'h-9 w-9'}`}>
        <AvatarImage alt={`${user!.firstName} ${user!.lastName}`} />
        <AvatarFallback className="rounded-lg bg-sidebar-primary text-sidebar-primary-foreground font-medium">
          {`${user!.firstName[0]}${user!.lastName[0]}`}
        </AvatarFallback>
      </Avatar>
      {!isCollapsed && (
        <>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium text-sidebar-foreground">
              {user!.firstName} {user!.lastName}
            </span>
            <span className="truncate text-xs text-sidebar-muted">{user!.email}</span>
          </div>
          <ChevronUp className="ml-auto h-4 w-4 text-sidebar-muted transition-transform group-data-[state=open]:rotate-180" />
        </>
      )}
    </SidebarMenuButton>
  );

  const dropdownTrigger = isCollapsed ? (
    <Tooltip>
      <TooltipTrigger asChild>
        <DropdownMenuTrigger asChild>
          {menuButton}
        </DropdownMenuTrigger>
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={8}>
        {user!.firstName} {user!.lastName}
      </TooltipContent>
    </Tooltip>
  ) : (
    <DropdownMenuTrigger asChild>
      {menuButton}
    </DropdownMenuTrigger>
  );

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          {dropdownTrigger}
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-xl border-sidebar-border bg-card/95 backdrop-blur-xl"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={8}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-3 px-2 py-2.5 text-left text-sm">
                <Avatar className="h-10 w-10 rounded-lg ring-2 ring-primary/20">
                  <AvatarImage alt={`${user!.firstName} ${user!.lastName}`} />
                  <AvatarFallback className="rounded-lg bg-primary text-primary-foreground font-medium">
                    {`${user!.firstName[0]}${user!.lastName[0]}`}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {user!.firstName} {user!.lastName}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">{user!.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <Link to="/account">
                <DropdownMenuItem className="cursor-pointer rounded-lg">
                  <User className="h-4 w-4" />
                  Mon compte
                </DropdownMenuItem>
              </Link>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="cursor-pointer rounded-lg">
                  {theme === 'light' && <Sun className="mr-2 h-4 w-4" />}
                  {theme === 'dark' && <Moon className="mr-2 h-4 w-4" />}
                  {theme === 'system' && <Monitor className="mr-2 h-4 w-4" />}
                  Thème
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="rounded-xl border-sidebar-border bg-card/95 backdrop-blur-xl">
                  <DropdownMenuItem onClick={() => setTheme('light')} className="cursor-pointer rounded-lg">
                    <Sun className="mr-2 h-4 w-4" />
                    Clair
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme('dark')} className="cursor-pointer rounded-lg">
                    <Moon className="mr-2 h-4 w-4" />
                    Sombre
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme('system')} className="cursor-pointer rounded-lg">
                    <Monitor className="mr-2 h-4 w-4" />
                    Système
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer rounded-lg text-destructive focus:text-destructive">
              <LogOut className="h-4 w-4" />
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
