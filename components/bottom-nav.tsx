"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
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

const userItems = [
  { label: "Home", icon: Home, href: "/dashboard" },
  { label: "Order", icon: ShoppingCart, href: "/dashboard?tab=new-order" },
  { label: "Recurring", icon: RotateCw, href: "/dashboard?tab=recurring" },
  { label: "History", icon: History, href: "/orders/history" },
];

const adminItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/admin/dashboard" },
  { label: "Orders", icon: ClipboardList, href: "/admin/orders" },
  { label: "Menu", icon: UtensilsCrossed, href: "/admin/menu" },
  { label: "Users", icon: Users, href: "/admin/users" },
];

function isActive(
  item: (typeof userItems)[number],
  pathname: string,
  tab: string | null
): boolean {
  if (item.href === "/dashboard") {
    return pathname === "/dashboard" && (!tab || tab === "overview");
  }
  if (item.href === "/dashboard?tab=new-order") {
    return pathname === "/dashboard" && tab === "new-order";
  }
  if (item.href === "/dashboard?tab=recurring") {
    return pathname === "/dashboard" && tab === "recurring";
  }
  if (item.href === "/orders/history") {
    return pathname.startsWith("/orders");
  }
  // Admin items match by exact pathname
  const url = new URL(item.href, "http://localhost");
  return pathname === url.pathname;
}

export function BottomNav({ role }: BottomNavProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");

  const items = role === "admin" ? adminItems : userItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 md:hidden pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-4 h-16">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(item, pathname, tab);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 text-xs transition-colors ${
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
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
