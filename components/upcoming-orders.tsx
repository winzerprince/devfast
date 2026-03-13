"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Check, ImageIcon, Loader2, Package, X } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import Image from "next/image";
import type { Order, CancelOrderResult, OrderOutcomeResult } from "@/lib/types";
import { groupOrders, type OrderGroup } from "@/lib/order-groups";

interface UpcomingOrdersProps {
  orders: Order[];
}

const statusStyles: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  confirmed: "bg-primary/10 text-primary",
  cancelled: "bg-muted text-muted-foreground",
  delivered: "bg-primary/10 text-primary",
  failed: "bg-destructive/10 text-destructive",
  failed_reported: "bg-destructive/10 text-destructive",
};

const paymentMethodLabels: Record<string, string> = {
  prepaid: "Wallet",
  pay_on_delivery: "On Delivery",
  pay_later: "Pay Later",
};

export function UpcomingOrders({ orders }: UpcomingOrdersProps) {
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [updatingOutcome, setUpdatingOutcome] = useState<string | null>(null);
  const supabase = createClient();
  const today = new Date().toISOString().split("T")[0];

  const groups = groupOrders(orders);

  async function handleCancel(group: OrderGroup) {
    setCancelling(group.key);
    try {
      const pendingOrders = group.orders.filter((o) => o.status === "pending");
      let totalRefunded = 0;
      for (const order of pendingOrders) {
        const { data, error } = await supabase.rpc("cancel_order", { p_order_id: order.id });
        if (error) { toast.error(error.message); return; }
        const result = data as unknown as CancelOrderResult;
        if (result.error) { toast.error(result.error); return; }
        totalRefunded += Number(result.refunded ?? 0);
      }
      toast.success(`Order cancelled. ${totalRefunded.toLocaleString()} UGX refunded.`);
      window.location.reload();
    } catch {
      toast.error("Failed to cancel order");
    } finally {
      setCancelling(null);
    }
  }

  async function reportOutcome(group: OrderGroup, outcome: "delivered" | "failed") {
    setUpdatingOutcome(group.key + outcome);
    try {
      const eligible = group.orders.filter(
        (o) => o.status !== "cancelled" && o.status !== "failed" && o.status !== "delivered"
      );
      for (const order of eligible) {
        const { data, error } = await supabase.rpc("report_my_order_outcome", {
          p_order_id: order.id,
          p_outcome: outcome,
          p_note: null,
        });
        if (error) { toast.error(error.message); return; }
        const result = data as unknown as OrderOutcomeResult;
        if (result.error) { toast.error(result.error); return; }
      }
      toast.success(outcome === "delivered" ? "Marked as delivered" : "Marked as failed for admin review");
      window.location.reload();
    } catch {
      toast.error("Failed to update order outcome");
    } finally {
      setUpdatingOutcome(null);
    }
  }

  if (groups.length === 0) {
    return (
      <div className="rounded-2xl border bg-muted/40 py-10 text-center text-sm text-muted-foreground">
        No upcoming orders. Place one from the Order tab!
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {groups.map((group) => {
        const hasPending = group.orders.some((o) => o.status === "pending");
        const hasEligibleForOutcome =
          group.order_date <= today &&
          group.orders.some(
            (o) => o.status !== "cancelled" && o.status !== "failed" && o.status !== "delivered"
          );

        return (
          <div key={group.key} className="rounded-2xl border bg-card overflow-hidden">
            {/* Header: date + total + status + cancel */}
            <div className="flex items-start justify-between gap-2 px-4 pt-4 pb-3">
              <div>
                <p className="font-semibold text-sm">{format(new Date(group.order_date), "EEE, MMM d")}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{group.total.toLocaleString()} UGX total</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex flex-wrap gap-1.5 justify-end">
                  <Badge variant="secondary" className={`text-xs ${statusStyles[group.status] || ""}`}>
                    {group.status.replace("_", " ")}
                  </Badge>
                  <Badge variant="outline" className="text-xs text-muted-foreground">
                    {paymentMethodLabels[group.payment_method] ?? group.payment_method}
                  </Badge>
                </div>
                {hasPending && (
                  <button
                    onClick={() => handleCancel(group)}
                    disabled={cancelling === group.key}
                    className="h-8 w-8 rounded-full border flex items-center justify-center text-muted-foreground hover:text-destructive hover:border-destructive/30 active:scale-95 transition-all shrink-0"
                  >
                    {cancelling === group.key ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Items list */}
            <div className="mx-4 mb-3 rounded-2xl border overflow-hidden divide-y bg-muted/20">
              {group.orders.map((order) => (
                <div key={order.id} className="flex items-center gap-3 p-3">
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-muted border">
                    {order.menu_item?.image_url ? (
                      <Image src={order.menu_item.image_url} alt={order.menu_item.name ?? ""} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="h-4 w-4 text-muted-foreground/40" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm leading-tight">{order.menu_item?.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      ×{order.quantity} &middot; {Number(order.total_price).toLocaleString()} UGX
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Packaging notes */}
            {group.packaging_notes && (
              <div className="flex items-start gap-2 mx-4 mb-3 px-3 py-2 rounded-xl bg-muted/50 text-xs text-muted-foreground">
                <Package className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>{group.packaging_notes}</span>
              </div>
            )}

            {/* Outcome actions */}
            {hasEligibleForOutcome && (
              <div className="grid grid-cols-2 gap-2 px-4 pb-4">
                <button
                  disabled={Boolean(updatingOutcome)}
                  onClick={() => reportOutcome(group, "delivered")}
                  className="flex items-center justify-center gap-1.5 min-h-[44px] rounded-xl border text-sm font-medium text-primary border-primary/30 bg-primary/8 active:scale-[0.98] transition-transform disabled:opacity-50"
                >
                  {updatingOutcome === group.key + "delivered" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  I received it
                </button>
                <button
                  disabled={Boolean(updatingOutcome)}
                  onClick={() => reportOutcome(group, "failed")}
                  className="flex items-center justify-center gap-1.5 min-h-[44px] rounded-xl border text-sm font-medium text-destructive border-destructive/20 bg-destructive/5 active:scale-[0.98] transition-transform disabled:opacity-50"
                >
                  {updatingOutcome === group.key + "failed" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <AlertTriangle className="h-4 w-4" />
                  )}
                  Not delivered
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
