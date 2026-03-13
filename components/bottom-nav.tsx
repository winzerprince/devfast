"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  ShoppingCart,
  RotateCw,
  History,
  LayoutDashboard,
  ClipboardList,
  UtensilsCrossed,
  Users,
} from "lucide-react";
import type { UserRole } from "@/lib/types";

interface BottomNavProps {
  role: UserRole;
}

// hash: null = non-dashboard page (match by pathname only)
// hash: ""   = dashboard overview (no hash)
// hash: "x"  = dashboard tab with that hash
const userItems = [
  { label: "Home",      icon: Home,          href: "/dashboard",           hash: "" as string | null },
  { label: "Order",     icon: ShoppingCart,  href: "/dashboard#new-order", hash: "new-order" },
  { label: "Recurring", icon: RotateCw,      href: "/dashboard#recurring", hash: "recurring" },
  { label: "History",   icon: History,       href: "/orders/history",      hash: null },
];

const adminItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/admin/dashboard", hash: null as string | null },
  { label: "Orders",    icon: ClipboardList,   href: "/admin/orders",    hash: null },
  { label: "Menu",      icon: UtensilsCrossed, href: "/admin/menu",      hash: null },
  { label: "Users",     icon: Users,           href: "/admin/users",     hash: null },
];

const DASHBOARD_HASHES = ["new-order", "recurring", "upcoming"];

export function BottomNav({ role }: BottomNavProps) {
  const pathname = usePathname();
  const [currentHash, setCurrentHash] = useState("");

  useEffect(() => {
    setCurrentHash(window.location.hash.slice(1));

    function onHashChange() {
      setCurrentHash(window.location.hash.slice(1));
    }
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    setCurrentHash(window.location.hash.slice(1));
  }, [pathname]);

  const items = role === "admin" ? adminItems : userItems;

  function isActive(item: (typeof userItems)[number]): boolean {
    if (item.hash === null) {
      return pathname === new URL(item.href, "http://localhost").pathname;
    }
    if (pathname !== "/dashboard") return false;
    if (item.hash === "") {
      // Overview: active when no hash or unrecognised hash
      return !DASHBOARD_HASHES.includes(currentHash);
    }
    return currentHash === item.hash;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 md:hidden pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-4 h-16">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 text-xs transition-colors ${
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
