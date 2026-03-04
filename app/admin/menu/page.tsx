import { createClient } from "@/lib/supabase/server";
import { MenuManager } from "@/components/menu-manager";
import { UtensilsCrossed } from "lucide-react";
import type { MenuItem } from "@/lib/types";

export default async function AdminMenuPage() {
  const supabase = await createClient();

  const { data: menuItems } = await supabase
    .from("menu_items")
    .select("*")
    .order("price", { ascending: true });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <UtensilsCrossed className="h-6 w-6" />
          Menu Management
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Add, edit, or disable breakfast items</p>
      </div>

      <MenuManager initialItems={(menuItems || []) as MenuItem[]} />
    </div>
  );
}
