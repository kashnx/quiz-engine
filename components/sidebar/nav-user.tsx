
"use client"

import Link from "next/link";
import { UserCircle, LogIn, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar'
import {
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

export function NavUser({
  isActive,
}: {
  isActive?: boolean
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="justify-start"
          disabled
        >
          <Loader2 className="size-7 shrink-0 animate-spin" />
          <span className="font-medium truncate">Loading...</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  if (!user) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          size="lg"
          isActive={isActive} // isActive might be for /login page
          tooltip="Login"
          className="justify-start"
        >
          <Link href="/login">
            <LogIn className="size-7 shrink-0" />
            <span className="font-medium truncate">Login</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        size="lg"
        isActive={isActive} // isActive for /profile or /account-settings
        tooltip="Profile"
        className="justify-start"
      >
        <Link href="/profile">
          <Avatar className="size-7 shrink-0">
            {user.photoURL && <AvatarImage src={user.photoURL} alt={user.displayName || "User"} />}
            <AvatarFallback>
              {user.displayName ? user.displayName.substring(0,1).toUpperCase() : <UserCircle />}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium truncate">Profile</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}
