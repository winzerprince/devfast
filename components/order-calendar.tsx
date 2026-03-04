"use client";

import { useMemo, useState } from "react";
import {
  addDays,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
  addMonths,
} from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import type { Order } from "@/lib/types";

interface OrderCalendarProps {
  orders: Order[];
}

const statusStyles: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  delivered: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  failed_reported: "bg-orange-100 text-orange-800",
  cancelled: "bg-gray-100 text-gray-700",
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <CalendarDays className="h-5 w-5" />
          Order Calendar
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="outline" size="icon" onClick={() => setMonthDate((prev) => subMonths(prev, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <p className="text-sm font-semibold">{format(monthDate, "MMMM yyyy")}</p>
          <Button variant="outline" size="icon" onClick={() => setMonthDate((prev) => addMonths(prev, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
          {[
            "Mon",
            "Tue",
            "Wed",
            "Thu",
            "Fri",
            "Sat",
            "Sun",
          ].map((day) => (
            <div key={day} className="py-1 font-medium">{day}</div>
          ))}
        </div>

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
                className={`h-12 rounded-md border text-xs flex flex-col items-center justify-center transition ${
                  selected
                    ? "border-primary bg-primary/10"
                    : inMonth
                      ? "border-border hover:bg-muted"
                      : "border-border/50 text-muted-foreground/50"
                }`}
              >
                <span>{format(day, "d")}</span>
                {count > 0 ? (
                  <span className="mt-0.5 px-1.5 rounded-full bg-primary/15 text-[10px] font-medium">
                    {count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="space-y-2 border-t pt-3">
          <p className="text-sm font-medium">{format(selectedDate, "EEEE, MMM d")}</p>
          {selectedOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No orders on this day.</p>
          ) : (
            <div className="space-y-2">
              {selectedOrders.map((order) => (
                <div key={order.id} className="rounded-md border p-2 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{order.menu_item?.name}</p>
                    <p className="text-xs text-muted-foreground">x{order.quantity} • {Number(order.total_price).toLocaleString()} UGX</p>
                  </div>
                  <Badge variant="secondary" className={statusStyles[order.status] || ""}>
                    {order.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
