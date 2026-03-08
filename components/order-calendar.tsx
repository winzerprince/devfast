"use client";

import { useMemo, useState } from "react";
import {
  addDays,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
  addMonths,
} from "date-fns";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Order } from "@/lib/types";

interface OrderCalendarProps {
  orders: Order[];
}

const statusStyles: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  confirmed: "bg-primary/10 text-primary",
  delivered: "bg-primary/10 text-primary",
  failed: "bg-destructive/10 text-destructive",
  failed_reported: "bg-destructive/10 text-destructive",
  cancelled: "bg-muted text-muted-foreground",
};

export function OrderCalendar({ orders }: OrderCalendarProps) {
  const [monthDate, setMonthDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const ordersByDate = useMemo(() => {
    const map = new Map<string, Order[]>();
    for (const order of orders) {
      const key = order.order_date;
      if (!map.has(key)) map.set(key, []);
      map.get(key)?.push(order);
    }
    return map;
  }, [orders]);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(monthDate), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(monthDate), { weekStartsOn: 1 });
    const result: Date[] = [];
    let current = start;
    while (current <= end) {
      result.push(current);
      current = addDays(current, 1);
    }
    return result;
  }, [monthDate]);

  const selectedKey = format(selectedDate, "yyyy-MM-dd");
  const selectedOrders = ordersByDate.get(selectedKey) || [];

  return (
    <div className="rounded-2xl border bg-card p-4 space-y-4">
      {/* Month navigator */}
      <div className="flex items-center gap-3 bg-muted/50 rounded-2xl p-2.5">
        <button
          onClick={() => setMonthDate((prev) => subMonths(prev, 1))}
          className="h-9 w-9 flex items-center justify-center rounded-xl border bg-background active:scale-95 transition-transform shrink-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="flex-1 text-center text-sm font-semibold">{format(monthDate, "MMMM yyyy")}</p>
        <button
          onClick={() => setMonthDate((prev) => addMonths(prev, 1))}
          className="h-9 w-9 flex items-center justify-center rounded-xl border bg-background active:scale-95 transition-transform shrink-0"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="py-1 font-medium">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const count = (ordersByDate.get(key) || []).length;
          const selected = isSameDay(day, selectedDate);
          const inMonth = isSameMonth(day, monthDate);

          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedDate(day)}
              className={`h-12 rounded-xl border text-xs flex flex-col items-center justify-center active:scale-95 transition-transform ${
                selected
                  ? "border-primary bg-primary/10 font-semibold"
                  : inMonth
                    ? "border-border bg-background hover:bg-muted"
                    : "border-transparent text-muted-foreground/40"
              }`}
            >
              <span>{format(day, "d")}</span>
              {count > 0 && (
                <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected date orders */}
      <div className="space-y-2 border-t pt-3">
        <p className="text-sm font-semibold">{format(selectedDate, "EEEE, MMM d")}</p>
        {selectedOrders.length === 0 ? (
          <p className="text-sm text-muted-foreground">No orders on this day.</p>
        ) : (
          <div className="space-y-2">
            {selectedOrders.map((order) => (
              <div key={order.id} className="rounded-2xl border bg-muted/30 p-3 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{order.menu_item?.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    x{order.quantity} &middot; {Number(order.total_price).toLocaleString()} UGX
                  </p>
                </div>
                <Badge variant="secondary" className={`text-xs shrink-0 ${statusStyles[order.status] || ""}`}>
                  {order.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
