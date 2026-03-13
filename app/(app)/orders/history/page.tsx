import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/get-current-profile";
import { Card, CardContent } from "@/components/ui/card";
import { OrderHistoryList } from "@/components/order-history-list";
import { OrderCalendar } from "@/components/order-calendar";
import { SpendingSummary } from "@/components/spending-summary";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Order } from "@/lib/types";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

export default async function OrderHistoryPage() {
  // Cached — no extra round-trip; the (app) layout already fetched this.
  const profile = await getCurrentProfile();
  if (!profile) redirect("/auth/signin");

  const supabase = await createClient();

  const now = new Date();
  const weekStart = format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const weekEnd = format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const monthStart = format(startOfMonth(now), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(now), "yyyy-MM-dd");

  const [ordersRes, weeklyRes, monthlyRes] = await Promise.all([
    supabase
      .from("orders")
      .select("*, menu_item:menu_items(*)")
      .eq("user_id", profile.id)
      .order("order_date", { ascending: false })
      .limit(50),
    supabase.from("orders").select("total_price").eq("user_id", profile.id).neq("status", "cancelled").gte("order_date", weekStart).lte("order_date", weekEnd),
    supabase.from("orders").select("total_price").eq("user_id", profile.id).neq("status", "cancelled").gte("order_date", monthStart).lte("order_date", monthEnd),
  ]);

  const allOrders = (ordersRes.data || []) as Order[];
  const weeklySpending = (weeklyRes.data || []).reduce((sum: number, o: { total_price: number }) => sum + Number(o.total_price), 0);
  const monthlySpending = (monthlyRes.data || []).reduce((sum: number, o: { total_price: number }) => sum + Number(o.total_price), 0);

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <SpendingSummary weeklySpending={weeklySpending} monthlySpending={monthlySpending} />

      <Tabs defaultValue="calendar" className="w-full">
        <div className="overflow-x-auto pb-1">
          <TabsList className="grid w-full grid-cols-2 min-w-[260px]">
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="list">List</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="calendar" className="mt-4">
          <OrderCalendar orders={allOrders} />
        </TabsContent>

        <TabsContent value="list" className="mt-4">
          {allOrders.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground text-sm">
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
