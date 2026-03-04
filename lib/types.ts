export type UserRole = "user" | "admin";

export type OrderStatus = "pending" | "confirmed" | "cancelled" | "delivered";

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  balance: number;
  created_at: string;
  updated_at: string;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  description: string;
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
  created_at: string;
  updated_at: string;
  // Joined fields
  menu_item?: MenuItem;
  profile?: Profile;
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

// Low balance threshold in UGX
export const LOW_BALANCE_THRESHOLD = 5000;
