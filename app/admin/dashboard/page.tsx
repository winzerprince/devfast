import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks } from "date-fns";
import { ClipboardList, DollarSign, ShoppingCart, Users, TrendingUp, Crown, Banknote } from "lucide-react";
import type { Order } from "@/lib/types";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const weekStart = format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const weekEnd = format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const monthStart = format(startOfMonth(now), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(now), "yyyy-MM-dd");

  const [todayOrdersRes, weekOrdersRes, monthOrdersRes, usersRes, unpaidCountRes, weeklyBreakdownRes] = await Promise.all([
    supabase.from("orders").select("*, menu_item:menu_items(*), profile:profiles(full_name)").eq("order_date", today).neq("status", "cancelled").order("created_at", { ascending: false }),
    supabase.from("orders").select("total_price, user_id, profile:profiles(full_name)").gte("order_date", weekStart).lte("order_date", weekEnd).neq("status", "cancelled"),
    supabase.from("orders").select("total_price, user_id, profile:profiles(full_name)").gte("order_date", monthStart).lte("order_date", monthEnd).neq("status", "cancelled"),
    supabase.from("profiles").select("id", { count: "exact" }),
    supabase.from("orders").select("id", { count: "exact" }).eq("payment_method", "pay_on_delivery").eq("payment_status", "unpaid"),
    supabase.from("orders").select("total_price, order_date").gte("order_date", format(subWeeks(startOfWeek(now, { weekStartsOn: 1 }), 3), "yyyy-MM-dd")).lte("order_date", weekEnd).neq("status", "cancelled"),
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

  const weekSpenderMap = new Map<string, { name: string; total: number }>();
  for (const o of weekOrders as unknown as { total_price: number; user_id: string; profile: { full_name: string } | null }[]) {
    const existing = weekSpenderMap.get(o.user_id) || { name: o.profile?.full_name || "Unknown", total: 0 };
    existing.total += Number(o.total_price);
    weekSpenderMap.set(o.user_id, existing);
  }
  const topWeekSpenders = Array.from(weekSpenderMap.values()).sort((a, b) => b.total - a.total).slice(0, 5);

  const monthSpenderMap = new Map<string, { name: string; total: number }>();
  for (const o of monthOrders as unknown as { total_price: number; user_id: string; profile: { full_name: string } | null }[]) {
    const existing = monthSpenderMap.get(o.user_id) || { name: o.profile?.full_name || "Unknown", total: 0 };
    existing.total += Number(o.total_price);
    monthSpenderMap.set(o.user_id, existing);
  }
  const topMonthSpenders = Array.from(monthSpenderMap.values()).sort((a, b) => b.total - a.total).slice(0, 5);

  const weeklyRevenue: { label: string; total: number }[] = [];
  for (let i = 3; i >= 0; i--) {
    const ws = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
    const we = endOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
    const wsStr = format(ws, "yyyy-MM-dd");
    const weStr = format(we, "yyyy-MM-dd");
    const label = format(ws, "MMM d") + " – " + format(we, "MMM d");
    const total = (weeklyBreakdownRes.data || [])
      .filter((o: { order_date: string }) => o.order_date >= wsStr && o.order_date <= weStr)
      .reduce((sum: number, o: { total_price: number }) => sum + Number(o.total_price), 0);
    weeklyRevenue.push({ label, total });
  }

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

  const stats = [
    { label: "Today's Orders", value: todayOrders.length, sub: `${todayMeals} meals`, icon: ShoppingCart, iconBg: "bg-primary/10", iconColor: "text-primary" },
    { label: "Today's Revenue", value: todayTotal.toLocaleString(), sub: "UGX", icon: DollarSign, iconBg: "bg-green-100", iconColor: "text-green-600" },
    { label: "This Week", value: weekTotal.toLocaleString(), sub: "UGX", icon: TrendingUp, iconBg: "bg-blue-100", iconColor: "text-blue-600" },
    { label: "This Month", value: monthTotal.toLocaleString(), sub: "UGX", icon: ClipboardList, iconBg: "bg-purple-100", iconColor: "text-purple-600" },
    { label: "Total Users", value: userCount, sub: "registered", icon: Users, iconBg: "bg-teal-100", iconColor: "text-teal-600" },
    { label: "Unpaid Orders", value: unpaidCount, sub: "on delivery", icon: Banknote, iconBg: unpaidCount > 0 ? "bg-destructive/10" : "bg-muted", iconColor: unpaidCount > 0 ? "text-destructive" : "text-muted-foreground" },
  ];

  return (
    <div className="space-y-5">
      <p className="text-xs text-muted-foreground pt-1">{format(now, "EEEE, MMMM d, yyyy")}</p>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-2xl border bg-card p-4 space-y-3">
              <div className={`${stat.iconBg} rounded-xl p-2 w-fit`}>
                <Icon className={`h-4 w-4 ${stat.iconColor}`} />
              </div>
              <div>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.sub}</div>
              </div>
              <p className="text-xs font-medium text-muted-foreground leading-tight">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Weekly Revenue */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Weekly Revenue — Last 4 Weeks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {weeklyRevenue.map((week) => (
              <div key={week.label} className="flex items-center justify-between p-2.5 rounded-xl bg-muted/50">
                <span className="text-sm">{week.label}</span>
                <span className="font-semibold text-sm">{week.total.toLocaleString()} UGX</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Spenders */}
      <div className="grid md:grid-cols-2 gap-4">
        {[{ title: "Top Spenders — Week", spenders: topWeekSpenders, empty: "No orders this week." }, { title: "Top Spenders — Month", spenders: topMonthSpenders, empty: "No orders this month." }].map(({ title, spenders, empty }) => (
          <Card key={title}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Crown className="h-4 w-4 text-yellow-500" /> {title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {spenders.length === 0 ? (
                <p className="text-sm text-muted-foreground">{empty}</p>
              ) : (
                <div className="space-y-2">
                  {spenders.map((spender, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-muted/50">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-muted-foreground w-5">#{i + 1}</span>
                        <span className="text-sm font-medium">{spender.name}</span>
                      </div>
                      <span className="text-sm font-semibold">{spender.total.toLocaleString()} UGX</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Today's Orders by User */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Today&apos;s Orders
            <span className="ml-2 font-normal text-sm text-muted-foreground">
              {todayOrders.length} orders · {groupedUsers.length} users
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {groupedUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No orders for today.</p>
          ) : (
            <div className="space-y-3">
              {groupedUsers.map((group) => (
                <div key={group.name} className="border rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm">{group.name}</span>
                    <span className="text-sm font-semibold">{group.total.toLocaleString()} UGX</span>
                  </div>
                  <div className="space-y-1">
                    {group.orders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">{order.menu_item?.name} ×{order.quantity}</span>
                          {order.payment_method === "pay_on_delivery" && <Badge variant="outline" className="text-xs">COD</Badge>}
                          {order.payment_method === "pay_on_delivery" && order.payment_status === "unpaid" && <Badge variant="destructive" className="text-xs">Unpaid</Badge>}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">{Number(order.total_price).toLocaleString()} UGX</span>
                          <Badge className={`text-xs ${statusColors[order.status] || ""}`} variant="secondary">{order.status}</Badge>
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
