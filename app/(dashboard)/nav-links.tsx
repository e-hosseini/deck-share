"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderOpen, LayoutGrid, Share2, Settings } from "lucide-react";
import { SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";

export function NavLinks() {
  const pathname = usePathname();
  return (
    <>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={pathname.startsWith("/files")}>
          <Link href="/files">
            <FolderOpen />
            <span>Files</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={pathname.startsWith("/decks")}>
          <Link href="/decks">
            <LayoutGrid />
            <span>Decks</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={pathname.startsWith("/shares")}>
          <Link href="/shares">
            <Share2 />
            <span>Shares</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={pathname.startsWith("/settings")}>
          <Link href="/settings">
            <Settings />
            <span>Settings</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </>
  );
}
