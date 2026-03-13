import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { TopUpForm } from "@/components/top-up-form";
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
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground pt-1">{users.length} registered users</p>

      {users.map((user) => {
        const hasDebt = Number(user.outstanding_debt) > 0;
        const isLow = Number(user.balance) < LOW_BALANCE_THRESHOLD;
        const initial = (user.full_name || "U").charAt(0).toUpperCase();

        return (
          <div key={user.id} className="rounded-2xl border bg-card p-4">
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-primary">{initial}</span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm">{user.full_name || "Unnamed"}</span>
                  {user.role === "admin" && (
                    <Badge variant="secondary" className="text-xs">admin</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap mt-0.5">
                  <span className={`text-sm font-medium ${isLow ? "text-destructive" : "text-green-600"}`}>
                    {Number(user.balance).toLocaleString()} UGX
                  </span>
                  {isLow && <Badge variant="destructive" className="text-xs">Low</Badge>}
                  {hasDebt && (
                    <Badge variant="destructive" className="text-xs">
                      Debt: {Number(user.outstanding_debt).toLocaleString()} UGX
                    </Badge>
                  )}
                </div>
              </div>

              {/* Top-up action */}
              <TopUpForm user={user} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
