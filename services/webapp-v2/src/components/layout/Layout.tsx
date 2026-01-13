import {Menu} from 'lucide-react';
import * as React from 'react';

import {AppSidebar} from '@/components/layout/AppSidebar.tsx';
import {Button} from '@/components/ui/button.tsx';
import {Separator} from '@/components/ui/separator';
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
    useSidebar,
} from '@/components/ui/sidebar';
import {useIsMobile} from '@/hooks/use-mobile.ts';
import {appData} from '@/statics/app-data.ts';

function MobileHeader({title}: { title: string }) {
    const {toggleSidebar} = useSidebar();

    return (
        <div className="flex items-center gap-2 px-4 w-full">
            <Button
                variant="ghost"
                size="icon"
                className="header-icon size-8"
                onClick={toggleSidebar}
            >
                <Menu className="size-5"/>
            </Button>

            <h1 className="flex-1">{title}</h1>

            <img src={appData.app.logoUrl} alt="logo" className="h-8 w-auto"/>
        </div>
    );
}

function DesktopHeader({title}: { title: string }) {
    return (
        <div className="flex items-center gap-2 px-4 w-full">
            <SidebarTrigger className="header-icon -ml-1"/>
            <Separator
                orientation="vertical"
                className="header-separator mr-2 data-[orientation=vertical]:h-4"
            />
            <h1 className="flex-1">{title}</h1>
        </div>
    );
}

type LayoutProps = {
    children: React.ReactNode;
    title: string;
    toolbar?: React.ReactNode;
    toolbarLeft?: React.ReactNode;
};

export default function Layout({children, title, toolbar, toolbarLeft}: LayoutProps) {
    const isMobile = useIsMobile();

    return (
        <SidebarProvider>
            <AppSidebar/>
            <SidebarInset>
                <header
                    className="header-sidebar flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                    {isMobile ? <MobileHeader title={title}/> : <DesktopHeader title={title}/>}
                </header>
                {(toolbar || toolbarLeft) && (
                    <div className="toolbar-area flex items-center gap-2 px-4 py-2">
                        {toolbarLeft && <div className="flex-1">{toolbarLeft}</div>}
                        {!toolbarLeft && <div className="flex-1" />}
                        <div className="flex items-center gap-2">
                            {toolbar}
                        </div>
                    </div>
                )}
                <div className="flex flex-1 flex-col gap-4 p-4">
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
