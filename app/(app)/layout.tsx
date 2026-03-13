import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/supabase/get-current-profile";
import { Navbar } from "@/components/navbar";
import { BottomNav } from "@/components/bottom-nav";
import { Sidebar } from "@/components/sidebar";
import { TopBar } from "@/components/top-bar";
import { PageTransition } from "@/components/page-transition";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/auth/signin");

  return (
    <div className="min-h-screen">
      {/* Desktop sidebar */}
      <Sidebar profile={profile} />

      {/* Content area — offset by sidebar on desktop */}
      <div className="flex flex-col min-h-screen md:pl-64">
        {/* Mobile-only top header */}
        <Navbar profile={profile} />
        {/* Desktop-only top bar */}
        <TopBar />

        <main className="flex-1 px-4 py-4 pb-24 md:pb-8 md:px-8 md:py-8">
          <PageTransition>{children}</PageTransition>
        </main>

        {/* Mobile-only bottom nav */}
        <BottomNav role={profile.role} />
      </div>
    </div>
  );
}
