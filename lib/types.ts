export type UserRole = "user" | "admin";

export type OrderStatus = "pending" | "confirmed" | "cancelled" | "delivered" | "failed" | "failed_reported";

export type DrainMode = "automatic" | "confirmation";

export type ChargeStatus = "charged" | "pending" | "refunded";

export type PaymentMethod = "prepaid" | "pay_on_delivery" | "pay_later";

export type PaymentStatus = "paid" | "unpaid";

export type DeliveryUserStatus = "pending" | "confirmed" | "failed_reported";

export type DeliveryAdminStatus = "pending" | "confirmed" | "failed_confirmed" | "rejected_failed";

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  balance: number;
  outstanding_debt: number;
  drain_mode: DrainMode;
  created_at: string;
  updated_at: string;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  description: string;
  image_url: string | null;
  is_special: boolean;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  menu_item_id: string;
  order_date: string;
  quantity: number;
  total_price: number;
  status: OrderStatus;
  billing_mode: DrainMode;
  charge_status: ChargeStatus;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  charged_at: string | null;
  refunded_at: string | null;
  user_delivery_status: DeliveryUserStatus;
  admin_delivery_status: DeliveryAdminStatus;
  failure_note: string | null;
  packaging_notes: string | null;
  recurring_order_id: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  menu_item?: MenuItem;
  profile?: Profile;
}

export interface RecurringOrder {
  id: string;
  user_id: string;
  menu_item_id: string;
  quantity: number;
  days_of_week: number[];
  schedule_type: "daily" | "weekdays" | "selected_days";
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  menu_item?: MenuItem;
}

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  description: string;
  created_by: string;
  created_at: string;
  // Joined fields
  profile?: Profile;
}

export interface PlaceOrderResult {
  success?: boolean;
  error?: string;
  order_id?: string;
  item?: string;
  quantity?: number;
  total?: number;
  new_balance?: number;
  order_date?: string;
}

export interface CancelOrderResult {
  success?: boolean;
  error?: string;
  refunded?: number;
}

export interface TopUpResult {
  success?: boolean;
  error?: string;
  new_balance?: number;
}

export interface OrderOutcomeResult {
  success?: boolean;
  error?: string;
  status?: string;
  new_balance?: number;
}

export interface MenuAvailability {
  id: string;
  menu_item_id: string;
  available_date: string;
  created_by: string | null;
  created_at: string;
}

export interface MarkPaidResult {
  success?: boolean;
  error?: string;
}

// Low balance threshold in UGX
export const LOW_BALANCE_THRESHOLD = 5000;

// Debt block threshold: orders blocked when balance falls below this (negative)
export const DEBT_BLOCK_THRESHOLD = -10000;
