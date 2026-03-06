"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Check, ImageIcon, Loader2, ShieldCheck, Banknote } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import Image from "next/image";
import type { Order, OrderStatus, MarkPaidResult } from "@/lib/types";

interface AdminOrderListProps {
  initialOrders: Order[];
}

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

  async function markPaid(orderId: string) {
    setUpdating(orderId + "mark_paid");
    try {
      const { data, error } = await supabase.rpc("admin_mark_paid", {
        p_order_id: orderId,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      const result = data as MarkPaidResult | null;
      if (result?.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Order marked as paid");
      setOrders(orders.map((o) => (o.id === orderId ? { ...o, payment_status: "paid" as const } : o)));
    } catch {
      toast.error("Failed to mark as paid");
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
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                {order.menu_item?.image_url ? (
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 border">
                    <Image src={order.menu_item.image_url} alt={order.menu_item.name ?? ""} fill className="object-cover" />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0 border">
                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
              <div className="space-y-1 min-w-0 flex-1">
                <div className="font-medium text-sm truncate">
                  {order.profile?.full_name || "Unknown"}
                </div>
                <div className="text-sm text-muted-foreground">
                  {order.menu_item?.name} x{order.quantity}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                  <span>{format(new Date(order.order_date), "EEE, MMM d")}</span>
                  <span>{Number(order.total_price).toLocaleString()} UGX</span>
                  <span>•</span>
                  <span>{order.billing_mode === "automatic" ? "Auto drain" : "Confirm drain"}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                  <span>Charge: {order.charge_status}</span>
                  <span>•</span>
                  <span>User: {order.user_delivery_status}</span>
                  <span>•</span>
                  <span>Admin: {order.admin_delivery_status}</span>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  {order.payment_method === "pay_on_delivery" && (
                    <Badge variant="outline" className="text-xs">Pay on Delivery</Badge>
                  )}
                  {order.payment_method === "pay_on_delivery" && order.payment_status === "unpaid" && (
                    <Badge variant="destructive" className="text-xs">Unpaid</Badge>
                  )}
                  {order.payment_method === "pay_on_delivery" && order.payment_status === "paid" && (
                    <Badge className="text-xs bg-green-100 text-green-800">Paid</Badge>
                  )}
                </div>
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
              {order.payment_method === "pay_on_delivery" && order.payment_status === "unpaid" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-green-600 text-green-700 hover:bg-green-50"
                  onClick={() => markPaid(order.id)}
                  disabled={Boolean(updating)}
                >
                  {updating === order.id + "mark_paid" ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <Banknote className="h-4 w-4 mr-1" />
                  )}
                  Mark Paid
                </Button>
              )}
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
