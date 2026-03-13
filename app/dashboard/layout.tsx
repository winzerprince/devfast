import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/navbar";
import { BottomNav } from "@/components/bottom-nav";
import { Sidebar } from "@/components/sidebar";
import { TopBar } from "@/components/top-bar";
import { PageTransition } from "@/components/page-transition";
import type { Profile } from "@/lib/types";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/signin");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/auth/signin");

  return (
    <div className="min-h-screen">
      {/* Desktop sidebar */}
      <Sidebar profile={profile as Profile} />

      {/* Content area — offset by sidebar on desktop */}
      <div className="flex flex-col min-h-screen md:pl-64">
        {/* Mobile-only top header */}
        <Navbar profile={profile as Profile} />
        {/* Desktop-only top bar */}
        <TopBar />

        <main className="flex-1 px-4 py-4 pb-24 md:pb-8 md:px-8 md:py-8">
          <PageTransition>{children}</PageTransition>
        </main>

        {/* Mobile-only bottom nav */}
        <BottomNav role={(profile as Profile).role} />
      </div>
    </div>
  );
}
