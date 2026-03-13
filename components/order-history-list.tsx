"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { AlertTriangle, Check, ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import type { Order, OrderOutcomeResult } from "@/lib/types";
import { groupOrders, type OrderGroup } from "@/lib/order-groups";

interface OrderHistoryListProps {
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

export function OrderHistoryList({ orders }: OrderHistoryListProps) {
  const [updatingOutcome, setUpdatingOutcome] = useState<string | null>(null);
  const supabase = createClient();
  const today = new Date().toISOString().split("T")[0];

  const groups = groupOrders(orders);

  async function reportOutcome(group: OrderGroup, outcome: "delivered" | "failed") {
    setUpdatingOutcome(group.key + outcome);
    try {
      const eligible = group.orders.filter(
        (o) => o.status !== "cancelled" && o.status !== "delivered" && o.status !== "failed"
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

  return (
    <div className="space-y-3">
      {groups.map((group) => {
        const hasEligibleForOutcome =
          group.order_date <= today &&
          group.orders.some(
            (o) => o.status !== "cancelled" && o.status !== "delivered" && o.status !== "failed"
          );

        return (
          <div key={group.key} className="rounded-2xl border bg-card p-4 space-y-3">
            {/* Header: date + total + status */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-sm">{format(new Date(group.order_date), "EEE, MMM d, yyyy")}</p>
                <div className="flex items-center gap-1.5 flex-wrap mt-1">
                  <Badge variant="secondary" className={`text-xs ${statusStyles[group.status] || ""}`}>
                    {group.status}
                  </Badge>
                  {group.payment_method === "pay_on_delivery" &&
                    group.orders.some((o) => o.payment_status === "unpaid") && (
                      <Badge variant="destructive" className="text-xs">Unpaid</Badge>
                    )}
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-bold text-sm">{group.total.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">UGX</p>
              </div>
            </div>

            {/* Items list */}
            <div className="rounded-xl border overflow-hidden divide-y bg-muted/20">
              {group.orders.map((order) => (
                <div key={order.id} className="flex items-center gap-3 p-3">
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-muted border">
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
                    <p className="text-xs text-muted-foreground mt-0.5">×{order.quantity}</p>
                  </div>
                  <p className="text-sm font-medium shrink-0">{Number(order.total_price).toLocaleString()} UGX</p>
                </div>
              ))}
            </div>

            {/* Outcome actions */}
            {hasEligibleForOutcome && (
              <div className="grid grid-cols-2 gap-2">
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
