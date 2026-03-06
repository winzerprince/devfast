import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

interface SpendingSummaryProps {
  weeklySpending: number;
  monthlySpending: number;
}

export function SpendingSummary({ weeklySpending, monthlySpending }: SpendingSummaryProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <TrendingUp className="h-4 w-4" />
          Your Spending
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">This Week</p>
            <p className="text-xl font-bold">{Number(weeklySpending).toLocaleString()} <span className="text-sm font-normal text-muted-foreground">UGX</span></p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">This Month</p>
            <p className="text-xl font-bold">{Number(monthlySpending).toLocaleString()} <span className="text-sm font-normal text-muted-foreground">UGX</span></p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
