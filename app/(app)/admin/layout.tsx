import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/supabase/get-current-profile";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // getCurrentProfile is React.cache()-wrapped — no extra Supabase call is made
  // since (app)/layout.tsx already called it during this render.
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") redirect("/dashboard");

  return <>{children}</>;
}
