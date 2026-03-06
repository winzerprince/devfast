"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, ShoppingCart, Sparkles, Trash2, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import type { DrainMode, MenuItem, PaymentMethod, PlaceOrderResult } from "@/lib/types";

interface OrderFormProps {
  menuItems: MenuItem[];
  availableItemIds: string[] | null; // null = no availability set, show all
  balance: number;
  drainMode: DrainMode;
  orderDateLabel: string;
  canOrder: boolean;
  cutoffMessage: string;
}

interface OrderLine {
  id: string;
  menu_item_id: string;
  quantity: number;
}

export function OrderForm({ menuItems, availableItemIds, balance, drainMode, orderDateLabel, canOrder, cutoffMessage }: OrderFormProps) {
  const [selectedItem, setSelectedItem] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [lines, setLines] = useState<OrderLine[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("prepaid");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  // Filter items by availability
  const displayItems = availableItemIds
    ? menuItems.filter((item) => availableItemIds.includes(item.id))
    : menuItems;

  const item = displayItems.find((m) => m.id === selectedItem);
  const previewTotal = item ? item.price * quantity : 0;

  const orderTotal = lines.reduce((sum, line) => {
    const menuItem = menuItems.find((m) => m.id === line.menu_item_id);
    if (!menuItem) return sum;
    return sum + menuItem.price * line.quantity;
  }, 0);

  const canAfford = paymentMethod === "pay_on_delivery"
    ? orderTotal > 0
    : drainMode === "confirmation"
      ? orderTotal > 0
      : balance >= orderTotal && orderTotal > 0;

  function addLine() {
    if (!selectedItem) {
      toast.error("Select an item first");
      return;
    }

    if (quantity <= 0) {
      toast.error("Quantity must be at least 1");
      return;
    }

    const existing = lines.find((line) => line.menu_item_id === selectedItem);
    if (existing) {
      setLines((prev) =>
        prev.map((line) =>
          line.menu_item_id === selectedItem
            ? { ...line, quantity: line.quantity + quantity }
            : line
        )
      );
    } else {
      setLines((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          menu_item_id: selectedItem,
          quantity,
        },
      ]);
    }

    setSelectedItem("");
    setQuantity(1);
  }

  function removeLine(id: string) {
    setLines((prev) => prev.filter((line) => line.id !== id));
  }

  function updateLineQuantity(id: string, nextQty: number) {
    setLines((prev) =>
      prev.map((line) => (line.id === id ? { ...line, quantity: Math.max(1, nextQty) } : line))
    );
  }

  async function handlePlaceOrder() {
    if (lines.length === 0 || !canOrder) return;
    setLoading(true);

    try {
      const payload = lines.map((line) => ({
        menu_item_id: line.menu_item_id,
        quantity: line.quantity,
      }));

      const { data, error } = await supabase.rpc("place_multi_order", {
        p_items: payload,
        p_payment_method: paymentMethod,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      const result = data as unknown as PlaceOrderResult;
      if (result.error) {
        toast.error(result.error);
        return;
      }

      const methodLabel = paymentMethod === "pay_on_delivery" ? " (pay on delivery)" : "";
      toast.success(`Order placed! ${lines.length} item type(s), total ${Number(result.total).toLocaleString()} UGX${methodLabel}`);
      setLines([]);
      window.location.reload();
    } catch {
      toast.error("Failed to place order");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ShoppingCart className="h-5 w-5" />
          Place Order for {orderDateLabel}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {paymentMethod === "pay_on_delivery"
            ? "Pay on delivery: you will pay when you receive your order."
            : drainMode === "automatic"
              ? "Automatic drain: balance is charged immediately when order is placed."
              : "Confirmation drain: balance is charged only after both you and admin confirm delivery."}
        </p>
        {!canOrder && (
          <p className="text-sm text-destructive">{cutoffMessage}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Payment method selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Payment Method</label>
          <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="prepaid">Pay from Balance</SelectItem>
              <SelectItem value="pay_on_delivery">Pay on Delivery</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Menu item selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Item</label>
          {availableItemIds && displayItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">No items available for this date.</p>
          ) : (
            <Select value={selectedItem} onValueChange={setSelectedItem} disabled={!canOrder || loading}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a breakfast item..." />
              </SelectTrigger>
              <SelectContent>
                {displayItems.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    <span className="flex items-center gap-2">
                      {item.is_special && <Sparkles className="h-3 w-3 text-orange-500" />}
                      {item.name} — {Number(item.price).toLocaleString()} UGX
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Quantity */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Quantity for selected item</label>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1 || !canOrder || loading}
            >
              -
            </Button>
            <span className="w-12 text-center font-medium">{quantity}</span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setQuantity(quantity + 1)}
              disabled={!canOrder || loading}
            >
              +
            </Button>
            <Button
              type="button"
              onClick={addLine}
              disabled={!selectedItem || !canOrder || loading}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add item
            </Button>
          </div>
        </div>

        {/* Total & Submit */}
        {item && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
            <span className="text-sm font-medium">Preview line total</span>
            <span className="text-lg font-bold">{previewTotal.toLocaleString()} UGX</span>
          </div>
        )}

        {lines.length > 0 && (
          <div className="space-y-2 border rounded-lg p-3">
            <h4 className="text-sm font-medium">Your order items</h4>
            {lines.map((line) => {
              const lineItem = menuItems.find((m) => m.id === line.menu_item_id);
              if (!lineItem) return null;
              const lineTotal = lineItem.price * line.quantity;
              return (
                <div key={line.id} className="flex items-center justify-between gap-2">
                  <div className="text-sm min-w-0 flex-1">
                    <p className="font-medium truncate">{lineItem.name}</p>
                    <p className="text-xs text-muted-foreground">{Number(lineItem.price).toLocaleString()} UGX each</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => updateLineQuantity(line.id, line.quantity - 1)}
                      disabled={line.quantity <= 1 || loading}
                    >
                      -
                    </Button>
                    <Input
                      className="w-14 h-9 text-center"
                      type="number"
                      min={1}
                      value={line.quantity}
                      onChange={(e) => updateLineQuantity(line.id, Number(e.target.value) || 1)}
                      disabled={loading}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => updateLineQuantity(line.id, line.quantity + 1)}
                      disabled={loading}
                    >
                      +
                    </Button>
                  </div>
                  <div className="text-sm font-medium w-24 text-right">{lineTotal.toLocaleString()} UGX</div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeLine(line.id)}
                    disabled={loading}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {lines.length > 0 && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
            <span className="text-sm font-medium">Order Total</span>
            <span className="text-lg font-bold">{orderTotal.toLocaleString()} UGX</span>
          </div>
        )}

        {lines.length > 0 && paymentMethod === "prepaid" && drainMode === "automatic" && !canAfford && (
          <p className="text-sm text-destructive">
            Insufficient balance. You need {orderTotal.toLocaleString()} UGX but have {Number(balance).toLocaleString()} UGX.
          </p>
        )}

        <Button
          onClick={handlePlaceOrder}
          className="w-full"
          disabled={lines.length === 0 || !canAfford || !canOrder || loading}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {paymentMethod === "pay_on_delivery" ? "Place Order (Pay on Delivery)" : "Place Order"}
        </Button>

        {/* Menu preview */}
        <div className="space-y-2 pt-4 border-t">
          <h4 className="text-sm font-medium text-muted-foreground">
            {availableItemIds ? "Available Items" : "Today\u0027s Menu"}
          </h4>
          <div className="grid gap-2">
            {displayItems.map((item) => (
              <div
                key={item.id}
                className={`flex items-center gap-3 p-2 rounded-md text-sm ${
                  item.is_special ? "bg-orange-50 border border-orange-200" : "bg-muted/50"
                }`}
              >
                {item.image_url ? (
                  <div className="relative w-10 h-10 rounded overflow-hidden flex-shrink-0">
                    <Image src={item.image_url} alt={item.name} fill className="object-cover" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded bg-muted flex items-center justify-center flex-shrink-0">
                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
                <div className="flex items-center justify-between flex-1">
                  <div className="flex items-center gap-2">
                    {item.is_special && <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">Special</Badge>}
                    <span className="font-medium">{item.name}</span>
                  </div>
                  <span className="text-muted-foreground">{Number(item.price).toLocaleString()} UGX</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
