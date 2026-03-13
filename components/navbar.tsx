"use client";

import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Image from "next/image";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import type { Profile } from "@/lib/types";

interface NavbarProps {
  profile: Profile;
}

function getPageTitle(pathname: string): string {
  if (pathname === "/dashboard") return "EarlyBird";
  if (pathname.startsWith("/orders/history")) return "Order History";
  if (pathname === "/admin/dashboard") return "Dashboard";
  if (pathname === "/admin/orders") return "Orders";
  if (pathname === "/admin/menu") return "Menu";
  if (pathname === "/admin/users") return "Users";
  return "EarlyBird";
}

export function Navbar({ profile }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const pageTitle = getPageTitle(pathname);
  const initial = (profile.full_name || "U").charAt(0).toUpperCase();

  async function handleSignOut() {
    await supabase.auth.signOut();
    toast.success("Signed out");
    router.push("/");
    router.refresh();
  }

  // Mobile-only top header — desktop navigation is handled by the Sidebar
  return (
    <header className="md:hidden sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      {/* Fills the iOS status bar area with the theme color (transparent status bar shows whatever is behind it) */}
      <div className="h-[env(safe-area-inset-top)] bg-primary" />
      <div className="flex items-center h-14 px-4">
        <div className="w-10 flex items-center">
          <Image src="/logo.png" alt="EarlyBird" width={24} height={24} className="rounded" />
        </div>
        <div className="flex-1 text-center">
          <span className="font-semibold text-sm">{pageTitle}</span>
        </div>
        <div className="w-10 flex items-center justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                {initial}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="font-normal">
                <div className="text-sm font-medium">{profile.full_name || "User"}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {Number(profile.balance).toLocaleString()} UGX
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
