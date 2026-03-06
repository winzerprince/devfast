import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks } from "date-fns";
import { ClipboardList, DollarSign, ShoppingCart, Users, TrendingUp, Crown, Banknote } from "lucide-react";
import type { Order, Profile } from "@/lib/types";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const weekStart = format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const weekEnd = format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const monthStart = format(startOfMonth(now), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(now), "yyyy-MM-dd");

  // Fetch all data in parallel
  const [todayOrdersRes, weekOrdersRes, monthOrdersRes, usersRes, unpaidCountRes, weeklyBreakdownRes] = await Promise.all([
    supabase
      .from("orders")
      .select("*, menu_item:menu_items(*), profile:profiles(full_name)")
      .eq("order_date", today)
      .neq("status", "cancelled")
      .order("created_at", { ascending: false }),
    supabase
      .from("orders")
      .select("total_price, user_id, profile:profiles(full_name)")
      .gte("order_date", weekStart)
      .lte("order_date", weekEnd)
      .neq("status", "cancelled"),
    supabase
      .from("orders")
      .select("total_price, user_id, profile:profiles(full_name)")
      .gte("order_date", monthStart)
      .lte("order_date", monthEnd)
      .neq("status", "cancelled"),
    supabase.from("profiles").select("id", { count: "exact" }),
    supabase
      .from("orders")
      .select("id", { count: "exact" })
      .eq("payment_method", "pay_on_delivery")
      .eq("payment_status", "unpaid"),
    // Last 4 weeks revenue
    supabase
      .from("orders")
      .select("total_price, order_date")
      .gte("order_date", format(subWeeks(startOfWeek(now, { weekStartsOn: 1 }), 3), "yyyy-MM-dd"))
      .lte("order_date", weekEnd)
      .neq("status", "cancelled"),
  ]);

  const todayOrders = (todayOrdersRes.data || []) as Order[];
  const weekOrders = weekOrdersRes.data || [];
  const monthOrders = monthOrdersRes.data || [];
  const userCount = usersRes.count || 0;
  const unpaidCount = unpaidCountRes.count || 0;

  const todayTotal = todayOrders.reduce((sum, o) => sum + Number(o.total_price), 0);
  const weekTotal = weekOrders.reduce((sum: number, o: { total_price: number }) => sum + Number(o.total_price), 0);
  const monthTotal = monthOrders.reduce((sum: number, o: { total_price: number }) => sum + Number(o.total_price), 0);
  const todayMeals = todayOrders.reduce((sum, o) => sum + o.quantity, 0);

  // Top spenders this week
  const weekSpenderMap = new Map<string, { name: string; total: number }>();
  for (const o of weekOrders as unknown as { total_price: number; user_id: string; profile: { full_name: string } | null }[]) {
    const existing = weekSpenderMap.get(o.user_id) || { name: (o.profile?.full_name) || "Unknown", total: 0 };
    existing.total += Number(o.total_price);
    weekSpenderMap.set(o.user_id, existing);
  }
  const topWeekSpenders = Array.from(weekSpenderMap.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  // Top spenders this month
  const monthSpenderMap = new Map<string, { name: string; total: number }>();
  for (const o of monthOrders as unknown as { total_price: number; user_id: string; profile: { full_name: string } | null }[]) {
    const existing = monthSpenderMap.get(o.user_id) || { name: (o.profile?.full_name) || "Unknown", total: 0 };
    existing.total += Number(o.total_price);
    monthSpenderMap.set(o.user_id, existing);
  }
  const topMonthSpenders = Array.from(monthSpenderMap.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  // Weekly revenue breakdown (last 4 weeks)
  const weeklyRevenue: { label: string; total: number }[] = [];
  for (let i = 3; i >= 0; i--) {
    const ws = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
    const we = endOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
    const wsStr = format(ws, "yyyy-MM-dd");
    const weStr = format(we, "yyyy-MM-dd");
    const label = format(ws, "MMM d") + " - " + format(we, "MMM d");
    const total = (weeklyBreakdownRes.data || [])
      .filter((o: { order_date: string }) => o.order_date >= wsStr && o.order_date <= weStr)
      .reduce((sum: number, o: { total_price: number }) => sum + Number(o.total_price), 0);
    weeklyRevenue.push({ label, total });
  }

  // Group today's orders by user for morning view
  const ordersByUser = new Map<string, { name: string; orders: Order[]; total: number }>();
  for (const order of todayOrders) {
    const name = order.profile?.full_name || "Unknown";
    const existing = ordersByUser.get(order.user_id) || { name, orders: [], total: 0 };
    existing.orders.push(order);
    existing.total += Number(order.total_price);
    ordersByUser.set(order.user_id, existing);
  }
  const groupedUsers = Array.from(ordersByUser.values()).sort((a, b) => a.name.localeCompare(b.name));

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
          Overview for {format(now, "EEEE, MMMM d, yyyy")}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <ShoppingCart className="h-4 w-4" /> Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayOrders.length}</div>
            <div className="text-xs text-muted-foreground">{todayMeals} meals</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <DollarSign className="h-4 w-4" /> Today Rev
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
              <TrendingUp className="h-4 w-4" /> This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{weekTotal.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">UGX</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-4 w-4" /> This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monthTotal.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">UGX</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Users className="h-4 w-4" /> Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Banknote className="h-4 w-4" /> Unpaid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${unpaidCount > 0 ? "text-destructive" : ""}`}>{unpaidCount}</div>
            <div className="text-xs text-muted-foreground">orders</div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Revenue Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Weekly Revenue (Last 4 Weeks)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {weeklyRevenue.map((week) => (
              <div key={week.label} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <span className="text-sm">{week.label}</span>
                <span className="font-medium">{week.total.toLocaleString()} UGX</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Spenders */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" /> Top Spenders This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topWeekSpenders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No orders this week.</p>
            ) : (
              <div className="space-y-2">
                {topWeekSpenders.map((spender, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-muted-foreground w-5">#{i + 1}</span>
                      <span className="text-sm font-medium">{spender.name}</span>
                    </div>
                    <span className="font-medium text-sm">{spender.total.toLocaleString()} UGX</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" /> Top Spenders This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topMonthSpenders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No orders this month.</p>
            ) : (
              <div className="space-y-2">
                {topMonthSpenders.map((spender, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-muted-foreground w-5">#{i + 1}</span>
                      <span className="text-sm font-medium">{spender.name}</span>
                    </div>
                    <span className="font-medium text-sm">{spender.total.toLocaleString()} UGX</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Today's Orders - Grouped by User */}
      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s Orders by User ({todayOrders.length} orders, {groupedUsers.length} users)</CardTitle>
        </CardHeader>
        <CardContent>
          {groupedUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No orders for today.</p>
          ) : (
            <div className="space-y-4">
              {groupedUsers.map((group) => (
                <div key={group.name} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{group.name}</span>
                    <span className="text-sm font-medium">{group.total.toLocaleString()} UGX</span>
                  </div>
                  <div className="space-y-1">
                    {group.orders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">{order.menu_item?.name} x{order.quantity}</span>
                          {order.payment_method === "pay_on_delivery" && (
                            <Badge variant="outline" className="text-xs">COD</Badge>
                          )}
                          {order.payment_method === "pay_on_delivery" && order.payment_status === "unpaid" && (
                            <Badge variant="destructive" className="text-xs">Unpaid</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span>{Number(order.total_price).toLocaleString()} UGX</span>
                          <Badge className={`text-xs ${statusColors[order.status] || ""}`} variant="secondary">
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
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
