"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Banknote, Check, ImageIcon, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import Image from "next/image";
import type { Order, OrderStatus, MarkPaidResult } from "@/lib/types";
import { groupOrders, type OrderGroup } from "@/lib/order-groups";

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

  const groups = groupOrders(orders);

  async function updateStatus(orderId: string, newStatus: OrderStatus) {
    const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", orderId);
    if (error) throw new Error(error.message);
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
  }

  async function reviewOrder(orderId: string, action: "confirm_delivery" | "confirm_failed" | "reject_failed") {
    const { data, error } = await supabase.rpc("admin_review_order", { p_order_id: orderId, p_action: action, p_note: null });
    if (error) throw new Error(error.message);
    const result = data as { error?: string } | null;
    if (result?.error) throw new Error(result.error);
  }

  async function markPaid(orderId: string) {
    const { data, error } = await supabase.rpc("admin_mark_paid", { p_order_id: orderId });
    if (error) throw new Error(error.message);
    const result = data as MarkPaidResult | null;
    if (result?.error) throw new Error(result.error);
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, payment_status: "paid" as const } : o)));
  }

  async function handleGroupAction(
    group: OrderGroup,
    action: "confirm" | "deliver" | "confirm_failed" | "reject_failed" | "mark_paid"
  ) {
    const key = group.key + action;
    setUpdating(key);
    try {
      if (action === "confirm") {
        for (const o of group.orders.filter((o) => o.status === "pending")) {
          await updateStatus(o.id, "confirmed");
        }
        toast.success("Order confirmed");
      } else if (action === "deliver") {
        for (const o of group.orders.filter(
          (o) => o.status !== "cancelled" && o.status !== "failed" && o.status !== "delivered"
        )) {
          await reviewOrder(o.id, "confirm_delivery");
        }
        toast.success("Delivery confirmed");
        window.location.reload();
      } else if (action === "confirm_failed") {
        for (const o of group.orders.filter((o) => o.user_delivery_status === "failed_reported")) {
          await reviewOrder(o.id, "confirm_failed");
        }
        toast.success("Failed order confirmed, refund processed");
        window.location.reload();
      } else if (action === "reject_failed") {
        for (const o of group.orders.filter((o) => o.user_delivery_status === "failed_reported")) {
          await reviewOrder(o.id, "reject_failed");
        }
        toast.success("Failed report rejected");
        window.location.reload();
      } else if (action === "mark_paid") {
        for (const o of group.orders.filter(
          (o) => o.payment_method === "pay_on_delivery" && o.payment_status === "unpaid"
        )) {
          await markPaid(o.id);
        }
        toast.success("Order marked as paid");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update order");
    } finally {
      setUpdating(null);
    }
  }

  if (groups.length === 0) {
    return (
      <div className="rounded-2xl border bg-muted/40 py-10 text-center text-sm text-muted-foreground">
        No orders found.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {groups.map((group) => {
        const isUpdating = updating?.startsWith(group.key) ?? false;

        return (
          <div
            key={group.key}
            className={`rounded-2xl border-l-4 border border-l-[var(--accent)] bg-card overflow-hidden ${statusAccent[group.status] || "border-l-border"}`}
          >
            {/* Header row */}
            <div className="flex items-center justify-between gap-2 px-4 pt-3 pb-2">
              <Badge variant="secondary" className={`text-xs font-semibold capitalize ${statusBadge[group.status] || ""}`}>
                {group.status.replace("_", " ")}
              </Badge>
              <span className="text-xs text-muted-foreground">{format(new Date(group.order_date), "EEE, MMM d")}</span>
            </div>

            {/* Customer name + total */}
            <div className="px-4 pb-3 flex items-baseline justify-between gap-2">
              <p className="font-bold text-base leading-tight">{group.profile?.full_name || "Unknown"}</p>
              <p className="text-sm font-semibold shrink-0">{group.total.toLocaleString()} UGX</p>
            </div>

            {/* Items list */}
            <div className="mx-4 mb-3 rounded-2xl bg-muted/40 border overflow-hidden divide-y">
              {group.orders.map((order) => (
                <div key={order.id} className="flex items-center gap-3 p-3">
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-muted">
                    {order.menu_item?.image_url ? (
                      <Image src={order.menu_item.image_url} alt={order.menu_item.name ?? ""} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="h-4 w-4 text-muted-foreground/40" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm leading-tight truncate">{order.menu_item?.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      ×{order.quantity} &middot; {Number(order.total_price).toLocaleString()} UGX
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Packaging notes */}
            {group.packaging_notes && (
              <p className="px-4 pb-2 text-xs text-muted-foreground italic">"{group.packaging_notes}"</p>
            )}

            {/* Meta pills */}
            <div className="px-4 pb-3 flex flex-wrap gap-1.5">
              <span className="text-xs bg-muted rounded-full px-2.5 py-1 text-muted-foreground">
                {group.billing_mode === "automatic" ? "Auto drain" : "Confirm drain"}
              </span>
              <span className="text-xs bg-muted rounded-full px-2.5 py-1 text-muted-foreground capitalize">
                Charge: {group.orders[0].charge_status}
              </span>
              {group.payment_method === "pay_on_delivery" && (
                <Badge
                  variant="secondary"
                  className={`text-xs ${group.orders.some((o) => o.payment_status === "unpaid") ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}
                >
                  {group.orders.some((o) => o.payment_status === "unpaid") ? "Unpaid · Pay on delivery" : "Paid · Pay on delivery"}
                </Badge>
              )}
              {group.hasFailedClaim && (
                <Badge variant="secondary" className="text-xs bg-destructive/10 text-destructive">
                  User reported: not delivered
                </Badge>
              )}
            </div>

            {/* Failure note */}
            {group.orders.find((o) => o.failure_note)?.failure_note && (
              <p className="px-4 pb-2 text-xs text-muted-foreground italic">
                "{group.orders.find((o) => o.failure_note)?.failure_note}"
              </p>
            )}

            {/* Action buttons */}
            {(() => {
              const actions = [];

              if (group.orders.some((o) => o.status === "pending")) {
                actions.push(
                  <button
                    key="confirm"
                    disabled={isUpdating}
                    onClick={() => handleGroupAction(group, "confirm")}
                    className="flex items-center justify-center gap-1.5 min-h-[44px] rounded-xl border text-sm font-medium text-primary border-primary/30 bg-primary/8 active:scale-[0.98] transition-transform disabled:opacity-50"
                  >
                    {updating === group.key + "confirm" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    Confirm order
                  </button>
                );
              }

              if (group.canActOnDelivery) {
                actions.push(
                  <button
                    key="deliver"
                    disabled={isUpdating}
                    onClick={() => handleGroupAction(group, "deliver")}
                    className="flex items-center justify-center gap-1.5 min-h-[44px] rounded-xl border text-sm font-medium text-primary border-primary/30 bg-primary/8 active:scale-[0.98] transition-transform disabled:opacity-50"
                  >
                    {updating === group.key + "deliver" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    Mark delivered
                  </button>
                );
              }

              if (group.hasFailedClaim) {
                actions.push(
                  <button
                    key="failed"
                    disabled={isUpdating}
                    onClick={() => handleGroupAction(group, "confirm_failed")}
                    className="flex items-center justify-center gap-1.5 min-h-[44px] rounded-xl border text-sm font-medium text-destructive border-destructive/20 bg-destructive/5 active:scale-[0.98] transition-transform disabled:opacity-50"
                  >
                    {updating === group.key + "confirm_failed" ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
                    Confirm failed + refund
                  </button>,
                  <button
                    key="reject"
                    disabled={isUpdating}
                    onClick={() => handleGroupAction(group, "reject_failed")}
                    className="flex items-center justify-center gap-1.5 min-h-[44px] rounded-xl border text-sm font-medium text-muted-foreground border-border bg-muted/40 active:scale-[0.98] transition-transform disabled:opacity-50"
                  >
                    {updating === group.key + "reject_failed" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                    Reject claim
                  </button>
                );
              }

              if (group.payment_method === "pay_on_delivery" && group.orders.some((o) => o.payment_status === "unpaid")) {
                actions.push(
                  <button
                    key="paid"
                    disabled={isUpdating}
                    onClick={() => handleGroupAction(group, "mark_paid")}
                    className="flex items-center justify-center gap-1.5 min-h-[44px] rounded-xl border text-sm font-medium text-primary border-primary/30 bg-primary/8 active:scale-[0.98] transition-transform disabled:opacity-50"
                  >
                    {updating === group.key + "mark_paid" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Banknote className="h-4 w-4" />}
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
