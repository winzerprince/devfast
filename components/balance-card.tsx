import { AlertTriangle, Coffee, Wallet } from "lucide-react";
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
    <div className="space-y-2">
      {/* Wallet card */}
      <div className="rounded-2xl bg-gradient-to-br from-primary to-orange-600 p-5 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5 text-white/70 text-xs font-semibold uppercase tracking-widest">
            <Wallet className="h-3.5 w-3.5" />
            Balance
          </div>
          <Coffee className="h-5 w-5 text-white/25" />
        </div>
        <div className="text-4xl font-bold tracking-tight">
          {Number(balance).toLocaleString()}
        </div>
        <div className="text-white/60 text-sm mt-1">UGX</div>
      </div>

      {/* Warnings */}
      {isLow && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-xl px-3 py-2.5">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>Low balance — please top up with your admin</span>
        </div>
      )}
      {hasDebt && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-xl px-3 py-2.5">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>Debt: {Number(outstandingDebt).toLocaleString()} UGX — please pay your admin</span>
        </div>
      )}
    </div>
  );
}
