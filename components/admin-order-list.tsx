"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Banknote, Check, ImageIcon, Loader2, ShieldCheck, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import Image from "next/image";
import type { Order, OrderStatus, MarkPaidResult } from "@/lib/types";

interface AdminOrderListProps {
  initialOrders: Order[];
}

const statusAccent: Record<string, string> = {
  pending: "border-l-border",
  confirmed: "border-l-primary",
  delivered: "border-l-primary",
  cancelled: "border-l-border",
  failed: "border-l-destructive",
  failed_reported: "border-l-destructive",
};

const statusBadge: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  confirmed: "bg-primary/10 text-primary",
  delivered: "bg-primary/10 text-primary",
  cancelled: "bg-muted text-muted-foreground",
  failed: "bg-destructive/10 text-destructive",
  failed_reported: "bg-destructive/10 text-destructive",
};

export function AdminOrderList({ initialOrders }: AdminOrderListProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [updating, setUpdating] = useState<string | null>(null);
  const supabase = createClient();

  async function updateStatus(orderId: string, newStatus: OrderStatus) {
    setUpdating(orderId + newStatus);
    try {
      const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", orderId);
      if (error) { toast.error(error.message); return; }
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
      if (error) { toast.error(error.message); return; }

      const result = data as { error?: string } | null;
      if (result?.error) { toast.error(result.error); return; }

      toast.success(
        action === "confirm_delivery" ? "Delivery confirmed" :
        action === "confirm_failed" ? "Failed order confirmed, refund processed" :
        "Failed report rejected"
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
      const { data, error } = await supabase.rpc("admin_mark_paid", { p_order_id: orderId });
      if (error) { toast.error(error.message); return; }

      const result = data as MarkPaidResult | null;
      if (result?.error) { toast.error(result.error); return; }

      toast.success("Order marked as paid");
      setOrders(orders.map((o) => (o.id === orderId ? { ...o, payment_status: "paid" as const } : o)));
    } catch {
      toast.error("Failed to mark as paid");
    } finally {
      setUpdating(null);
    }
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-2xl border bg-muted/40 py-10 text-center text-sm text-muted-foreground">
        No orders found.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => {
        const isUpdating = updating?.startsWith(order.id) ?? false;
        const canActOnDelivery = order.status !== "cancelled" && order.status !== "failed" && order.status !== "delivered";
        const hasFailedClaim = order.user_delivery_status === "failed_reported";

        return (
          <div
            key={order.id}
            className={`rounded-2xl border-l-4 border border-l-[var(--accent)] bg-card overflow-hidden ${statusAccent[order.status] || "border-l-border"}`}
          >
            {/* Header row */}
            <div className="flex items-center justify-between gap-2 px-4 pt-3 pb-2">
              <Badge variant="secondary" className={`text-xs font-semibold capitalize ${statusBadge[order.status] || ""}`}>
                {order.status.replace("_", " ")}
              </Badge>
              <span className="text-xs text-muted-foreground">{format(new Date(order.order_date), "EEE, MMM d")}</span>
            </div>

            {/* Customer name */}
            <div className="px-4 pb-3">
              <p className="font-bold text-base leading-tight">{order.profile?.full_name || "Unknown"}</p>
            </div>

            {/* Food item row */}
            <div className="mx-4 mb-3 flex items-center gap-3 rounded-2xl bg-muted/40 border p-3">
              <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-muted">
                {order.menu_item?.image_url ? (
                  <Image src={order.menu_item.image_url} alt={order.menu_item.name ?? ""} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="h-5 w-5 text-muted-foreground/40" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm leading-tight truncate">{order.menu_item?.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  x{order.quantity} &middot; {Number(order.total_price).toLocaleString()} UGX
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
            </div>

            {/* Meta pills */}
            <div className="px-4 pb-3 flex flex-wrap gap-1.5">
              <span className="text-xs bg-muted rounded-full px-2.5 py-1 text-muted-foreground">
                {order.billing_mode === "automatic" ? "Auto drain" : "Confirm drain"}
              </span>
              <span className="text-xs bg-muted rounded-full px-2.5 py-1 text-muted-foreground capitalize">
                Charge: {order.charge_status}
              </span>
              {order.payment_method === "pay_on_delivery" && (
                <Badge
                  variant="secondary"
                  className={`text-xs ${order.payment_status === "unpaid" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}
                >
                  {order.payment_status === "unpaid" ? "Unpaid · Pay on delivery" : "Paid · Pay on delivery"}
                </Badge>
              )}
              {hasFailedClaim && (
                <Badge variant="secondary" className="text-xs bg-destructive/10 text-destructive">
                  User reported: not delivered
                </Badge>
              )}
            </div>

            {/* Failure note */}
            {order.failure_note && (
              <p className="px-4 pb-2 text-xs text-muted-foreground italic">"{order.failure_note}"</p>
            )}

            {/* Action buttons */}
            {(() => {
              const actions = [];

              if (order.status === "pending") {
                actions.push(
                  <button
                    key="confirm"
                    disabled={isUpdating}
                    onClick={() => updateStatus(order.id, "confirmed")}
                    className="flex items-center justify-center gap-1.5 min-h-[44px] rounded-xl border text-sm font-medium text-primary border-primary/30 bg-primary/8 active:scale-[0.98] transition-transform disabled:opacity-50"
                  >
                    {updating === order.id + "confirmed" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    Confirm order
                  </button>
                );
              }

              if (canActOnDelivery) {
                actions.push(
                  <button
                    key="deliver"
                    disabled={isUpdating}
                    onClick={() => reviewOrder(order.id, "confirm_delivery")}
                    className="flex items-center justify-center gap-1.5 min-h-[44px] rounded-xl border text-sm font-medium text-primary border-primary/30 bg-primary/8 active:scale-[0.98] transition-transform disabled:opacity-50"
                  >
                    {updating === order.id + "confirm_delivery" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    Mark delivered
                  </button>
                );
              }

              if (hasFailedClaim) {
                actions.push(
                  <button
                    key="failed"
                    disabled={isUpdating}
                    onClick={() => reviewOrder(order.id, "confirm_failed")}
                    className="flex items-center justify-center gap-1.5 min-h-[44px] rounded-xl border text-sm font-medium text-destructive border-destructive/20 bg-destructive/5 active:scale-[0.98] transition-transform disabled:opacity-50"
                  >
                    {updating === order.id + "confirm_failed" ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
                    Confirm failed + refund
                  </button>,
                  <button
                    key="reject"
                    disabled={isUpdating}
                    onClick={() => reviewOrder(order.id, "reject_failed")}
                    className="flex items-center justify-center gap-1.5 min-h-[44px] rounded-xl border text-sm font-medium text-muted-foreground border-border bg-muted/40 active:scale-[0.98] transition-transform disabled:opacity-50"
                  >
                    {updating === order.id + "reject_failed" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                    Reject claim
                  </button>
                );
              }

              if (order.payment_method === "pay_on_delivery" && order.payment_status === "unpaid") {
                actions.push(
                  <button
                    key="paid"
                    disabled={isUpdating}
                    onClick={() => markPaid(order.id)}
                    className="flex items-center justify-center gap-1.5 min-h-[44px] rounded-xl border text-sm font-medium text-primary border-primary/30 bg-primary/8 active:scale-[0.98] transition-transform disabled:opacity-50"
                  >
                    {updating === order.id + "mark_paid" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Banknote className="h-4 w-4" />}
                    Mark paid
                  </button>
                );
              }

              if (actions.length === 0) return null;

              return (
                <div className={`px-4 pb-4 grid gap-2 ${actions.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                  {actions}
                </div>
              );
            })()}
          </div>
        );
      })}
    </div>
  );
}
