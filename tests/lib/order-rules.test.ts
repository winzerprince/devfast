import {
  buildOrderLines,
  calculateOrderTotal,
  canPlaceOrder,
  getBalanceStatus,
  getOrderWindow,
  hasInsufficientBalance,
} from "@/lib/order-rules";
import type { MenuItem } from "@/lib/types";

describe("order-rules", () => {
  it("uses tomorrow when before 8 PM cutoff", () => {
    const kampalaNow = new Date("2026-03-18T19:15:00+03:00");
    const result = getOrderWindow(kampalaNow);

    expect(result.isPastCutoff).toBe(false);
    expect(result.orderDate.toISOString().slice(0, 10)).toBe("2026-03-19");
    expect(result.cutoffMessage).toContain("Order before 8 PM tonight");
  });

  it("uses day-after-tomorrow when after 8 PM cutoff", () => {
    const kampalaNow = new Date("2026-03-18T20:01:00+03:00");
    const result = getOrderWindow(kampalaNow);

    expect(result.isPastCutoff).toBe(true);
    expect(result.orderDate.toISOString().slice(0, 10)).toBe("2026-03-20");
    expect(result.cutoffMessage).toContain("It's past 8 PM");
  });

  it("computes balance status using max of cheapest item and low threshold", () => {
    const result = getBalanceStatus(4500, 1000, 8000);

    expect(result.threshold).toBe(8000);
    expect(result.isLow).toBe(true);
    expect(result.isNegative).toBe(false);
    expect(result.isDebtBlocked).toBe(false);
    expect(result.hasDebt).toBe(true);
  });

  it("builds order lines from positive quantities only", () => {
    const lines = buildOrderLines({ a: 2, b: 0, c: -1, d: 1 });

    expect(lines).toEqual([
      { menu_item_id: "a", quantity: 2 },
      { menu_item_id: "d", quantity: 1 },
    ]);
  });

  it("calculates order total using menu prices and quantities", () => {
    const menuItems = [
      { id: "a", price: 7000 },
      { id: "b", price: 9000 },
    ] as MenuItem[];

    const total = calculateOrderTotal(
      [
        { menu_item_id: "a", quantity: 2 },
        { menu_item_id: "b", quantity: 1 },
        { menu_item_id: "missing", quantity: 5 },
      ],
      menuItems,
    );

    expect(total).toBe(23000);
  });

  it("enforces insufficient balance only for prepaid automatic", () => {
    expect(hasInsufficientBalance(5000, 7000, "prepaid", "automatic")).toBe(true);
    expect(hasInsufficientBalance(5000, 7000, "prepaid", "confirmation")).toBe(false);
    expect(hasInsufficientBalance(5000, 7000, "pay_later", "automatic")).toBe(false);
  });

  it("allows placing order only when lines exist and balance/debt checks pass", () => {
    const lines = [{ menu_item_id: "a", quantity: 1 }];

    expect(canPlaceOrder(lines, false, false)).toBe(true);
    expect(canPlaceOrder([], false, false)).toBe(false);
    expect(canPlaceOrder(lines, true, false)).toBe(false);
    expect(canPlaceOrder(lines, false, true)).toBe(false);
  });
});
