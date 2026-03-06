import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Wallet } from "lucide-react";
import { LOW_BALANCE_THRESHOLD } from "@/lib/types";

interface BalanceCardProps {
  balance: number;
  outstandingDebt?: number;
  cheapestItem?: number;
}

export function BalanceCard({ balance, outstandingDebt = 0, cheapestItem }: BalanceCardProps) {
  const threshold = cheapestItem ? Math.max(cheapestItem, LOW_BALANCE_THRESHOLD) : LOW_BALANCE_THRESHOLD;
  const isLow = balance < threshold;
  const hasDebt = outstandingDebt > 0;

  return (
    <Card className={isLow || hasDebt ? "border-destructive" : ""}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Wallet className="h-4 w-4" />
          Your Balance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">
          {Number(balance).toLocaleString()} <span className="text-lg font-normal text-muted-foreground">UGX</span>
        </div>
        {isLow && (
          <div className="flex items-center gap-2 mt-2 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <span>Low balance — please top up with your admin</span>
          </div>
        )}
        {hasDebt && (
          <div className="flex items-center gap-2 mt-2 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <span>Outstanding debt: {Number(outstandingDebt).toLocaleString()} UGX — please pay your admin</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
