import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { OrderHistoryList } from "@/components/order-history-list";
import { OrderCalendar } from "@/components/order-calendar";
import { SpendingSummary } from "@/components/spending-summary";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Order } from "@/lib/types";
import { History } from "lucide-react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

export default async function OrderHistoryPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/signin");

  const now = new Date();
  const weekStart = format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const weekEnd = format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const monthStart = format(startOfMonth(now), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(now), "yyyy-MM-dd");

  const [ordersRes, weeklyRes, monthlyRes] = await Promise.all([
    supabase
      .from("orders")
      .select("*, menu_item:menu_items(*)")
      .eq("user_id", user.id)
      .order("order_date", { ascending: false })
      .limit(50),
    supabase
      .from("orders")
      .select("total_price")
      .eq("user_id", user.id)
      .neq("status", "cancelled")
      .gte("order_date", weekStart)
      .lte("order_date", weekEnd),
    supabase
      .from("orders")
      .select("total_price")
      .eq("user_id", user.id)
      .neq("status", "cancelled")
      .gte("order_date", monthStart)
      .lte("order_date", monthEnd),
  ]);

  const allOrders = (ordersRes.data || []) as Order[];
  const weeklySpending = (weeklyRes.data || []).reduce((sum: number, o: { total_price: number }) => sum + Number(o.total_price), 0);
  const monthlySpending = (monthlyRes.data || []).reduce((sum: number, o: { total_price: number }) => sum + Number(o.total_price), 0);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <History className="h-6 w-6" />
          Order History
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Your past and upcoming orders</p>
      </div>

      <SpendingSummary weeklySpending={weeklySpending} monthlySpending={monthlySpending} />

      <Tabs defaultValue="calendar" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="mt-4">
          <OrderCalendar orders={allOrders} />
        </TabsContent>

        <TabsContent value="list" className="mt-4">
          {allOrders.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No orders yet. Head to the dashboard to place your first order!
              </CardContent>
            </Card>
          ) : (
            <OrderHistoryList orders={allOrders} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
