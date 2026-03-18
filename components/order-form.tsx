"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Loader2, Minus, Plus, Sparkles, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import type { DrainMode, MenuItem, PaymentMethod, PlaceOrderResult } from "@/lib/types";
import { DEBT_BLOCK_THRESHOLD } from "@/lib/types";
import {
  buildOrderLines,
  calculateOrderTotal,
  canPlaceOrder,
  hasInsufficientBalance,
} from "@/lib/order-rules";

interface OrderFormProps {
  menuItems: MenuItem[];
  availableItemIds: string[] | null;
  balance: number;
  drainMode: DrainMode;
  orderDateLabel: string;
  canOrder: boolean;
  cutoffMessage: string;
  isDebtBlocked: boolean;
}

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string; description: (drainMode: DrainMode) => string }[] = [
  {
    value: "prepaid",
    label: "From Balance",
    description: (drainMode) =>
      drainMode === "automatic"
        ? "Deducted from your wallet immediately when order is placed."
        : "Deducted from your wallet after delivery is confirmed.",
  },
  {
    value: "pay_on_delivery",
    label: "On Delivery",
    description: () => "Pay cash on delivery. Your wallet is updated when admin confirms delivery.",
  },
  {
    value: "pay_later",
    label: "Pay Later",
    description: () => "Receive now, settle later. Your wallet balance will reflect the debt.",
  },
];

