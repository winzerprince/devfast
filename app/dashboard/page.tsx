import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BalanceCard } from "@/components/balance-card";
import { OrderForm } from "@/components/order-form";
import { UpcomingOrders } from "@/components/upcoming-orders";
import type { MenuItem, Order, Profile } from "@/lib/types";
import { format, addDays } from "date-fns";

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/signin");

  // Fetch profile, menu items, and upcoming orders in parallel
  const [profileRes, menuRes, ordersRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("menu_items").select("*").eq("is_active", true).order("price", { ascending: true }),
    supabase
      .from("orders")
      .select("*, menu_item:menu_items(*)")
      .eq("user_id", user.id)
      .gte("order_date", new Date().toISOString().split("T")[0])
      .neq("status", "cancelled")
      .order("order_date", { ascending: true }),
  ]);

  const profile = profileRes.data as Profile;
  const menuItems = (menuRes.data || []) as MenuItem[];
  const upcomingOrders = (ordersRes.data || []) as Order[];

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

      <BalanceCard balance={profile.balance} cheapestItem={cheapestItem} />

      <OrderForm
        menuItems={menuItems}
        balance={profile.balance}
        orderDateLabel={orderDateLabel}
        canOrder={true}
        cutoffMessage={cutoffMessage}
      />

      <UpcomingOrders orders={upcomingOrders} />
    </div>
  );
}
