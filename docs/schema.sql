-- ============================================
-- DevFast Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. PROFILES TABLE (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  balance NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. MENU_ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price NUMERIC NOT NULL CHECK (price > 0),
  description TEXT DEFAULT '',
  is_special BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES public.menu_items(id),
  order_date DATE NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  total_price NUMERIC NOT NULL CHECK (total_price >= 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'delivered', 'failed', 'failed_reported')),
  billing_mode TEXT NOT NULL DEFAULT 'automatic' CHECK (billing_mode IN ('automatic', 'confirmation')),
  charge_status TEXT NOT NULL DEFAULT 'charged' CHECK (charge_status IN ('charged', 'pending', 'refunded')),
  charged_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  user_delivery_status TEXT NOT NULL DEFAULT 'pending' CHECK (user_delivery_status IN ('pending', 'confirmed', 'failed_reported')),
  admin_delivery_status TEXT NOT NULL DEFAULT 'pending' CHECK (admin_delivery_status IN ('pending', 'confirmed', 'failed_confirmed', 'rejected_failed')),
  failure_note TEXT,
  recurring_order_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3b. RECURRING_ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.recurring_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  days_of_week INTEGER[] NOT NULL,
  schedule_type TEXT NOT NULL DEFAULT 'selected_days' CHECK (schedule_type IN ('daily', 'weekdays', 'selected_days')),
  start_date DATE NOT NULL DEFAULT (NOW() AT TIME ZONE 'Africa/Kampala')::DATE,
  end_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  description TEXT DEFAULT '',
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_date ON public.orders(order_date);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_is_active ON public.menu_items(is_active);

-- ============================================
-- RLS + Triggers + Functions
-- (Already applied via Supabase MCP)
-- ============================================
-- See PROGRESS.md for full RLS policy list
