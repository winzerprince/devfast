import { AlertTriangle, Coffee, Wallet } from "lucide-react";
import { DEBT_BLOCK_THRESHOLD } from "@/lib/types";
import { getBalanceStatus } from "@/lib/order-rules";

interface BalanceCardProps {
  balance: number;
  outstandingDebt?: number;
  cheapestItem?: number;
}

export function BalanceCard({ balance, outstandingDebt = 0, cheapestItem }: BalanceCardProps) {
  const { isLow, isNegative, isDebtBlocked, hasDebt } = getBalanceStatus(
    balance,
    outstandingDebt,
    cheapestItem,
  );

  return (
    <div className="space-y-2">
      {/* Wallet card */}
      <div className={`rounded-2xl p-5 text-white ${isDebtBlocked ? "bg-gradient-to-br from-destructive to-red-700" : "bg-gradient-to-br from-primary to-orange-600"}`}>
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

      {/* Warnings — most severe first */}
      {isDebtBlocked && (
        <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-xl px-3 py-2.5">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Orders suspended. </span>
            <span>Your debt exceeds {Math.abs(DEBT_BLOCK_THRESHOLD).toLocaleString()} UGX. Please settle with your admin to resume ordering.</span>
          </div>
        </div>
      )}
      {!isDebtBlocked && isNegative && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-xl px-3 py-2.5">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>Negative balance — you owe {Math.abs(balance).toLocaleString()} UGX. Please top up soon.</span>
        </div>
      )}
      {!isNegative && isLow && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-xl px-3 py-2.5">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>Low balance — please top up with your admin</span>
        </div>
      )}
      {hasDebt && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-xl px-3 py-2.5">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>Outstanding debt: {Number(outstandingDebt).toLocaleString()} UGX — please pay your admin</span>
        </div>
      )}
    </div>
  );
}
