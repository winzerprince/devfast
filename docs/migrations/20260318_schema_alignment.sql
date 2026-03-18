-- Align production schema with current app domain model.

-- Profiles: app expects outstanding_debt.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS outstanding_debt NUMERIC NOT NULL DEFAULT 0;

-- Orders: app domain uses payment method and payment status.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'prepaid',
  ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'paid';

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;
ALTER TABLE public.orders
  ADD CONSTRAINT orders_payment_method_check
  CHECK (payment_method IN ('prepaid', 'pay_on_delivery', 'pay_later'));

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;
ALTER TABLE public.orders
  ADD CONSTRAINT orders_payment_status_check
  CHECK (payment_status IN ('paid', 'unpaid'));

-- Menu availability: app queries this table for date-based menu visibility.
CREATE TABLE IF NOT EXISTS public.menu_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  available_date DATE NOT NULL,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(menu_item_id, available_date)
);

CREATE INDEX IF NOT EXISTS idx_menu_availability_date
  ON public.menu_availability(available_date);

ALTER TABLE public.menu_availability ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'menu_availability'
      AND policyname = 'Authenticated users can read menu availability'
  ) THEN
    CREATE POLICY "Authenticated users can read menu availability"
    ON public.menu_availability
    FOR SELECT
    USING (auth.uid() IS NOT NULL);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'menu_availability'
      AND policyname = 'Admins can manage menu availability'
  ) THEN
    CREATE POLICY "Admins can manage menu availability"
    ON public.menu_availability
    FOR ALL
    USING (
      EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
      )
    );
  END IF;
END $$;
