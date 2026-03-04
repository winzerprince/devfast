"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ShoppingCart, Sparkles } from "lucide-react";
import { toast } from "sonner";
import type { MenuItem, PlaceOrderResult } from "@/lib/types";

interface OrderFormProps {
  menuItems: MenuItem[];
  balance: number;
  orderDateLabel: string;
  canOrder: boolean;
  cutoffMessage: string;
}

export function OrderForm({ menuItems, balance, orderDateLabel, canOrder, cutoffMessage }: OrderFormProps) {
  const [selectedItem, setSelectedItem] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const item = menuItems.find((m) => m.id === selectedItem);
  const total = item ? item.price * quantity : 0;
  const canAfford = balance >= total && total > 0;

  async function handlePlaceOrder() {
    if (!selectedItem || !canOrder) return;
    setLoading(true);

    try {
      const { data, error } = await supabase.rpc("place_order", {
        p_menu_item_id: selectedItem,
        p_quantity: quantity,
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

      toast.success(`Order placed! ${result.item} x${result.quantity} for ${Number(result.total).toLocaleString()} UGX`);
      setSelectedItem("");
      setQuantity(1);
      // Refresh the page to update balance
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
        {!canOrder && (
          <p className="text-sm text-destructive">{cutoffMessage}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Menu item selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Item</label>
          <Select value={selectedItem} onValueChange={setSelectedItem} disabled={!canOrder}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a breakfast item..." />
            </SelectTrigger>
            <SelectContent>
              {menuItems.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  <span className="flex items-center gap-2">
                    {item.is_special && <Sparkles className="h-3 w-3 text-orange-500" />}
                    {item.name} — {Number(item.price).toLocaleString()} UGX
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Quantity */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Quantity</label>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1 || !canOrder}
            >
              -
            </Button>
            <span className="w-12 text-center font-medium">{quantity}</span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setQuantity(quantity + 1)}
              disabled={!canOrder}
            >
              +
            </Button>
          </div>
        </div>

        {/* Total & Submit */}
        {item && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
            <span className="text-sm font-medium">Total</span>
            <span className="text-lg font-bold">{total.toLocaleString()} UGX</span>
          </div>
        )}

        {item && !canAfford && (
          <p className="text-sm text-destructive">
            Insufficient balance. You need {total.toLocaleString()} UGX but have {Number(balance).toLocaleString()} UGX.
          </p>
        )}

        <Button
          onClick={handlePlaceOrder}
          className="w-full"
          disabled={!selectedItem || !canAfford || !canOrder || loading}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Place Order
        </Button>

        {/* Menu preview */}
        <div className="space-y-2 pt-4 border-t">
          <h4 className="text-sm font-medium text-muted-foreground">Today&apos;s Menu</h4>
          <div className="grid gap-2">
            {menuItems.map((item) => (
              <div
                key={item.id}
                className={`flex items-center justify-between p-2 rounded-md text-sm ${
                  item.is_special ? "bg-orange-50 border border-orange-200" : "bg-muted/50"
                }`}
              >
                <div className="flex items-center gap-2">
                  {item.is_special && <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">Special</Badge>}
                  <span className="font-medium">{item.name}</span>
                </div>
                <span className="text-muted-foreground">{Number(item.price).toLocaleString()} UGX</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
