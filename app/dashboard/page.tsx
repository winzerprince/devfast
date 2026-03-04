import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BalanceCard } from "@/components/balance-card";
import { OrderForm } from "@/components/order-form";
import { UpcomingOrders } from "@/components/upcoming-orders";
import { DrainModeCard } from "@/components/drain-mode-card";
import { RecurringOrdersManager } from "@/components/recurring-orders-manager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { MenuItem, Order, Profile, RecurringOrder } from "@/lib/types";
import { format, addDays } from "date-fns";

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/signin");

  await supabase.rpc("sync_my_recurring_orders", { p_days_ahead: 14 });

  // Fetch profile, menu items, and upcoming orders in parallel
  const [profileRes, menuRes, ordersRes, recurringRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("menu_items").select("*").eq("is_active", true).order("price", { ascending: true }),
    supabase
      .from("orders")
      .select("*, menu_item:menu_items(*)")
      .eq("user_id", user.id)
      .gte("order_date", new Date().toISOString().split("T")[0])
      .neq("status", "cancelled")
      .order("order_date", { ascending: true }),
    supabase
      .from("recurring_orders")
      .select("*, menu_item:menu_items(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const profile = profileRes.data as Profile;
  const menuItems = (menuRes.data || []) as MenuItem[];
  const upcomingOrders = (ordersRes.data || []) as Order[];
  const recurringOrders = (recurringRes.data || []) as RecurringOrder[];

  if (!profile) redirect("/auth/signin");

  // Determine order date and cutoff
  const now = new Date();
  const kampalaNow = new Date(now.toLocaleString("en-US", { timeZone: "Africa/Kampala" }));
  const hour = kampalaNow.getHours();
  const isPastCutoff = hour >= 20;
  
  const orderDate = isPastCutoff ? addDays(new Date(), 2) : addDays(new Date(), 1);
  const orderDateLabel = format(orderDate, "EEEE, MMM d");
  const cutoffMessage = isPastCutoff
    ? "It's past 8 PM. Orders are now for " + format(addDays(new Date(), 2), "EEEE, MMM d") + "."
    : "Order before 8 PM tonight for tomorrow's breakfast.";

  const cheapestItem = menuItems.length > 0 ? menuItems[0].price : undefined;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Good {hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening"}, {profile.full_name || "there"}!</h1>
        <p className="text-muted-foreground text-sm mt-1">{cutoffMessage}</p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="new-order">New Order</TabsTrigger>
          <TabsTrigger value="recurring">Recurring</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          <BalanceCard balance={profile.balance} cheapestItem={cheapestItem} />
          <DrainModeCard currentMode={profile.drain_mode} />
        </TabsContent>

        <TabsContent value="new-order" className="mt-4">
          <OrderForm
            menuItems={menuItems}
            balance={profile.balance}
            drainMode={profile.drain_mode}
            orderDateLabel={orderDateLabel}
            canOrder={true}
            cutoffMessage={cutoffMessage}
          />
        </TabsContent>

        <TabsContent value="recurring" className="mt-4">
          <RecurringOrdersManager menuItems={menuItems} recurringOrders={recurringOrders} />
        </TabsContent>

        <TabsContent value="upcoming" className="mt-4">
          <UpcomingOrders orders={upcomingOrders} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
