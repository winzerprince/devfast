"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CalendarCheck, ChevronLeft, ChevronRight } from "lucide-react";
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
      // Delete existing availability for this date
      await supabase
        .from("menu_availability")
        .delete()
        .eq("available_date", selectedDate);

      // Insert new rows
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <CalendarCheck className="h-5 w-5" />
          Daily Availability
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Check which items are available for a specific date. If none are set, all active items will be shown to users.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Date selector */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => shiftDate(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-center flex-1">
            <div className="font-medium">
              {format(new Date(selectedDate + "T00:00:00"), "EEEE, MMM d, yyyy")}
            </div>
          </div>
          <Button variant="outline" size="icon" onClick={() => shiftDate(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {fetching ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : (
          <>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={selectAll}>Select All</Button>
              <Button variant="outline" size="sm" onClick={deselectAll}>Deselect All</Button>
            </div>

            <div className="space-y-2">
              {activeItems.map((item) => (
                <label
                  key={item.id}
                  className="flex items-center gap-3 p-2 rounded-md border cursor-pointer hover:bg-muted/50"
                >
                  <input
                    type="checkbox"
                    checked={checkedIds.has(item.id)}
                    onChange={() => toggleItem(item.id)}
                    className="rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-sm">{item.name}</span>
                    {item.is_special && (
                      <Badge variant="secondary" className="ml-2 text-xs bg-orange-100 text-orange-700">Special</Badge>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">{Number(item.price).toLocaleString()} UGX</span>
                </label>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {checkedIds.size} of {activeItems.length} items selected
              </span>
              <Button onClick={saveAvailability} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Availability
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
