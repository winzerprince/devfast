import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, startOfWeek, endOfWeek } from "date-fns";
import { ClipboardList, DollarSign, ShoppingCart, Users } from "lucide-react";
import type { Order } from "@/lib/types";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const today = new Date().toISOString().split("T")[0];
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
  const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");

  // Fetch today's orders, this week's stats, and user count in parallel
  const [todayOrdersRes, weekOrdersRes, usersRes] = await Promise.all([
    supabase
      .from("orders")
      .select("*, menu_item:menu_items(*), profile:profiles(full_name)")
      .eq("order_date", today)
      .neq("status", "cancelled")
      .order("created_at", { ascending: false }),
    supabase
      .from("orders")
      .select("total_price, status")
      .gte("order_date", weekStart)
      .lte("order_date", weekEnd)
      .neq("status", "cancelled"),
    supabase.from("profiles").select("id", { count: "exact" }),
  ]);

  const todayOrders = (todayOrdersRes.data || []) as Order[];
  const weekOrders = weekOrdersRes.data || [];
  const userCount = usersRes.count || 0;

  const todayTotal = todayOrders.reduce((sum, o) => sum + Number(o.total_price), 0);
  const weekTotal = weekOrders.reduce((sum, o) => sum + Number(o.total_price), 0);
  const todayMeals = todayOrders.reduce((sum, o) => sum + o.quantity, 0);

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    delivered: "bg-green-100 text-green-800",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Overview for {format(new Date(), "EEEE, MMMM d, yyyy")}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <ShoppingCart className="h-4 w-4" /> Today&apos;s Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayOrders.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <ClipboardList className="h-4 w-4" /> Meals Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayMeals}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <DollarSign className="h-4 w-4" /> Today&apos;s Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayTotal.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">UGX</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Users className="h-4 w-4" /> This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{weekTotal.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">UGX ({userCount} users)</div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Orders List */}
      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s Orders ({todayOrders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {todayOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No orders for today.</p>
          ) : (
            <div className="space-y-3">
              {todayOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="space-y-1">
                    <div className="font-medium text-sm">{order.profile?.full_name || "Unknown"}</div>
                    <div className="text-sm text-muted-foreground">
                      {order.menu_item?.name} x{order.quantity}
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="font-medium text-sm">{Number(order.total_price).toLocaleString()} UGX</div>
                    <Badge className={`text-xs ${statusColors[order.status] || ""}`} variant="secondary">
                      {order.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
