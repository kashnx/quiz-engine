"use client"

import Link from "next/link";
import { UserCircle, LogIn, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import {
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

export function NavUser({
  isActive,
  className,
}: {
  isActive?: boolean
  className?: string
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <SidebarMenuItem className={className}>
        <SidebarMenuButton
          size="lg"
          className={cn("justify-start", className)}
          disabled
        >
          <Loader2 className="h-5 w-5 shrink-0 animate-spin mr-3" />
          <span className="font-medium truncate">Loading...</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  if (!user) {
    return (
      <SidebarMenuItem className={className}>
        <SidebarMenuButton
          asChild
          size="lg"
          isActive={isActive}
          tooltip="Login"
          className={cn("justify-start", className)}
        >
          <Link href="/login">
            <LogIn className="h-5 w-5 shrink-0 mr-3" />
            <span className="font-medium truncate">Login</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuItem className={className}>
      <SidebarMenuButton
        asChild
        size="lg"
        isActive={isActive}
        tooltip="Profile"
        className={cn("justify-start", className)}
      >
        <Link href="/profile">
          <Avatar className="h-5 w-5 shrink-0 mr-3">
            {user.photoURL && <AvatarImage src={user.photoURL} alt={user.displayName || "User"} />}
            <AvatarFallback>
              {user.displayName 
                ? user.displayName.substring(0,1).toUpperCase() 
                : <UserCircle className="h-5 w-5" />}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium truncate">Profile</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}