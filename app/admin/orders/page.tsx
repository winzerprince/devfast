import { createClient } from "@/lib/supabase/server";
import { AdminOrderList } from "@/components/admin-order-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipboardList } from "lucide-react";
import type { Order } from "@/lib/types";

export default async function AdminOrdersPage() {
  const supabase = await createClient();

  const today = new Date().toISOString().split("T")[0];

  const [todayRes, upcomingRes, pastRes, unpaidRes] = await Promise.all([
    supabase
      .from("orders")
      .select("*, menu_item:menu_items(*), profile:profiles(full_name)")
      .eq("order_date", today)
      .order("created_at", { ascending: false }),
    supabase
      .from("orders")
      .select("*, menu_item:menu_items(*), profile:profiles(full_name)")
      .gt("order_date", today)
      .order("order_date", { ascending: true }),
    supabase
      .from("orders")
      .select("*, menu_item:menu_items(*), profile:profiles(full_name)")
      .lt("order_date", today)
      .order("order_date", { ascending: false })
      .limit(50),
    supabase
      .from("orders")
      .select("*, menu_item:menu_items(*), profile:profiles(full_name)")
      .eq("payment_method", "pay_on_delivery")
      .eq("payment_status", "unpaid")
      .order("order_date", { ascending: false }),
  ]);

  const todayOrders = (todayRes.data || []) as Order[];
  const upcomingOrders = (upcomingRes.data || []) as Order[];
  const pastOrders = (pastRes.data || []) as Order[];
  const unpaidOrders = (unpaidRes.data || []) as Order[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ClipboardList className="h-6 w-6" />
          Order Management
        </h1>
        <p className="text-muted-foreground text-sm mt-1">View and manage all orders</p>
      </div>

      <Tabs defaultValue="today" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="today">Today ({todayOrders.length})</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming ({upcomingOrders.length})</TabsTrigger>
          <TabsTrigger value="unpaid">Unpaid ({unpaidOrders.length})</TabsTrigger>
          <TabsTrigger value="past">Past ({pastOrders.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="today" className="mt-4">
          <AdminOrderList initialOrders={todayOrders} />
        </TabsContent>
        <TabsContent value="upcoming" className="mt-4">
          <AdminOrderList initialOrders={upcomingOrders} />
        </TabsContent>
        <TabsContent value="unpaid" className="mt-4">
          <AdminOrderList initialOrders={unpaidOrders} />
        </TabsContent>
        <TabsContent value="past" className="mt-4">
          <AdminOrderList initialOrders={pastOrders} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
