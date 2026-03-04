"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import type { Order, OrderStatus } from "@/lib/types";

interface AdminOrderListProps {
  initialOrders: Order[];
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  cancelled: "bg-red-100 text-red-800",
  delivered: "bg-green-100 text-green-800",
};

export function AdminOrderList({ initialOrders }: AdminOrderListProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [updating, setUpdating] = useState<string | null>(null);
  const supabase = createClient();

  async function updateStatus(orderId: string, newStatus: OrderStatus) {
    setUpdating(orderId);

    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success(`Order marked as ${newStatus}`);
      setOrders(orders.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
    } catch {
      toast.error("Failed to update order");
    } finally {
      setUpdating(null);
    }
  }

  if (orders.length === 0) {
    return <p className="text-sm text-muted-foreground">No orders found.</p>;
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <Card key={order.id}>
          <CardContent className="py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1 min-w-0 flex-1">
                <div className="font-medium text-sm truncate">
                  {order.profile?.full_name || "Unknown"}
                </div>
                <div className="text-sm text-muted-foreground">
                  {order.menu_item?.name} x{order.quantity}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{format(new Date(order.order_date), "EEE, MMM d")}</span>
                  <span>{Number(order.total_price).toLocaleString()} UGX</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {updating === order.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Select
                    value={order.status}
                    onValueChange={(val) => updateStatus(order.id, val as OrderStatus)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
