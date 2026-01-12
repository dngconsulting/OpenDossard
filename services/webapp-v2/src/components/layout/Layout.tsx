import * as React from 'react';

import {AppSidebar} from '@/components/layout/AppSidebar.tsx';
import {Separator} from '@/components/ui/separator';
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from '@/components/ui/sidebar';
import {useIsMobile} from '@/hooks/use-mobile.ts';
import {appData} from '@/statics/app-data.ts';

export default function Layout({children, title}: { children: React.ReactNode, title: string }) {
    const isMobile = useIsMobile();

    return (
        <SidebarProvider>
            <AppSidebar/>
            <SidebarInset>
                <header
                    className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                    <div className="flex items-center gap-2 px-4 w-full">
                        {
                            isMobile ? (
                                    <>
                                        <div
                                            className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg"
                                        >
                                            <img src={appData.app.logoUrl} alt="logo" className="w-3/4"/>
                                        </div>
                                        <Separator
                                            orientation="vertical"
                                            className="data-[orientation=vertical]:h-4"
                                        />
                                    </>
                                )
                                : (
                                    <>
                                        <SidebarTrigger className="-ml-1"/>
                                        <Separator
                                            orientation="vertical"
                                            className="mr-2 data-[orientation=vertical]:h-4"
                                        />
                                    </>
                                )
                        }

                        <h1 className="flex-1 hid">{title}</h1>

                        {
                            isMobile && (
                                <SidebarTrigger className="-ml-1"/>
                            )
                        }
                    </div>
                </header>
                <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
