"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2, Wallet } from "lucide-react";
import type { DrainMode } from "@/lib/types";

interface DrainModeCardProps {
  currentMode: DrainMode;
}

export function DrainModeCard({ currentMode }: DrainModeCardProps) {
  const [mode, setMode] = useState<DrainMode>(currentMode);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  async function setDrainMode(nextMode: DrainMode) {
    if (nextMode === mode) return;

    setSaving(true);
    try {
      const { data, error } = await supabase.rpc("set_my_drain_mode", {
        p_mode: nextMode,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      const result = data as { error?: string } | null;
      if (result?.error) {
        toast.error(result.error);
        return;
      }

      setMode(nextMode);
      toast.success(
        nextMode === "automatic"
          ? "Automatic drain enabled"
          : "Confirmation drain enabled"
      );
      window.location.reload();
    } catch {
      toast.error("Failed to update drain mode");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border bg-card p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 rounded-xl p-2.5">
          <Wallet className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="font-semibold text-sm">Billing Mode</p>
          <p className="text-xs text-muted-foreground">
            {mode === "automatic"
              ? "Charged immediately when order is placed"
              : "Charged after delivery is confirmed"}
          </p>
        </div>
      </div>

      {/* Segmented control */}
      <div className="flex rounded-xl border overflow-hidden">
        <button
          onClick={() => setDrainMode("automatic")}
          disabled={saving}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors active:opacity-80 ${
            mode === "automatic"
              ? "bg-primary text-primary-foreground"
              : "bg-background text-muted-foreground"
          }`}
        >
          {saving && mode !== "automatic" ? (
            <Loader2 className="h-4 w-4 animate-spin mx-auto" />
          ) : (
            "Automatic"
          )}
        </button>
        <button
          onClick={() => setDrainMode("confirmation")}
          disabled={saving}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors border-l active:opacity-80 ${
            mode === "confirmation"
              ? "bg-primary text-primary-foreground"
              : "bg-background text-muted-foreground"
          }`}
        >
          {saving && mode !== "confirmation" ? (
            <Loader2 className="h-4 w-4 animate-spin mx-auto" />
          ) : (
            "Confirmation"
          )}
        </button>
      </div>
    </div>
  );
}
