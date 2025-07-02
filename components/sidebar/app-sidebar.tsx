
"use client"

import * as React from "react"
import { usePathname } from 'next/navigation'
import Link from "next/link";
import {
    Home,
    ListChecks,
    PlusCircle,
    BarChartHorizontalBig, // Changed icon
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context";

import {NavUser} from '@/components/sidebar/nav-user'
import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarRail,
} from '@/components/ui/sidebar'


export function AppSidebar({...props}: React.ComponentProps<typeof Sidebar>) {
    const pathname = usePathname();
    const { user } = useAuth(); 

    const mainNavItems = [
        {
            title: "Home",
            url: "/",
            icon: Home,
            isActive: pathname === '/',
        },
        {
            title: "My Quizzes",
            url: "/my-quizzes",
            icon: ListChecks,
            isActive: pathname === '/my-quizzes' || pathname.startsWith('/quiz/'),
        },
        {
            title: "Create Quiz",
            url: "/create-quiz",
            icon: PlusCircle,
            isActive: pathname === '/create-quiz',
        },
        {
            title: "History",
            url: "/history",
            icon: BarChartHorizontalBig,
            isActive: pathname === '/history',
        }
    ];

    const isProfileLoginSectionActive = user 
        ? (pathname === '/profile' || pathname.startsWith('/account-settings'))
        : pathname === '/login';

    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader className="mb-4">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            className="!p-3 !h-auto hover:bg-transparent active:bg-transparent data-[active=true]:bg-transparent data-[active=true]:border-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                        >
                            <Link href="/" className="flex items-center gap-3">
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="!size-9 text-primary shrink-0">
                                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                <span className="text-3xl font-bold text-primary">Quizify</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <SidebarMenu>
                    {mainNavItems.map((item) => (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                asChild
                                tooltip={item.title}
                                isActive={item.isActive}
                                size="lg"
                            >
                                <Link href={item.url}>
                                    {item.icon && <item.icon className="size-6 shrink-0" />}
                                    <span className="font-medium">{item.title}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                    <NavUser isActive={isProfileLoginSectionActive} />
                </SidebarMenu>
            </SidebarContent>
            <SidebarRail/>
        </Sidebar>
    )
}
