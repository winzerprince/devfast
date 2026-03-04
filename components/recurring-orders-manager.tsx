"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CalendarDays, Loader2, Plus, Repeat, Save, Trash2 } from "lucide-react";
import type { MenuItem, RecurringOrder } from "@/lib/types";

const DAY_OPTIONS = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 7, label: "Sun" },
];

interface RecurringOrdersManagerProps {
  menuItems: MenuItem[];
  recurringOrders: RecurringOrder[];
}

interface DayLine {
  id: string;
  menu_item_id: string;
  quantity: number;
}

type DayPlan = Record<number, DayLine[]>;

function createInitialDayPlan(orders: RecurringOrder[]): DayPlan {
  const plan: DayPlan = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [] };

  for (const order of orders) {
    for (const day of order.days_of_week) {
      plan[day] = [
        ...plan[day],
        {
          id: crypto.randomUUID(),
          menu_item_id: order.menu_item_id,
          quantity: order.quantity,
        },
      ];
    }
  }

  return plan;
}

export function RecurringOrdersManager({ menuItems, recurringOrders }: RecurringOrdersManagerProps) {
  const [activeDay, setActiveDay] = useState<number>(1);
  const [selectedItem, setSelectedItem] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [dayPlan, setDayPlan] = useState<DayPlan>(() => createInitialDayPlan(recurringOrders));
  const [saving, setSaving] = useState(false);

  const supabase = createClient();

  const activeLines = dayPlan[activeDay] || [];

  const totalWeeklyLines = useMemo(
    () => Object.values(dayPlan).reduce((sum, lines) => sum + lines.length, 0),
    [dayPlan]
  );

  function addToDay(day: number) {
    if (!selectedItem) {
      toast.error("Select a menu item first");
      return;
    }

    if (quantity <= 0) {
      toast.error("Quantity must be at least 1");
      return;
    }

    setDayPlan((prev) => ({
      ...prev,
      [day]: [
        ...(prev[day] || []),
        {
          id: crypto.randomUUID(),
          menu_item_id: selectedItem,
          quantity,
        },
      ],
    }));

    setSelectedItem("");
    setQuantity(1);
  }

  function removeFromDay(day: number, id: string) {
    setDayPlan((prev) => ({
      ...prev,
      [day]: (prev[day] || []).filter((line) => line.id !== id),
    }));
  }

  function updateDayLineQty(day: number, id: string, nextQty: number) {
    setDayPlan((prev) => ({
      ...prev,
      [day]: (prev[day] || []).map((line) =>
        line.id === id ? { ...line, quantity: Math.max(1, nextQty) } : line
      ),
    }));
  }

  function applyTemplate(template: "daily" | "weekdays") {
    const source = dayPlan[activeDay] || [];
    if (source.length === 0) {
      toast.error("Add at least one item to the active day first");
      return;
    }

    const targetDays = template === "daily" ? [1, 2, 3, 4, 5, 6, 7] : [1, 2, 3, 4, 5];
    const cloned = source.map((line) => ({ ...line, id: crypto.randomUUID() }));

    setDayPlan((prev) => {
      const next = { ...prev };
      for (const day of targetDays) {
        next[day] = cloned.map((line) => ({ ...line, id: crypto.randomUUID() }));
      }
      return next;
    });

    toast.success(template === "daily" ? "Applied to all 7 days" : "Applied to weekdays");
  }

  async function saveWeeklyPlan() {
    setSaving(true);
    try {
      const existingIds = recurringOrders.map((order) => order.id);
      if (existingIds.length > 0) {
        const { error: deleteError } = await supabase
          .from("recurring_orders")
          .delete()
          .in("id", existingIds);

        if (deleteError) {
          toast.error(deleteError.message);
          return;
        }
      }

      const payload = Object.entries(dayPlan).flatMap(([day, lines]) =>
        lines.map((line) => ({
          menu_item_id: line.menu_item_id,
          quantity: line.quantity,
          schedule_type: "selected_days" as const,
          days_of_week: [Number(day)],
          is_active: true,
        }))
      );

      if (payload.length > 0) {
        const { error: insertError } = await supabase.from("recurring_orders").insert(payload);

        if (insertError) {
          toast.error(insertError.message);
          return;
        }
      }

      toast.success(payload.length > 0 ? "Weekly recurring plan saved" : "Recurring plan cleared");
      window.location.reload();
    } catch {
      toast.error("Failed to save recurring plan");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Repeat className="h-5 w-5" />
          Weekly Recurring Plan
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          Build your weekly plan day by day. You can add multiple menu items for each weekday.
        </p>

        <div className="flex flex-wrap gap-2">
          {DAY_OPTIONS.map((day) => {
            const count = dayPlan[day.value]?.length || 0;
            return (
              <Button
                key={day.value}
                type="button"
                variant={activeDay === day.value ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveDay(day.value)}
              >
                {day.label}
                {count > 0 ? <Badge variant="secondary" className="ml-2">{count}</Badge> : null}
              </Button>
            );
          })}
        </div>

        <div className="grid gap-3 border rounded-lg p-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">
              {DAY_OPTIONS.find((d) => d.value === activeDay)?.label} items
            </h4>
            <div className="flex gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => applyTemplate("weekdays")}>
                Copy to weekdays
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => applyTemplate("daily")}>
                Copy to all days
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Menu Item</Label>
            <Select value={selectedItem} onValueChange={setSelectedItem}>
              <SelectTrigger>
                <SelectValue placeholder="Select item" />
              </SelectTrigger>
              <SelectContent>
                {menuItems.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name} — {Number(item.price).toLocaleString()} UGX
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end gap-2">
            <div className="space-y-2 w-24">
              <Label>Qty</Label>
              <Input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))} />
            </div>
            <Button type="button" onClick={() => addToDay(activeDay)}>
              <Plus className="h-4 w-4 mr-1" />
              Add to {DAY_OPTIONS.find((d) => d.value === activeDay)?.label}
            </Button>
          </div>

          {activeLines.length === 0 ? (
            <p className="text-sm text-muted-foreground">No items for this day yet.</p>
          ) : (
            <div className="space-y-2">
              {activeLines.map((line) => {
                const menuItem = menuItems.find((m) => m.id === line.menu_item_id);
                return (
                  <div key={line.id} className="flex items-center gap-2 border rounded-md p-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{menuItem?.name || "Unknown item"}</p>
                      <p className="text-xs text-muted-foreground">{Number(menuItem?.price || 0).toLocaleString()} UGX each</p>
                    </div>
                    <Input
                      type="number"
                      min={1}
                      className="w-16 h-8"
                      value={line.quantity}
                      onChange={(e) => updateDayLineQty(activeDay, line.id, Number(e.target.value) || 1)}
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeFromDay(activeDay, line.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="pt-3 border-t space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Weekly summary
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {DAY_OPTIONS.map((day) => (
              <div key={day.value} className="rounded-md border p-2 text-sm flex items-center justify-between">
                <span>{day.label}</span>
                <Badge variant="secondary">{dayPlan[day.value]?.length || 0}</Badge>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDayPlan({ 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [] });
                toast.success("Planner cleared. Click save to apply.");
              }}
              disabled={saving || totalWeeklyLines === 0}
            >
              Clear planner
            </Button>
            <Button onClick={saveWeeklyPlan} disabled={saving} className="w-full">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Weekly Plan
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
