import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/get-current-profile";
import { redirect } from "next/navigation";
import { BalanceCard } from "@/components/balance-card";
import { OrderForm } from "@/components/order-form";
import { UpcomingOrders } from "@/components/upcoming-orders";
import { DrainModeCard } from "@/components/drain-mode-card";
import { RecurringOrdersManager } from "@/components/recurring-orders-manager";
import { DashboardTabs } from "@/components/dashboard-tabs";
import { SpendingSummary } from "@/components/spending-summary";
import type { MenuItem, Order, RecurringOrder } from "@/lib/types";
import { DEBT_BLOCK_THRESHOLD } from "@/lib/types";
import { format, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

export default async function DashboardPage() {
  // Cached — no extra round-trip; the (app) layout already fetched this.
  const profile = await getCurrentProfile();
  if (!profile) redirect("/auth/signin");

  const supabase = await createClient();

  await supabase.rpc("sync_my_recurring_orders", { p_days_ahead: 14 });

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const weekStart = format(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const weekEnd = format(endOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const monthStart = format(startOfMonth(today), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(today), "yyyy-MM-dd");

  const [menuRes, ordersRes, recurringRes, weeklySpendRes, monthlySpendRes] = await Promise.all([
    supabase.from("menu_items").select("*").eq("is_active", true).order("price", { ascending: true }),
    supabase
      .from("orders")
      .select("*, menu_item:menu_items(*)")
      .eq("user_id", profile.id)
      .gte("order_date", todayStr)
      .neq("status", "cancelled")
      .order("order_date", { ascending: true }),
    supabase
      .from("recurring_orders")
      .select("*, menu_item:menu_items(*)")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("orders")
      .select("total_price")
      .eq("user_id", profile.id)
      .neq("status", "cancelled")
      .gte("order_date", weekStart)
      .lte("order_date", weekEnd),
    supabase
      .from("orders")
      .select("total_price")
      .eq("user_id", profile.id)
      .neq("status", "cancelled")
      .gte("order_date", monthStart)
      .lte("order_date", monthEnd),
  ]);

  const menuItems = (menuRes.data || []) as MenuItem[];
  const upcomingOrders = (ordersRes.data || []) as Order[];
  const recurringOrders = (recurringRes.data || []) as RecurringOrder[];
  const weeklySpending = (weeklySpendRes.data || []).reduce((sum: number, o: { total_price: number }) => sum + Number(o.total_price), 0);
  const monthlySpending = (monthlySpendRes.data || []).reduce((sum: number, o: { total_price: number }) => sum + Number(o.total_price), 0);

  const now = new Date();
  const kampalaNow = new Date(now.toLocaleString("en-US", { timeZone: "Africa/Kampala" }));
  const hour = kampalaNow.getHours();
  const isPastCutoff = hour >= 20;

  const orderDate = isPastCutoff ? addDays(new Date(), 2) : addDays(new Date(), 1);
  const orderDateLabel = format(orderDate, "EEEE, MMM d");
  const cutoffMessage = isPastCutoff
    ? "It's past 8 PM. Orders are now for " + format(addDays(new Date(), 2), "EEEE, MMM d") + "."
    : "Order before 8 PM tonight for tomorrow's breakfast.";

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
    <div className="space-y-5 max-w-2xl mx-auto md:max-w-3xl">
      {/* Mobile greeting (desktop uses TopBar for page title) */}
      <div className="pt-1 md:hidden">
        <h1 className="text-2xl font-bold">
          Good {hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening"}, {profile.full_name?.split(" ")[0] || "there"}!
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">{cutoffMessage}</p>
      </div>
      {/* Desktop cutoff nudge */}
      <p className="hidden md:block text-sm text-muted-foreground">{cutoffMessage}</p>

      <DashboardTabs
        overview={
          <>
            <BalanceCard balance={profile.balance} outstandingDebt={profile.outstanding_debt} cheapestItem={cheapestItem} />
            <SpendingSummary weeklySpending={weeklySpending} monthlySpending={monthlySpending} />
            <DrainModeCard currentMode={profile.drain_mode} />
          </>
        }
        newOrder={
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
        }
        recurring={
          <RecurringOrdersManager menuItems={menuItems} recurringOrders={recurringOrders} userId={profile.id} />
        }
        upcoming={
          <UpcomingOrders orders={upcomingOrders} />
        }
      />
    </div>
  );
}