export function OrderForm({
  menuItems,
  availableItemIds,
  balance,
  drainMode,
  orderDateLabel,
  canOrder,
  cutoffMessage,
  isDebtBlocked,
}: OrderFormProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("prepaid");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [packagingNotes, setPackagingNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const displayItems = availableItemIds
    ? menuItems.filter((item) => availableItemIds.includes(item.id))
    : menuItems;

  function increment(id: string) {
    if (!canOrder || isDebtBlocked) return;
    setQuantities((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  }

  function decrement(id: string) {
    setQuantities((prev) => {
      const next = { ...prev };
      if ((next[id] || 0) <= 1) delete next[id];
      else next[id]--;
      return next;
    });
  }

  const orderLines = buildOrderLines(quantities);
  const orderTotal = calculateOrderTotal(orderLines, menuItems);
  const insufficientBalance = hasInsufficientBalance(balance, orderTotal, paymentMethod, drainMode);
  const canAfford = canPlaceOrder(orderLines, isDebtBlocked, insufficientBalance);

  async function handlePlaceOrder() {
    if (orderLines.length === 0 || !canOrder || isDebtBlocked) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("place_multi_order", {
        p_items: orderLines,
        p_payment_method: paymentMethod,
        p_packaging_notes: packagingNotes.trim() || null,
      });

      if (error) { toast.error(error.message); return; }

      const result = data as unknown as PlaceOrderResult;
      if (result.error) { toast.error(result.error); return; }

      const methodLabels: Record<PaymentMethod, string> = {
        prepaid: "",
        pay_on_delivery: " · Pay on delivery",
        pay_later: " · Pay later",
      };
      toast.success(`Order placed! ${Number(result.total).toLocaleString()} UGX${methodLabels[paymentMethod]}`);
      setQuantities({});
      setPackagingNotes("");
      window.location.reload();
    } catch {
      toast.error("Failed to place order");
    } finally {
      setLoading(false);
    }
  }

  const selectedOption = PAYMENT_OPTIONS.find((o) => o.value === paymentMethod)!;

  return (
    <div className="space-y-4">
      {/* Debt block banner */}
      {isDebtBlocked && (
        <div className="flex items-start gap-2.5 rounded-2xl bg-destructive/10 border border-destructive/20 px-4 py-3.5 text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold">Orders suspended</p>
            <p className="text-xs mt-0.5 text-destructive/80">
              Your outstanding balance has exceeded {Math.abs(DEBT_BLOCK_THRESHOLD).toLocaleString()} UGX.
              Please settle your debt with the admin before placing new orders.
            </p>
          </div>
        </div>
      )}

      {/* Date info bar */}
      <div className="rounded-2xl bg-primary/8 border border-primary/20 px-4 py-3">
        <p className="text-sm font-semibold">Ordering for {orderDateLabel}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{cutoffMessage}</p>
      </div>

      {/* Payment method — 3-option segmented control */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Payment</p>
        <div className="flex rounded-xl border overflow-hidden">
          {PAYMENT_OPTIONS.map((opt, idx) => (
            <button
              key={opt.value}
              onClick={() => setPaymentMethod(opt.value)}
              disabled={isDebtBlocked}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors active:opacity-80 disabled:opacity-40 ${
                idx > 0 ? "border-l" : ""
              } ${
                paymentMethod === opt.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          {selectedOption.description(drainMode)}
        </p>
      </div>

      {/* Item picker */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {availableItemIds ? "Available Today" : "Menu"}
        </p>

        {availableItemIds && displayItems.length === 0 ? (
          <div className="rounded-2xl border bg-muted/40 py-8 text-center text-sm text-muted-foreground">
            No items available for this date.
          </div>
        ) : (
          <div className="space-y-2">
            {displayItems.map((item) => {
              const qty = quantities[item.id] || 0;
              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 rounded-2xl border p-3 transition-colors ${
                    qty > 0 ? "border-primary/40 bg-primary/5" : "bg-card"
                  } ${isDebtBlocked ? "opacity-50" : ""}`}
                >
                  {/* Thumbnail */}
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-muted">
                    {item.image_url ? (
                      <Image src={item.image_url} alt={item.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="h-5 w-5 text-muted-foreground/40" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-medium text-sm leading-tight">{item.name}</span>
                      {item.is_special && (
                        <Badge variant="secondary" className="text-xs bg-primary/10 text-primary gap-1 py-0">
                          <Sparkles className="h-2.5 w-2.5" /> Special
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm font-semibold mt-0.5">
                      {Number(item.price).toLocaleString()}{" "}
                      <span className="text-xs font-normal text-muted-foreground">UGX</span>
                    </p>
                  </div>

                  {/* Stepper */}
                  {qty === 0 ? (
                    <button
                      onClick={() => increment(item.id)}
                      disabled={!canOrder || loading || isDebtBlocked}
                      className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center active:scale-95 transition-transform disabled:opacity-40 shrink-0"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => decrement(item.id)}
                        disabled={loading}
                        className="h-8 w-8 rounded-full border flex items-center justify-center active:scale-95 transition-transform"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-5 text-center font-semibold text-sm">{qty}</span>
                      <button
                        onClick={() => increment(item.id)}
                        disabled={loading || isDebtBlocked}
                        className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center active:scale-95 transition-transform"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Order summary + packaging notes + place button */}
      {orderLines.length > 0 && (
        <div className="rounded-2xl border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {orderLines.length} item type{orderLines.length > 1 ? "s" : ""}
            </span>
            <span className="text-lg font-bold">
              {orderTotal.toLocaleString()}{" "}
              <span className="text-xs font-normal text-muted-foreground">UGX</span>
            </span>
          </div>

          {/* Packaging notes */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Packaging instructions <span className="font-normal">(optional)</span>
            </label>
            <textarea
              value={packagingNotes}
              onChange={(e) => setPackagingNotes(e.target.value)}
              placeholder="e.g. Pack separately, no onions on the chapati…"
              rows={2}
              className="w-full rounded-xl border bg-background px-3 py-2 text-sm resize-none placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
          </div>

          {insufficientBalance && (
            <p className="text-xs text-destructive">
              Insufficient balance — {Number(balance).toLocaleString()} UGX available
            </p>
          )}

          <Button
            onClick={handlePlaceOrder}
            className="w-full min-h-[48px] active:scale-[0.98] transition-transform"
            disabled={!canAfford || !canOrder || loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {paymentMethod === "pay_on_delivery"
              ? "Place Order · Pay on Delivery"
              : paymentMethod === "pay_later"
                ? "Place Order · Pay Later"
                : "Place Order"}
          </Button>
        </div>
      )}
    </div>
  );
}
