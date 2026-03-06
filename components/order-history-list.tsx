"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { AlertTriangle, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Order, OrderOutcomeResult } from "@/lib/types";

interface OrderHistoryListProps {
  orders: Order[];
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  cancelled: "bg-red-100 text-red-800",
  delivered: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  failed_reported: "bg-orange-100 text-orange-800",
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

      if (error) {
        toast.error(error.message);
        return;
      }

      const result = data as unknown as OrderOutcomeResult;
      if (result.error) {
        toast.error(result.error);
        return;
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
      {orders.map((order) => (
        <Card key={order.id}>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="font-medium">{order.menu_item?.name}</div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{format(new Date(order.order_date), "EEE, MMM d, yyyy")}</span>
                  <span>&middot;</span>
                  <span>x{order.quantity}</span>
                  <span>&middot;</span>
                  <span>{order.billing_mode === "automatic" ? "Auto" : "Confirm"}</span>
                  {order.payment_method === "pay_on_delivery" && (
                    <>
                      <span>&middot;</span>
                      <span>Pay on Delivery</span>
                    </>
                  )}
                </div>
              </div>
              <div className="text-right space-y-1">
                <div className="font-medium">{Number(order.total_price).toLocaleString()} UGX</div>
                <div className="flex items-center gap-1 justify-end">
                  <Badge className={`text-xs ${statusColors[order.status] || ""}`} variant="secondary">
                    {order.status}
                  </Badge>
                  {order.payment_method === "pay_on_delivery" && order.payment_status === "unpaid" && (
                    <Badge variant="destructive" className="text-xs">Unpaid</Badge>
                  )}
                </div>
              </div>
            </div>

            {order.order_date <= today && order.status !== "cancelled" && order.status !== "delivered" && order.status !== "failed" && (
              <div className="flex flex-wrap gap-2 mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={Boolean(updatingOutcome)}
                  onClick={() => reportOutcome(order.id, "delivered")}
                >
                  {updatingOutcome === order.id + "delivered" ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <Check className="h-4 w-4 mr-1" />
                  )}
                  I received it
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={Boolean(updatingOutcome)}
                  onClick={() => reportOutcome(order.id, "failed")}
                >
                  {updatingOutcome === order.id + "failed" ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 mr-1" />
                  )}
                  Not delivered
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
