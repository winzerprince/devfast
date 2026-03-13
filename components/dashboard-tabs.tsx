"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const VALID_TABS = ["overview", "new-order", "recurring", "upcoming"];

function getTabFromHash(): string {
  if (typeof window === "undefined") return "overview";
  const hash = window.location.hash.slice(1);
  return VALID_TABS.includes(hash) ? hash : "overview";
}

interface DashboardTabsProps {
  overview: React.ReactNode;
  newOrder: React.ReactNode;
  recurring: React.ReactNode;
  upcoming: React.ReactNode;
}

export function DashboardTabs({ overview, newOrder, recurring, upcoming }: DashboardTabsProps) {
  const [tab, setTab] = useState("overview");

  useEffect(() => {
    // Set initial tab from hash and listen for hash changes (bottom nav clicks)
    setTab(getTabFromHash());

    function onHashChange() {
      setTab(getTabFromHash());
    }
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  function handleTabChange(value: string) {
    setTab(value);
    const hash = value === "overview" ? "" : `#${value}`;
    history.replaceState(null, "", window.location.pathname + hash);
  }

  return (
    <Tabs value={tab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="grid md:hidden w-full grid-cols-4">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="new-order">New Order</TabsTrigger>
        <TabsTrigger value="recurring">Recurring</TabsTrigger>
        <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="mt-4 space-y-4">{overview}</TabsContent>
      <TabsContent value="new-order" className="mt-4">{newOrder}</TabsContent>
      <TabsContent value="recurring" className="mt-4">{recurring}</TabsContent>
      <TabsContent value="upcoming" className="mt-4">{upcoming}</TabsContent>
    </Tabs>
  );
}
