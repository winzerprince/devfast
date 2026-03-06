import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/navbar";
import { BottomNav } from "@/components/bottom-nav";
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
    <div className="min-h-screen flex flex-col">
      <Navbar profile={profile as Profile} />
      <main className="flex-1 container mx-auto px-4 py-4 pb-20 md:pb-4">
        {children}
      </main>
      <BottomNav role={(profile as Profile).role} />
    </div>
  );
}
