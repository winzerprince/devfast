"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { AlertTriangle, Check, ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import type { Order, OrderOutcomeResult } from "@/lib/types";

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

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <div key={order.id} className="rounded-2xl border bg-card p-4 space-y-3">
          <div className="flex items-start gap-3">
            {/* Thumbnail */}
            <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-muted border">
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
                {format(new Date(order.order_date), "EEE, MMM d, yyyy")} &middot; x{order.quantity}
              </p>
              <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                <Badge variant="secondary" className={`text-xs ${statusStyles[order.status] || ""}`}>
                  {order.status}
                </Badge>
                {order.payment_method === "pay_on_delivery" && order.payment_status === "unpaid" && (
                  <Badge variant="destructive" className="text-xs">Unpaid</Badge>
                )}
              </div>
            </div>

            {/* Price */}
            <div className="shrink-0 text-right">
              <p className="font-bold text-sm">{Number(order.total_price).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">UGX</p>
            </div>
          </div>

          {/* Outcome actions */}
          {order.order_date <= today && order.status !== "cancelled" && order.status !== "delivered" && order.status !== "failed" && (
            <div className="grid grid-cols-2 gap-2">
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
