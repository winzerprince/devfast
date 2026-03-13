"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Check, ImageIcon, Loader2, Package, X } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import Image from "next/image";
import type { Order, CancelOrderResult, OrderOutcomeResult } from "@/lib/types";

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

  async function handleCancel(orderId: string) {
    setCancelling(orderId);
    try {
      const { data, error } = await supabase.rpc("cancel_order", { p_order_id: orderId });
      if (error) { toast.error(error.message); return; }

      const result = data as unknown as CancelOrderResult;
      if (result.error) { toast.error(result.error); return; }

      toast.success(`Order cancelled. ${Number(result.refunded).toLocaleString()} UGX refunded.`);
      window.location.reload();
    } catch {
      toast.error("Failed to cancel order");
    } finally {
      setCancelling(null);
    }
  }

  async function reportOutcome(orderId: string, outcome: "delivered" | "failed") {
    setUpdatingOutcome(orderId + outcome);
    try {
      const { data, error } = await supabase.rpc("report_my_order_outcome", {
        p_order_id: orderId,
        p_outcome: outcome,
        p_note: null,
      });
      if (error) { toast.error(error.message); return; }

      const result = data as unknown as OrderOutcomeResult;
      if (result.error) { toast.error(result.error); return; }

      toast.success(outcome === "delivered" ? "Marked as delivered" : "Marked as failed for admin review");
      window.location.reload();
    } catch {
      toast.error("Failed to update order outcome");
    } finally {
      setUpdatingOutcome(null);
    }
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-2xl border bg-muted/40 py-10 text-center text-sm text-muted-foreground">
        No upcoming orders. Place one from the Order tab!
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <div key={order.id} className="rounded-2xl border bg-card overflow-hidden">
          {/* Item row */}
          <div className="flex items-start gap-3 p-4">
            {/* Thumbnail */}
            <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-muted border">
              {order.menu_item?.image_url ? (
                <Image src={order.menu_item.image_url} alt={order.menu_item.name ?? ""} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="h-5 w-5 text-muted-foreground/40" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm leading-tight">{order.menu_item?.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {format(new Date(order.order_date), "EEE, MMM d")} &middot; ×{order.quantity} &middot;{" "}
                {Number(order.total_price).toLocaleString()} UGX
              </p>

              {/* Meta pills */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                <Badge variant="secondary" className={`text-xs ${statusStyles[order.status] || ""}`}>
                  {order.status.replace("_", " ")}
                </Badge>
                <Badge variant="outline" className="text-xs text-muted-foreground">
                  {paymentMethodLabels[order.payment_method] ?? order.payment_method}
                </Badge>
              </div>
            </div>

            {/* Cancel */}
            {order.status === "pending" && (
              <button
                onClick={() => handleCancel(order.id)}
                disabled={cancelling === order.id}
                className="h-8 w-8 rounded-full border flex items-center justify-center text-muted-foreground hover:text-destructive hover:border-destructive/30 active:scale-95 transition-all shrink-0"
              >
                {cancelling === order.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <X className="h-4 w-4" />
                )}
              </button>
            )}
          </div>

          {/* Packaging notes */}
          {order.packaging_notes && (
            <div className="flex items-start gap-2 mx-4 mb-3 px-3 py-2 rounded-xl bg-muted/50 text-xs text-muted-foreground">
              <Package className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>{order.packaging_notes}</span>
            </div>
          )}

          {/* Outcome actions */}
          {order.order_date <= today &&
            order.status !== "cancelled" &&
            order.status !== "failed" &&
            order.status !== "delivered" && (
              <div className="grid grid-cols-2 gap-2 px-4 pb-4">
                <button
                  disabled={Boolean(updatingOutcome)}
                  onClick={() => reportOutcome(order.id, "delivered")}
                  className="flex items-center justify-center gap-1.5 min-h-[44px] rounded-xl border text-sm font-medium text-primary border-primary/30 bg-primary/8 active:scale-[0.98] transition-transform disabled:opacity-50"
                >
                  {updatingOutcome === order.id + "delivered" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  I received it
                </button>
                <button
                  disabled={Boolean(updatingOutcome)}
                  onClick={() => reportOutcome(order.id, "failed")}
                  className="flex items-center justify-center gap-1.5 min-h-[44px] rounded-xl border text-sm font-medium text-destructive border-destructive/20 bg-destructive/5 active:scale-[0.98] transition-transform disabled:opacity-50"
                >
                  {updatingOutcome === order.id + "failed" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <AlertTriangle className="h-4 w-4" />
                  )}
                  Not delivered
                </button>
              </div>
            )}
        </div>
      ))}
    </div>
  );
}
