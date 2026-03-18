import { addDays, format } from "date-fns";
import { DEBT_BLOCK_THRESHOLD, LOW_BALANCE_THRESHOLD, type DrainMode, type MenuItem, type PaymentMethod } from "@/lib/types";

export interface OrderLine {
  menu_item_id: string;
  quantity: number;
}

export interface OrderWindow {
  isPastCutoff: boolean;
  orderDate: Date;
  orderDateLabel: string;
  cutoffMessage: string;
}

export interface BalanceStatus {
  threshold: number;
  isLow: boolean;
  isNegative: boolean;
  isDebtBlocked: boolean;
  hasDebt: boolean;
}

export function getKampalaNow(now = new Date()): Date {
  return new Date(now.toLocaleString("en-US", { timeZone: "Africa/Kampala" }));
}

export function getOrderWindow(kampalaNow: Date, cutoffHour = 20): OrderWindow {
  const isPastCutoff = kampalaNow.getHours() >= cutoffHour;
  const orderDate = isPastCutoff ? addDays(kampalaNow, 2) : addDays(kampalaNow, 1);
  const orderDateLabel = format(orderDate, "EEEE, MMM d");

  return {
    isPastCutoff,
    orderDate,
    orderDateLabel,
    cutoffMessage: isPastCutoff
      ? `It's past 8 PM. Orders are now for ${orderDateLabel}.`
      : "Order before 8 PM tonight for tomorrow's breakfast.",
  };
}

export function getBalanceStatus(
  balance: number,
  outstandingDebt = 0,
  cheapestItem?: number,
): BalanceStatus {
  const threshold = cheapestItem
    ? Math.max(cheapestItem, LOW_BALANCE_THRESHOLD)
    : LOW_BALANCE_THRESHOLD;

  return {
    threshold,
    isLow: balance >= 0 && balance < threshold,
    isNegative: balance < 0,
    isDebtBlocked: balance < DEBT_BLOCK_THRESHOLD,
    hasDebt: outstandingDebt > 0,
  };
}

export function buildOrderLines(quantities: Record<string, number>): OrderLine[] {
  return Object.entries(quantities)
    .filter(([, quantity]) => quantity > 0)
    .map(([menu_item_id, quantity]) => ({ menu_item_id, quantity }));
}

export function calculateOrderTotal(orderLines: OrderLine[], menuItems: MenuItem[]): number {
  return orderLines.reduce((sum, line) => {
    const item = menuItems.find((menuItem) => menuItem.id === line.menu_item_id);
    return sum + (item ? Number(item.price) * line.quantity : 0);
  }, 0);
}

export function hasInsufficientBalance(
  balance: number,
  orderTotal: number,
  paymentMethod: PaymentMethod,
  drainMode: DrainMode,
): boolean {
  return paymentMethod === "prepaid" && drainMode === "automatic" && balance < orderTotal;
}

export function canPlaceOrder(
  orderLines: OrderLine[],
  isDebtBlocked: boolean,
  insufficientBalance: boolean,
): boolean {
  return !isDebtBlocked && orderLines.length > 0 && !insufficientBalance;
}
