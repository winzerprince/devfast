"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { format, addDays } from "date-fns";
import type { MenuItem, MenuAvailability } from "@/lib/types";

interface MenuAvailabilityManagerProps {
  menuItems: MenuItem[];
}

export function MenuAvailabilityManager({ menuItems }: MenuAvailabilityManagerProps) {
  const activeItems = menuItems.filter((item) => item.is_active);
  const supabase = createClient();

  const [selectedDate, setSelectedDate] = useState(() => {
    const tomorrow = addDays(new Date(), 1);
    return format(tomorrow, "yyyy-MM-dd");
  });
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    async function fetchAvailability() {
      setFetching(true);
      const { data } = await supabase
        .from("menu_availability")
        .select("menu_item_id")
        .eq("available_date", selectedDate);

      if (data && data.length > 0) {
        setCheckedIds(new Set(data.map((row: { menu_item_id: string }) => row.menu_item_id)));
      } else {
        setCheckedIds(new Set());
      }
      setFetching(false);
    }
    fetchAvailability();
  }, [selectedDate]);

  function toggleItem(id: string) {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setCheckedIds(new Set(activeItems.map((item) => item.id)));
  }

  function deselectAll() {
    setCheckedIds(new Set());
  }

  async function saveAvailability() {
    setLoading(true);
    try {
      await supabase
        .from("menu_availability")
        .delete()
        .eq("available_date", selectedDate);

      if (checkedIds.size > 0) {
        const rows = Array.from(checkedIds).map((menu_item_id) => ({
          menu_item_id,
          available_date: selectedDate,
        }));

        const { error } = await supabase
          .from("menu_availability")
          .insert(rows);

        if (error) {
          toast.error(error.message);
          return;
        }
      }

      toast.success(`Availability saved for ${format(new Date(selectedDate + "T00:00:00"), "EEE, MMM d")}`);
    } catch {
      toast.error("Failed to save availability");
    } finally {
      setLoading(false);
    }
  }

  function shiftDate(days: number) {
    const current = new Date(selectedDate + "T00:00:00");
    setSelectedDate(format(addDays(current, days), "yyyy-MM-dd"));
  }

  return (
    <div className="space-y-5">
      {/* Date navigator */}
      <div className="flex items-center gap-3 bg-muted/50 rounded-2xl p-3">
        <button
          onClick={() => shiftDate(-1)}
          className="h-9 w-9 flex items-center justify-center rounded-xl border bg-background active:scale-95 transition-transform shrink-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 text-center">
          <p className="font-semibold text-sm">
            {format(new Date(selectedDate + "T00:00:00"), "EEEE")}
          </p>
          <p className="text-xs text-muted-foreground">
            {format(new Date(selectedDate + "T00:00:00"), "MMM d, yyyy")}
          </p>
        </div>
        <button
          onClick={() => shiftDate(1)}
          className="h-9 w-9 flex items-center justify-center rounded-xl border bg-background active:scale-95 transition-transform shrink-0"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <p className="text-xs text-muted-foreground">
        Items checked here will be shown to users for this date. If none are set, all active items are shown.
      </p>

      {fetching ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Select all / deselect all */}
          <div className="flex gap-2">
            <button
              onClick={selectAll}
              className="text-xs font-medium px-3 py-1.5 rounded-full border bg-background active:scale-95 transition-transform"
            >
              Select All
            </button>
            <button
              onClick={deselectAll}
              className="text-xs font-medium px-3 py-1.5 rounded-full border bg-background active:scale-95 transition-transform"
            >
              Deselect All
            </button>
          </div>

          {/* Item toggles */}
          <div className="space-y-2">
            {activeItems.map((item) => (
              <label
                key={item.id}
                className={`flex items-center gap-3 p-3.5 rounded-2xl border cursor-pointer transition-colors active:scale-[0.99] ${
                  checkedIds.has(item.id)
                    ? "border-primary/40 bg-primary/5"
                    : "bg-card"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checkedIds.has(item.id)}
                  onChange={() => toggleItem(item.id)}
                  className="rounded accent-[hsl(var(--primary))] h-4 w-4 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{item.name}</span>
                    {item.is_special && (
                      <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">Special</Badge>
                    )}
                  </div>
                </div>
                <span className="text-sm font-semibold shrink-0">{Number(item.price).toLocaleString()} <span className="font-normal text-muted-foreground text-xs">UGX</span></span>
              </label>
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-sm text-muted-foreground">
              {checkedIds.size} of {activeItems.length} selected
            </span>
            <Button
              onClick={saveAvailability}
              disabled={loading}
              className="active:scale-[0.97] transition-transform"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
