"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
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
  userId: string;
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
      plan[day] = [...plan[day], { id: crypto.randomUUID(), menu_item_id: order.menu_item_id, quantity: order.quantity }];
    }
  }
  return plan;
}

export function RecurringOrdersManager({ menuItems, recurringOrders, userId }: RecurringOrdersManagerProps) {
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
    if (!selectedItem) { toast.error("Select a menu item first"); return; }
    if (quantity <= 0) { toast.error("Quantity must be at least 1"); return; }

    setDayPlan((prev) => ({
      ...prev,
      [day]: [...(prev[day] || []), { id: crypto.randomUUID(), menu_item_id: selectedItem, quantity }],
    }));
    setSelectedItem("");
    setQuantity(1);
  }

  function removeFromDay(day: number, id: string) {
    setDayPlan((prev) => ({ ...prev, [day]: (prev[day] || []).filter((l) => l.id !== id) }));
  }

  function updateDayLineQty(day: number, id: string, nextQty: number) {
    setDayPlan((prev) => ({
      ...prev,
      [day]: (prev[day] || []).map((l) => (l.id === id ? { ...l, quantity: Math.max(1, nextQty) } : l)),
    }));
  }

  function applyTemplate(template: "daily" | "weekdays") {
    const source = dayPlan[activeDay] || [];
    if (source.length === 0) { toast.error("Add at least one item to the active day first"); return; }

    const targetDays = template === "daily" ? [1, 2, 3, 4, 5, 6, 7] : [1, 2, 3, 4, 5];
    setDayPlan((prev) => {
      const next = { ...prev };
      for (const day of targetDays) {
        next[day] = source.map((l) => ({ ...l, id: crypto.randomUUID() }));
      }
      return next;
    });
    toast.success(template === "daily" ? "Applied to all 7 days" : "Applied to weekdays");
  }

  async function saveWeeklyPlan() {
    setSaving(true);
    try {
      const existingIds = recurringOrders.map((o) => o.id);
      if (existingIds.length > 0) {
        const { error } = await supabase.from("recurring_orders").delete().in("id", existingIds);
        if (error) { toast.error(error.message); return; }
      }

      const payload = Object.entries(dayPlan).flatMap(([day, lines]) =>
        lines.map((line) => ({
          user_id: userId,
          menu_item_id: line.menu_item_id,
          quantity: line.quantity,
          schedule_type: "selected_days" as const,
          days_of_week: [Number(day)],
          is_active: true,
        }))
      );

      if (payload.length > 0) {
        const { error } = await supabase.from("recurring_orders").insert(payload);
        if (error) { toast.error(error.message); return; }
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
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Build your weekly breakfast plan. Add items to each day and save.
      </p>

      {/* Day selector */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {DAY_OPTIONS.map((day) => {
          const count = dayPlan[day.value]?.length || 0;
          const active = activeDay === day.value;
          return (
            <button
              key={day.value}
              onClick={() => setActiveDay(day.value)}
              className={`flex flex-col items-center gap-0.5 px-3.5 py-2 rounded-2xl border text-sm font-medium shrink-0 transition-colors active:scale-95 ${
                active ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground"
              }`}
            >
              <span>{day.label}</span>
              {count > 0 && (
                <span className={`text-[10px] font-bold ${active ? "text-primary-foreground/70" : "text-primary"}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Active day editor */}
      <div className="rounded-2xl border bg-card p-4 space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="text-sm font-semibold">
            {DAY_OPTIONS.find((d) => d.value === activeDay)?.label} items
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => applyTemplate("weekdays")}
              className="text-xs font-medium px-3 py-1.5 rounded-full border bg-background active:scale-95 transition-transform"
            >
              Copy to weekdays
            </button>
            <button
              onClick={() => applyTemplate("daily")}
              className="text-xs font-medium px-3 py-1.5 rounded-full border bg-background active:scale-95 transition-transform"
            >
              Copy to all days
            </button>
          </div>
        </div>

        {/* Add item row */}
        <div className="space-y-2">
          <Select value={selectedItem} onValueChange={setSelectedItem}>
            <SelectTrigger>
              <SelectValue placeholder="Select menu item…" />
            </SelectTrigger>
            <SelectContent>
              {menuItems.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name} — {Number(item.price).toLocaleString()} UGX
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
              className="w-20 h-10"
              placeholder="Qty"
            />
            <Button
              type="button"
              onClick={() => addToDay(activeDay)}
              disabled={!selectedItem}
              className="flex-1 min-h-[40px] active:scale-[0.98] transition-transform"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add to {DAY_OPTIONS.find((d) => d.value === activeDay)?.label}
            </Button>
          </div>
        </div>

        {/* Lines for active day */}
        {activeLines.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-2">No items for this day yet.</p>
        ) : (
          <div className="space-y-2">
            {activeLines.map((line) => {
              const menuItem = menuItems.find((m) => m.id === line.menu_item_id);
              return (
                <div key={line.id} className="flex items-center gap-2 rounded-xl border bg-muted/30 p-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{menuItem?.name || "Unknown item"}</p>
                    <p className="text-xs text-muted-foreground">{Number(menuItem?.price || 0).toLocaleString()} UGX each</p>
                  </div>
                  <Input
                    type="number"
                    min={1}
                    className="w-16 h-8 text-center"
                    value={line.quantity}
                    onChange={(e) => updateDayLineQty(activeDay, line.id, Number(e.target.value) || 1)}
                  />
                  <button
                    onClick={() => removeFromDay(activeDay, line.id)}
                    className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive active:scale-95 transition-all shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Weekly summary */}
      <div className="rounded-2xl border bg-card p-4 space-y-3">
        <p className="text-sm font-semibold">Weekly summary</p>
        <div className="grid grid-cols-7 gap-1.5">
          {DAY_OPTIONS.map((day) => {
            const count = dayPlan[day.value]?.length || 0;
            return (
              <button
                key={day.value}
                onClick={() => setActiveDay(day.value)}
                className={`flex flex-col items-center py-2 rounded-xl border text-xs transition-colors active:scale-95 ${
                  activeDay === day.value ? "border-primary bg-primary/5" : "bg-muted/30"
                }`}
              >
                <span className="font-medium">{day.label}</span>
                <span className={`font-bold mt-0.5 ${count > 0 ? "text-primary" : "text-muted-foreground"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          onClick={() => { setDayPlan({ 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [] }); toast.success("Planner cleared. Click save to apply."); }}
          disabled={saving || totalWeeklyLines === 0}
          className="min-h-[48px] active:scale-[0.97] transition-transform"
        >
          Clear plan
        </Button>
        <Button
          onClick={saveWeeklyPlan}
          disabled={saving}
          className="min-h-[48px] active:scale-[0.97] transition-transform"
        >
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save plan
        </Button>
      </div>
    </div>
  );
}
