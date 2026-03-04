import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import type { Order } from "@/lib/types";
import { History } from "lucide-react";

export default async function OrderHistoryPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/signin");

  const { data: orders } = await supabase
    .from("orders")
    .select("*, menu_item:menu_items(*)")
    .eq("user_id", user.id)
    .order("order_date", { ascending: false })
    .limit(50);

  const allOrders = (orders || []) as Order[];

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    cancelled: "bg-red-100 text-red-800",
    delivered: "bg-green-100 text-green-800",
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <History className="h-6 w-6" />
          Order History
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Your past and upcoming orders</p>
      </div>

      {allOrders.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No orders yet. Head to the dashboard to place your first order!
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {allOrders.map((order) => (
            <Card key={order.id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="font-medium">{order.menu_item?.name}</div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{format(new Date(order.order_date), "EEE, MMM d, yyyy")}</span>
                      <span>&middot;</span>
                      <span>x{order.quantity}</span>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="font-medium">{Number(order.total_price).toLocaleString()} UGX</div>
                    <Badge className={`text-xs ${statusColors[order.status] || ""}`} variant="secondary">
                      {order.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
