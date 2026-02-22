'use client';

import { ENV_CONFIG } from '@/config/environment.config';
import { SidebarMenu, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar';

export function AppTitle({
  app,
}: {
  app: {
    name: string;
    logoUrl: string;
    version: string;
  };
}) {
  const { state, isMobile } = useSidebar();
  const isCollapsed = !isMobile && state === 'collapsed';

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div
          className={`
          flex flex-col items-center justify-center transition-all duration-200
          ${isCollapsed ? 'py-2' : 'py-2'}
        `}
        >
          <img
            src={app.logoUrl}
            alt="logo"
            className={`object-contain transition-all duration-200 ${isCollapsed ? 'w-8 h-8' : 'w-20 h-20'}`}
          />
          {!isCollapsed && (
            <div className="-mt-1 text-center">
              <span className="block font-normal text-sidebar-foreground tracking-tight text-sm">
                {app.name}
              </span>
              <a
                href={`https://github.com/dngconsulting/OpenDossard/releases/tag/v${app.version}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-xs hover:underline"
                style={{ color: 'var(--sidebar-foreground-muted)' }}
              >
                v{app.version}
              </a>
              {ENV_CONFIG.show && (
                <span
                  className="mt-1 inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                  style={{ backgroundColor: ENV_CONFIG.color, color: '#fff' }}
                >
                  {ENV_CONFIG.name}
                </span>
              )}
            </div>
          )}
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
