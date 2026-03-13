"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { format } from "date-fns";

interface PageMeta {
  title: string;
  description: string;
}

// Static titles for non-dashboard routes
const ROUTE_META: Record<string, PageMeta> = {
  "/orders/history": {
    title: "Order History",
    description: "Browse your past orders and track spending over time.",
  },
  "/admin/dashboard": {
    title: "Dashboard",
    description: "Team order overview, revenue stats, and daily activity.",
  },
  "/admin/orders": {
    title: "Orders",
    description: "Review, confirm, and manage all team orders.",
  },
  "/admin/menu": {
    title: "Menu",
    description: "Add, edit, and manage the breakfast menu items.",
  },
  "/admin/users": {
    title: "Users",
    description: "Manage team members, balances, and wallet top-ups.",
  },
};

// Per-tab titles for /dashboard (hash-based)
const DASHBOARD_TAB_META: Record<string, PageMeta> = {
  "":           { title: "Overview",   description: "Your wallet balance, spending summary, and billing settings." },
  "overview":   { title: "Overview",   description: "Your wallet balance, spending summary, and billing settings." },
  "new-order":  { title: "New Order",  description: "Select items and place your breakfast order for tomorrow." },
  "recurring":  { title: "Recurring",  description: "Set up a weekly breakfast schedule that runs automatically." },
  "upcoming":   { title: "Upcoming",   description: "Track your scheduled orders and report delivery outcomes." },
};

export function TopBar() {
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

  const meta =
    pathname === "/dashboard"
      ? (DASHBOARD_TAB_META[currentHash] ?? DASHBOARD_TAB_META[""])
      : (ROUTE_META[pathname] ?? { title: "DevFast", description: "" });

  const today = format(new Date(), "EEEE, MMMM d, yyyy");

  return (
    <header className="hidden md:flex items-center justify-between h-16 px-8 border-b bg-background sticky top-0 z-30 shrink-0">
      <div>
        <h1 className="text-lg font-bold leading-tight">{meta.title}</h1>
        {meta.description && (
          <p className="text-xs text-muted-foreground mt-0.5">{meta.description}</p>
        )}
      </div>
      <span className="text-xs text-muted-foreground">{today}</span>
    </header>
  );
}
