import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BalanceCard } from "@/components/balance-card";
import { OrderForm } from "@/components/order-form";
import { UpcomingOrders } from "@/components/upcoming-orders";
import { DrainModeCard } from "@/components/drain-mode-card";
import { RecurringOrdersManager } from "@/components/recurring-orders-manager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SpendingSummary } from "@/components/spending-summary";
import type { MenuItem, Order, Profile, RecurringOrder } from "@/lib/types";
import { DEBT_BLOCK_THRESHOLD } from "@/lib/types";
import { format, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const validTabs = ["overview", "new-order", "recurring", "upcoming"];
  const defaultTab = tab && validTabs.includes(tab) ? tab : "overview";
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/signin");

  await supabase.rpc("sync_my_recurring_orders", { p_days_ahead: 14 });

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const weekStart = format(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const weekEnd = format(endOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const monthStart = format(startOfMonth(today), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(today), "yyyy-MM-dd");

  // Fetch profile, menu items, and upcoming orders in parallel
  const [profileRes, menuRes, ordersRes, recurringRes, weeklySpendRes, monthlySpendRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("menu_items").select("*").eq("is_active", true).order("price", { ascending: true }),
    supabase
      .from("orders")
      .select("*, menu_item:menu_items(*)")
      .eq("user_id", user.id)
      .gte("order_date", todayStr)
      .neq("status", "cancelled")
      .order("order_date", { ascending: true }),
    supabase
      .from("recurring_orders")
      .select("*, menu_item:menu_items(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
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

  const profile = profileRes.data as Profile;
  const menuItems = (menuRes.data || []) as MenuItem[];
  const upcomingOrders = (ordersRes.data || []) as Order[];
  const recurringOrders = (recurringRes.data || []) as RecurringOrder[];

  const weeklySpending = (weeklySpendRes.data || []).reduce((sum: number, o: { total_price: number }) => sum + Number(o.total_price), 0);
  const monthlySpending = (monthlySpendRes.data || []).reduce((sum: number, o: { total_price: number }) => sum + Number(o.total_price), 0);

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

  // Fetch availability for the order date
  const orderDateStr = format(orderDate, "yyyy-MM-dd");
  const { data: availabilityData } = await supabase
    .from("menu_availability")
    .select("menu_item_id")
    .eq("available_date", orderDateStr);

  const availableItemIds = availabilityData && availabilityData.length > 0
    ? availabilityData.map((row: { menu_item_id: string }) => row.menu_item_id)
    : null;

  const cheapestItem = menuItems.length > 0 ? menuItems[0].price : undefined;
  const isDebtBlocked = profile.balance < DEBT_BLOCK_THRESHOLD;

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div className="pt-1">
        <h1 className="text-2xl font-bold">
          Good {hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening"}, {profile.full_name?.split(" ")[0] || "there"}!
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">{cutoffMessage}</p>
      </div>

      <Tabs defaultValue={defaultTab} key={defaultTab} className="w-full">
        <TabsList className="hidden md:grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="new-order">New Order</TabsTrigger>
          <TabsTrigger value="recurring">Recurring</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          <BalanceCard balance={profile.balance} outstandingDebt={profile.outstanding_debt} cheapestItem={cheapestItem} />
          <SpendingSummary weeklySpending={weeklySpending} monthlySpending={monthlySpending} />
          <DrainModeCard currentMode={profile.drain_mode} />
        </TabsContent>

        <TabsContent value="new-order" className="mt-4">
          <OrderForm
            menuItems={menuItems}
            availableItemIds={availableItemIds}
            balance={profile.balance}
            drainMode={profile.drain_mode}
            orderDateLabel={orderDateLabel}
            canOrder={true}
            cutoffMessage={cutoffMessage}
            isDebtBlocked={isDebtBlocked}
          />
        </TabsContent>

        <TabsContent value="recurring" className="mt-4">
          <RecurringOrdersManager menuItems={menuItems} recurringOrders={recurringOrders} userId={user.id} />
        </TabsContent>

        <TabsContent value="upcoming" className="mt-4">
          <UpcomingOrders orders={upcomingOrders} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
