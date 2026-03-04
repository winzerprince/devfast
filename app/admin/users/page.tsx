import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TopUpForm } from "@/components/top-up-form";
import { Users } from "lucide-react";
import type { Profile } from "@/lib/types";
import { LOW_BALANCE_THRESHOLD } from "@/lib/types";

export default async function AdminUsersPage() {
  const supabase = await createClient();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .order("full_name", { ascending: true });

  const users = (profiles || []) as Profile[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6" />
          User Management
        </h1>
        <p className="text-muted-foreground text-sm mt-1">{users.length} registered users</p>
      </div>

      <div className="space-y-3">
        {users.map((user) => (
          <Card key={user.id}>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{user.full_name || "Unnamed"}</span>
                    {user.role === "admin" && (
                      <Badge variant="secondary" className="text-xs">admin</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${Number(user.balance) < LOW_BALANCE_THRESHOLD ? "text-destructive" : "text-green-600"}`}>
                      {Number(user.balance).toLocaleString()} UGX
                    </span>
                    {Number(user.balance) < LOW_BALANCE_THRESHOLD && (
                      <Badge variant="destructive" className="text-xs">Low</Badge>
                    )}
                  </div>
                </div>
                <TopUpForm user={user} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
