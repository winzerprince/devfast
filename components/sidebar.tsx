"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  Home,
  ShoppingCart,
  RotateCw,
  History,
  CalendarClock,
  LayoutDashboard,
  ClipboardList,
  UtensilsCrossed,
  Users,
  LogOut,
} from "lucide-react";
import type { Profile } from "@/lib/types";

interface SidebarProps {
  profile: Profile;
}

const userNavItems = [
  { label: "Home",      icon: Home,          href: "/dashboard",            hash: "" as string | null },
  { label: "New Order", icon: ShoppingCart,  href: "/dashboard#new-order",  hash: "new-order" },
  { label: "Recurring", icon: RotateCw,      href: "/dashboard#recurring",  hash: "recurring" },
  { label: "Upcoming",  icon: CalendarClock, href: "/dashboard#upcoming",   hash: "upcoming" },
  { label: "History",   icon: History,       href: "/orders/history",       hash: null },
];

const adminNavItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/admin/dashboard", hash: null as string | null },
  { label: "Orders",    icon: ClipboardList,   href: "/admin/orders",    hash: null },
  { label: "Menu",      icon: UtensilsCrossed, href: "/admin/menu",      hash: null },
  { label: "Users",     icon: Users,           href: "/admin/users",     hash: null },
];

const DASHBOARD_HASHES = ["new-order", "recurring", "upcoming"];

export function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
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

  const items = profile.role === "admin" ? adminNavItems : userNavItems;

  function isActive(item: (typeof userNavItems)[number]): boolean {
    if (item.hash === null) {
      return pathname === new URL(item.href, "http://localhost").pathname;
    }
    if (pathname !== "/dashboard") return false;
    if (item.hash === "") return !DASHBOARD_HASHES.includes(currentHash);
    return currentHash === item.hash;
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    toast.success("Signed out");
    router.push("/");
    router.refresh();
  }

  const initial = (profile.full_name || "U").charAt(0).toUpperCase();

  return (
    <aside className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-64 z-40 bg-gradient-to-b from-primary to-orange-700">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-6 h-16 border-b border-white/15 shrink-0">
        <div className="bg-white rounded-lg p-1 shrink-0">
          <Image src="/logo.png" alt="EarlyBird" width={26} height={26} className="rounded" />
        </div>
        <span className="font-bold text-lg text-white">EarlyBird</span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? "bg-white text-primary shadow-sm"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User card + sign out */}
      <div className="border-t border-white/15 p-4 space-y-1 shrink-0">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 text-white text-sm font-bold">
            {initial}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white leading-tight truncate">{profile.full_name || "User"}</p>
            <p className="text-xs text-white/60">{Number(profile.balance).toLocaleString()} UGX</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors"
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
