import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderHistoryList } from "@/components/order-history-list";
import { OrderCalendar } from "@/components/order-calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <History className="h-6 w-6" />
          Order History
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Your past and upcoming orders</p>
      </div>

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
