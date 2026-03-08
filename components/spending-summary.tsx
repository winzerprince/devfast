import { TrendingUp } from "lucide-react";

interface SpendingSummaryProps {
  weeklySpending: number;
  monthlySpending: number;
}

export function SpendingSummary({ weeklySpending, monthlySpending }: SpendingSummaryProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-2xl bg-muted/60 p-4 space-y-1">
        <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-medium">
          <TrendingUp className="h-3.5 w-3.5" />
          This Week
        </div>
        <p className="text-xl font-bold">{Number(weeklySpending).toLocaleString()}</p>
        <p className="text-xs text-muted-foreground">UGX</p>
      </div>
      <div className="rounded-2xl bg-muted/60 p-4 space-y-1">
        <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-medium">
          <TrendingUp className="h-3.5 w-3.5" />
          This Month
        </div>
        <p className="text-xl font-bold">{Number(monthlySpending).toLocaleString()}</p>
        <p className="text-xs text-muted-foreground">UGX</p>
      </div>
    </div>
  );
}
