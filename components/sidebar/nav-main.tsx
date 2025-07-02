"use client"

import type { LucideIcon } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
  }[]
}) {
  // Cyberpunk color scheme
  const activeColor = "#00f0ff";
  const inactiveColor = "#6b7280";
  const hoverColor = "#ff4d00";

  return (
    <SidebarGroup className="relative">
      {/* Animated scan line effect */}
      <motion.div 
        className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_95%,#00f0ff22_5%)] bg-[length:100%_4px] pointer-events-none"
        animate={{
          backgroundPosition: ["0 0", "0 100%"],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              asChild
              tooltip={item.title}
              isActive={item.isActive}
              className={cn(
                "relative overflow-hidden",
                "transition-all duration-300",
                "hover:bg-black/50 hover:text-[#ff4d00]",
                "data-[active=true]:text-[#00f0ff]",
                "data-[active=true]:bg-gradient-to-r",
                "data-[active=true]:from-black/30",
                "data-[active=true]:to-transparent",
                "group" // For group-hover effects
              )}
            >
              <Link href={item.url} className="relative z-10 flex items-center gap-3">
                {/* Icon with hover glow */}
                {item.icon && (
                  <motion.div
                    animate={{
                      color: item.isActive ? activeColor : inactiveColor,
                    }}
                    whileHover={{ 
                      scale: 1.1,
                      color: hoverColor,
                    }}
                  >
                    <item.icon className="size-5" />
                  </motion.div>
                )}
                
                {/* Text with digital font */}
                <motion.span
                  className={cn(
                    "font-mono uppercase tracking-wider text-sm",
                    item.isActive ? "text-[#00f0ff]" : "text-gray-400"
                  )}
                  animate={{
                    textShadow: item.isActive 
                      ? [`0 0 5px ${activeColor}`, `0 0 15px ${activeColor}`, `0 0 5px ${activeColor}`] 
                      : "none"
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                  }}
                >
                  {item.title}
                </motion.span>

                {/* Active indicator - animated pulse */}
                {item.isActive && (
                  <motion.div
                    className="absolute right-4 h-2 w-2 rounded-full bg-[#00f0ff]"
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [0.7, 1, 0.7],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                    }}
                  />
                )}

                {/* Hover effect - digital trail */}
                <motion.div
                  className="absolute left-0 bottom-0 h-0.5 bg-[#ff4d00]"
                  initial={{ width: 0 }}
                  whileHover={{ width: "100%" }}
                  transition={{ duration: 0.3 }}
                />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>

      {/* Subtle binary code animation in background */}
      <div className="absolute inset-0 overflow-hidden opacity-10 pointer-events-none">
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-[linear-gradient(to_top,#000,transparent)] z-20" />
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-[8px] text-[#00f0ff] font-mono"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -100],
              opacity: [0, 0.7, 0],
            }}
            transition={{
              duration: 10 + Math.random() * 20,
              repeat: Infinity,
              delay: Math.random() * 5,
            }}
          >
            {Math.random() > 0.5 ? "1" : "0"}
          </motion.div>
        ))}
      </div>
    </SidebarGroup>
  )
}