import { createClient } from "@/lib/supabase/server";
import { MenuManager } from "@/components/menu-manager";
import { MenuAvailabilityManager } from "@/components/menu-availability-manager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { MenuItem } from "@/lib/types";

export default async function AdminMenuPage() {
  const supabase = await createClient();

  const { data: menuItems } = await supabase
    .from("menu_items")
    .select("*")
    .order("price", { ascending: true });

  const items = (menuItems || []) as MenuItem[];

  return (
    <div className="space-y-4">
      <Tabs defaultValue="items" className="w-full">
        <div className="overflow-x-auto pb-1">
          <TabsList className="grid w-full grid-cols-2 min-w-[280px]">
            <TabsTrigger value="items">Menu Items</TabsTrigger>
            <TabsTrigger value="availability">Daily Availability</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="items" className="mt-4">
          <MenuManager initialItems={items} />
        </TabsContent>

        <TabsContent value="availability" className="mt-4">
          <MenuAvailabilityManager menuItems={items} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
