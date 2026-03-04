---
description: Describe when these instructions should be loaded
# applyTo: 'Describe when these instructions should be loaded' # when provided, instructions will automatically be added to the request context when the pattern matches an attached file
---
You are an expert full-stack developer specializing in Next.js 15+ (App Router), React Server Components, Supabase (Auth + Database + RLS), Tailwind CSS, and Vercel deployment.

Create a complete starter web application called "DevFast" — a breakfast order & subscription management system for a small team (office colleagues).

Core goal:
- One admin (the breakfast organizer) manually manages everything.
- Colleagues (users) sign up, see remaining balance, place/change/cancel orders for the next day (cutoff: 8 PM the previous night), view menu, see their order history.
- No online payments — admin receives cash physically at work and manually tops up user balances in the app.
- Balance depletes based on the actual price of each ordered breakfast item.
- When balance is low (e.g. < price of cheapest item or < 5000 UGX — you decide sensible threshold), show warning on dashboard and during order placement.
- Menu is mostly fixed but admin can add/remove items or mark special/daily items that appear highlighted on user dashboard.

Tech stack (strictly use these):
- Next.js 15+ with App Router (use Server Components by default, Client Components only when needed)
- Supabase for:
  - Authentication (email + password + magic links / OTP if easy, email verification required)
  - PostgreSQL database
  - Row Level Security (RLS) on all tables
  - Use @supabase/ssr for server-side auth in middleware / server components
- Tailwind CSS + shadcn/ui components (or plain Tailwind if shadcn not needed)
- Mobile-first responsive design (prioritize phone screens)
- Vercel for deployment (mention any special vercel.json or env setup if needed)
- No external payment APIs

Database schema (suggest and implement these tables with proper relations + RLS):

1. profiles (extends auth.users)
   - id: uuid (fk to auth.users)
   - full_name: text
   - role: text ('user' | 'admin') — default 'user', only one or few admins
   - balance: numeric (default 0) — money in UGX
   - created_at, updated_at

2. menu_items
   - id: uuid (pk)
   - name: text (e.g. "Chapati + Beans")
   - price: numeric (e.g. 8000)
   - description: text
   - is_special: boolean (for daily/featured items)
   - is_active: boolean (default true)
   - created_by: uuid (admin who added)
   - created_at, updated_at

3. orders
   - id: uuid (pk)
   - user_id: uuid (fk profiles)
   - menu_item_id: uuid (fk menu_items)
   - order_date: date (the breakfast date — next day)
   - quantity: int (default 1)
   - total_price: numeric (price × quantity at time of order)
   - status: text ('pending', 'confirmed', 'cancelled', 'delivered')
   - created_at, updated_at

4. transactions (for admin top-ups — audit trail)
   - id: uuid
   - user_id: uuid
   - amount: numeric (positive for top-up)
   - description: text (e.g. "Cash payment Mar 5")
   - created_by: uuid (admin)
   - created_at

RLS policies (implement secure ones):
- Users can only read/update their own profile + balance view
- Users can only see their own orders + create/update orders for future dates
- Admin can read/write all profiles, menu_items, orders, transactions
- Menu_items readable by all authenticated users
- Orders: users can only insert/update their own if order_date > CURRENT_DATE
- Use auth.uid() and role checks where needed

Auth flow:
- Public sign-up page (email + password, verification required)
- After sign-up → redirect to dashboard
- Protected routes: use middleware to check session
- Admin role check: simple — hardcode your email as admin or add via dashboard later

Pages / structure (App Router folders):
- / (landing page — simple "Welcome to DevFast – Breakfast made easy")
- /auth/signin, /auth/signup, /auth/verify
- /dashboard (user home: balance, low-balance warning, today's menu + specials, place order form for tomorrow, my upcoming orders)
- /orders/history (user's past orders)
- /admin (protected):
  - /admin/dashboard (today's orders summary, total meals, list of orders)
  - /admin/users (list users + balances + top-up form)
  - /admin/menu (CRUD for menu items)
  - /admin/orders (view all, mark delivered?)

Features to implement:
User side:
- See current balance + warning if low
- View menu (highlight special items)
- Select item + quantity → see total cost → place order (only if enough balance + before 8 PM cutoff)
- Change/cancel own future orders
- Simple order history

Admin side:
- See today's full order list (group by user, total count, items)
- Manually add money to any user balance (with description)
- Add/edit/disable menu items
- Basic stats (e.g. total revenue this week)

Additional:
- Use date-fns or luxon for date handling
- Show toast notifications (sonner or similar)
- Simple protected layout with navbar (role-based links)
- Error handling + loading states
- TypeScript everywhere
- Environment variables for Supabase URL + anon key

Output format:
1. Folder structure tree
2. Key files with code:
   - app/layout.tsx
   - middleware.ts
   - lib/supabase.ts (client + server clients)
   - SQL schema + RLS policies (as SQL to run in Supabase dashboard)
   - Main pages/components (dashboard, admin, order form, etc.)
   - Any hooks/utils
3. Setup instructions (npm install, env vars, Vercel notes, Supabase setup steps)
4. Next steps / nice-to-haves

Start generating the full starter code structure now. Make it clean, modern, secure, and easy to extend. Focus on mobile-first UI with good spacing on small screens. Also endeavor to use mcp for supabase and vercel to simplify deployment and environment management as well as database configuration.