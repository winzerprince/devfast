"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Coffee, Home, History, LayoutDashboard, Users, UtensilsCrossed, ClipboardList, Menu, LogOut } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
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

export function Navbar({ profile }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);

  const isAdmin = profile.role === "admin";
  const links = isAdmin ? [...userLinks, ...adminLinks] : userLinks;

  async function handleSignOut() {
    await supabase.auth.signOut();
    toast.success("Signed out");
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg">
          <Coffee className="h-5 w-5 text-orange-500" />
          <span>DevFast</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
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

        {/* Mobile nav */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-64">
            <div className="flex flex-col gap-2 mt-8">
              <div className="px-3 py-2 text-sm font-medium text-muted-foreground">
                Hi, {profile.full_name || "User"}
              </div>
              <div className="px-3 py-1 text-xs text-muted-foreground">
                Balance: {Number(profile.balance).toLocaleString()} UGX
              </div>
              <div className="border-t my-2" />
              {links.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Button
                    key={link.href}
                    variant={isActive ? "secondary" : "ghost"}
                    className="justify-start"
                    asChild
                    onClick={() => setOpen(false)}
                  >
                    <Link href={link.href}>
                      <Icon className="h-4 w-4 mr-2" />
                      {link.label}
                    </Link>
                  </Button>
                );
              })}
              <div className="border-t my-2" />
              <Button variant="ghost" className="justify-start" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
