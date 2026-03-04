"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Check, Loader2, ShieldCheck } from "lucide-react";
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
  failed: "bg-red-100 text-red-800",
  failed_reported: "bg-orange-100 text-orange-800",
};

export function AdminOrderList({ initialOrders }: AdminOrderListProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [updating, setUpdating] = useState<string | null>(null);
  const supabase = createClient();

  async function updateStatus(orderId: string, newStatus: OrderStatus) {
    setUpdating(orderId);

    try {
      if (newStatus === "delivered") {
        await reviewOrder(orderId, "confirm_delivery");
        return;
      }

      if (newStatus === "failed") {
        await reviewOrder(orderId, "confirm_failed");
        return;
      }

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

  async function reviewOrder(orderId: string, action: "confirm_delivery" | "confirm_failed" | "reject_failed") {
    setUpdating(orderId + action);
    try {
      const { data, error } = await supabase.rpc("admin_review_order", {
        p_order_id: orderId,
        p_action: action,
        p_note: null,
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

      toast.success(
        action === "confirm_delivery"
          ? "Delivery confirmed"
          : action === "confirm_failed"
            ? "Failed order confirmed and refund processed if applicable"
            : "Failed report rejected"
      );

      window.location.reload();
    } catch {
      toast.error("Failed to review order");
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
                  <span>•</span>
                  <span>{order.billing_mode === "automatic" ? "Auto drain" : "Confirm drain"}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Charge: {order.charge_status}</span>
                  <span>•</span>
                  <span>User: {order.user_delivery_status}</span>
                  <span>•</span>
                  <span>Admin: {order.admin_delivery_status}</span>
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
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <Button
                size="sm"
                variant="outline"
                onClick={() => reviewOrder(order.id, "confirm_delivery")}
                disabled={Boolean(updating) || order.status === "cancelled" || order.status === "failed"}
              >
                {updating === order.id + "confirm_delivery" ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <Check className="h-4 w-4 mr-1" />
                )}
                Confirm delivered
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => reviewOrder(order.id, "confirm_failed")}
                disabled={Boolean(updating) || order.user_delivery_status !== "failed_reported"}
              >
                {updating === order.id + "confirm_failed" ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <AlertTriangle className="h-4 w-4 mr-1" />
                )}
                Confirm failed + refund
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => reviewOrder(order.id, "reject_failed")}
                disabled={Boolean(updating) || order.user_delivery_status !== "failed_reported"}
              >
                {updating === order.id + "reject_failed" ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <ShieldCheck className="h-4 w-4 mr-1" />
                )}
                Reject failed claim
              </Button>
            </div>
            {order.failure_note ? (
              <p className="text-xs text-muted-foreground mt-2">Note: {order.failure_note}</p>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
