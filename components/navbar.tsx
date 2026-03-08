"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Coffee, Home, History, LayoutDashboard, Users, UtensilsCrossed, ClipboardList, LogOut } from "lucide-react";
import { toast } from "sonner";
import type { Profile } from "@/lib/types";

interface NavbarProps {
  profile: Profile;
}

const userLinks = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/orders/history", label: "Order History", icon: History },
];

const adminLinks = [
  { href: "/admin/dashboard", label: "Admin Home", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/menu", label: "Menu", icon: UtensilsCrossed },
  { href: "/admin/orders", label: "Orders", icon: ClipboardList },
];

function getPageTitle(pathname: string): string {
  if (pathname === "/dashboard") return "DevFast";
  if (pathname.startsWith("/orders/history")) return "Order History";
  if (pathname === "/admin/dashboard") return "Dashboard";
  if (pathname === "/admin/orders") return "Orders";
  if (pathname === "/admin/menu") return "Menu";
  if (pathname === "/admin/users") return "Users";
  return "DevFast";
}

export function Navbar({ profile }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const isAdmin = profile.role === "admin";
  const links = isAdmin ? [...userLinks, ...adminLinks] : userLinks;
  const pageTitle = getPageTitle(pathname);

  async function handleSignOut() {
    await supabase.auth.signOut();
    toast.success("Signed out");
    router.push("/");
    router.refresh();
  }

  const initial = (profile.full_name || "U").charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      {/* Mobile header: icon | page title | avatar */}
      <div className="md:hidden flex items-center h-14 px-4 pt-[env(safe-area-inset-top)]">
        <div className="w-10 flex items-center">
          <Coffee className="h-5 w-5 text-primary" />
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

      {/* Desktop header: logo | nav links */}
      <div className="hidden md:flex container mx-auto px-4 h-14 items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg">
          <Coffee className="h-5 w-5 text-primary" />
          <span>DevFast</span>
        </Link>

        <nav className="flex items-center gap-1">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Button
                key={link.href}
                variant={isActive ? "secondary" : "ghost"}
                size="sm"
                asChild
              >
                <Link href={link.href}>
                  <Icon className="h-4 w-4 mr-1" />
                  {link.label}
                </Link>
              </Button>
            );
          })}
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-1" />
            Sign Out
          </Button>
        </nav>
      </div>
    </header>
  );
}
