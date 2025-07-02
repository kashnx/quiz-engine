"use client"

import * as React from "react"
import { usePathname } from 'next/navigation'
import Link from "next/link";
import {
    Home,
    ListChecks,
    PlusCircle,
    BarChartHorizontalBig,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { NavUser } from '@/components/sidebar/nav-user'
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

    // Cyberpunk color scheme
    const activeColor = "#00f0ff";
    const inactiveColor = "#6b7280";
    const bgColor = "bg-[#0a0a0a]";
    const borderColor = "border-[#ff4d00]";

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
        <Sidebar 
            collapsible="icon" 
            className={cn(
                bgColor,
                "border-r-2",
                borderColor,
                "backdrop-blur-sm bg-opacity-80"
            )}
            {...props}
        >
            <SidebarHeader className="mb-4 border-b-2 border-[#ff4d00] pb-4">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            className="!p-3 !h-auto hover:bg-transparent active:bg-transparent data-[active=true]:bg-transparent focus-visible:ring-0"
                        >
                            <Link href="/" className="flex items-center gap-3 group">
                        
                               
                                <motion.span 
                                    className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#00f0ff] to-[#ff4d00]"
                                    animate={{
                                        textShadow: [
                                            `0 0 5px ${activeColor}`,
                                            `0 0 10px ${activeColor}`,
                                            `0 0 20px #ff4d00`,
                                            `0 0 5px ${activeColor}`,
                                        ],
                                    }}
                                    transition={{
                                        duration: 3,
                                        repeat: Infinity,
                                        repeatType: "reverse",
                                    }}
                                >
                                    QUIZENGINE
                                </motion.span>
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
                                className={cn(
                                    "hover:bg-black hover:text-[#00f0ff] transition-all",
                                    "data-[active=true]:text-[#00f0ff] data-[active=true]:border-l-4 data-[active=true]:border-[#ff4d00]",
                                    "data-[active=true]:bg-gradient-to-r data-[active=true]:from-black/30 data-[active=true]:to-transparent"
                                )}
                            >
                                <Link href={item.url}>
                                    {item.icon && (
                                        <item.icon 
                                            className={cn(
                                                "size-6 shrink-0",
                                                item.isActive ? "text-[#00f0ff]" : "text-gray-500"
                                            )} 
                                        />
                                    )}
                                    <span 
                                        className={cn(
                                            "font-mono uppercase tracking-wider",
                                            item.isActive ? "text-[#00f0ff]" : "text-gray-400"
                                        )}
                                    >
                                        {item.title}
                                    </span>
                                    {item.isActive && (
                                        <motion.div 
                                            className="absolute right-2 h-2 w-2 rounded-full bg-[#00f0ff]"
                                            animate={{
                                                opacity: [0.5, 1, 0.5],
                                                scale: [1, 1.2, 1],
                                            }}
                                            transition={{
                                                duration: 1.5,
                                                repeat: Infinity,
                                            }}
                                        />
                                    )}
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                    
                    {/* Cyberpunk-style User Section */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        <NavUser 
                            isActive={isProfileLoginSectionActive}
                            className={cn(
                                "border-t-2 mt-4 pt-4",
                                borderColor
                            )}
                        />
                    </motion.div>
                </SidebarMenu>
            </SidebarContent>

            {/* Glitch Effect Decoration */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#00f0ff] to-transparent opacity-30"/>
        </Sidebar>
    )
}