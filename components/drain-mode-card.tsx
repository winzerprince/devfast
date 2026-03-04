"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Wallet className="h-5 w-5" />
          Billing Mode
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {mode === "automatic" ? "Automatic Drain" : "Confirmation Drain"}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Automatic: money is deducted when an order is created. Confirmation: money is deducted only after both you and admin confirm delivery.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Button
            variant={mode === "automatic" ? "default" : "outline"}
            onClick={() => setDrainMode("automatic")}
            disabled={saving}
          >
            {saving && mode !== "automatic" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Automatic Drain
          </Button>
          <Button
            variant={mode === "confirmation" ? "default" : "outline"}
            onClick={() => setDrainMode("confirmation")}
            disabled={saving}
          >
            {saving && mode !== "confirmation" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Confirmation Drain
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
