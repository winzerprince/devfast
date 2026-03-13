import type { Order, OrderStatus, DrainMode, PaymentMethod, Profile } from "./types";

export interface OrderGroup {
  key: string;
  orders: Order[];
  order_date: string;
  created_at: string;
  user_id: string;
  profile?: Profile;
  payment_method: PaymentMethod;
  billing_mode: DrainMode;
  packaging_notes: string | null;
  total: number;
  status: OrderStatus;
  hasFailedClaim: boolean;
  canActOnDelivery: boolean;
}

const STATUS_PRIORITY: OrderStatus[] = [
  "failed_reported",
  "failed",
  "pending",
  "confirmed",
  "delivered",
  "cancelled",
];

function deriveStatus(orders: Order[]): OrderStatus {
  for (const s of STATUS_PRIORITY) {
    if (orders.some((o) => o.status === s)) return s;
  }
  return orders[0].status;
}

export function groupOrders(orders: Order[]): OrderGroup[] {
  const map = new Map<string, OrderGroup>();

  for (const order of orders) {
    const key = `${order.user_id}__${order.order_date}__${order.created_at}`;
    const existing = map.get(key);
    if (existing) {
      existing.orders.push(order);
      existing.total += Number(order.total_price);
    } else {
      map.set(key, {
        key,
        orders: [order],
        order_date: order.order_date,
        created_at: order.created_at,
        user_id: order.user_id,
        profile: order.profile,
        payment_method: order.payment_method,
        billing_mode: order.billing_mode,
        packaging_notes: order.packaging_notes,
        total: Number(order.total_price),
        // derived below
        status: order.status,
        hasFailedClaim: false,
        canActOnDelivery: false,
      });
    }
  }

  // Finalize derived fields
  for (const group of map.values()) {
    group.status = deriveStatus(group.orders);
    group.hasFailedClaim = group.orders.some(
      (o) => o.user_delivery_status === "failed_reported"
    );
    group.canActOnDelivery = group.orders.some(
      (o) =>
        o.status !== "cancelled" &&
        o.status !== "failed" &&
        o.status !== "delivered"
    );
    // Use the first non-null packaging note
    group.packaging_notes =
      group.orders.find((o) => o.packaging_notes)?.packaging_notes ?? null;
  }

  return Array.from(map.values());
}
