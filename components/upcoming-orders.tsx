"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import type { Order, CancelOrderResult } from "@/lib/types";

interface UpcomingOrdersProps {
  orders: Order[];
}

export function UpcomingOrders({ orders }: UpcomingOrdersProps) {
  const [cancelling, setCancelling] = useState<string | null>(null);
  const supabase = createClient();

  async function handleCancel(orderId: string) {
    setCancelling(orderId);
    try {
      const { data, error } = await supabase.rpc("cancel_order", {
        p_order_id: orderId,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      const result = data as unknown as CancelOrderResult;
      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(`Order cancelled. ${Number(result.refunded).toLocaleString()} UGX refunded.`);
      window.location.reload();
    } catch {
      toast.error("Failed to cancel order");
    } finally {
      setCancelling(null);
    }
  }

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    cancelled: "bg-red-100 text-red-800",
    delivered: "bg-green-100 text-green-800",
  };

  if (orders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Upcoming Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No upcoming orders. Place one above!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Upcoming Orders</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {orders.map((order) => (
          <div
            key={order.id}
            className="flex items-center justify-between p-3 rounded-lg border"
          >
            <div className="space-y-1">
              <div className="font-medium text-sm">{order.menu_item?.name}</div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{format(new Date(order.order_date), "EEE, MMM d")}</span>
                <span>x{order.quantity}</span>
                <span>{Number(order.total_price).toLocaleString()} UGX</span>
              </div>
              <Badge className={`text-xs ${statusColors[order.status] || ""}`} variant="secondary">
                {order.status}
              </Badge>
            </div>
            {order.status === "pending" && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleCancel(order.id)}
                disabled={cancelling === order.id}
              >
                {cancelling === order.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <X className="h-4 w-4 text-destructive" />
                )}
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
