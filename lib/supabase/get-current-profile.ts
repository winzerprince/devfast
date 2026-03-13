import { cache } from "react";
import { createClient } from "./server";
import type { Profile } from "@/lib/types";

/**
 * React.cache()-wrapped profile fetch.
 * Deduplicates within a single server render — layout and page calling this
 * will only ever produce one Supabase round-trip per request.
 */
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (profile as Profile) ?? null;
});
