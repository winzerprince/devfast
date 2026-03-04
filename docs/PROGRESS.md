# DevFast - Progress Tracker

## Project Overview
**DevFast** — Breakfast order & subscription management system for a small office team.
- Admin manages menu, user balances (cash top-ups), and orders
- Users sign up, place orders for next-day breakfast (cutoff 8 PM), view balance/history
- No online payments — admin tops up balances manually

## Tech Stack
- Next.js 15+ (App Router, Server Components)
- Supabase (Auth + PostgreSQL + RLS + @supabase/ssr)
- Tailwind CSS + shadcn/ui
- TypeScript everywhere
- Vercel deployment
- Supabase project ref: `lhcqmeudptjasfduucmd`

## Database Tables
1. **profiles** - extends auth.users (id, full_name, role, balance, timestamps)
2. **menu_items** - breakfast items (name, price, description, is_special, is_active)
3. **orders** - user orders (user_id, menu_item_id, order_date, quantity, total_price, status)
4. **transactions** - admin cash top-ups audit trail

## Pages Structure
- `/` — Landing page
- `/auth/signin`, `/auth/signup`, `/auth/verify` — Auth flow
- `/dashboard` — User home (balance, menu, order form, upcoming orders)
- `/orders/history` — User order history
- `/admin/dashboard` — Today's orders summary
- `/admin/users` — User management + balance top-up
- `/admin/menu` — Menu CRUD
- `/admin/orders` — All orders management

## Build Phases

### Phase 1: Foundation ⬜
- [ ] Initialize Next.js 15 project
- [ ] Install deps (shadcn/ui, @supabase/ssr, date-fns, sonner)
- [ ] Set up Supabase client libs (browser + server + middleware)
- [ ] Set up DB schema + RLS policies via Supabase MCP
- [ ] Create middleware.ts for auth protection

### Phase 2: Auth ⬜
- [ ] Sign-up page (email + password)
- [ ] Sign-in page
- [ ] Email verification / callback
- [ ] Profile creation trigger (on signup)

### Phase 3: User Features ⬜
- [ ] Landing page
- [ ] User dashboard (balance, warnings, menu, order form)
- [ ] Order placement (with balance check + cutoff validation)
- [ ] Order history page
- [ ] Cancel/change future orders

### Phase 4: Admin Features ⬜
- [ ] Admin dashboard (today's orders summary, stats)
- [ ] User management + balance top-up
- [ ] Menu CRUD (add/edit/disable items, mark specials)
- [ ] Admin orders view (mark delivered)

### Phase 5: Polish & Deploy ⬜
- [ ] Toast notifications (sonner)
- [ ] Loading states + error handling
- [ ] Mobile-first responsive polish
- [ ] Deploy to Vercel via MCP
- [ ] Environment variables setup

## Checkpoints
Use these when context is full to resume work:

### Checkpoint 1: Foundation Complete
- Next.js project initialized with all deps
- Supabase DB schema + RLS deployed
- Supabase client libs configured
- Middleware protecting routes
- Basic layout with navbar

### Checkpoint 2: Auth Complete
- Sign-up, sign-in, verify pages working
- Profile auto-created on signup
- Session management via middleware

### Checkpoint 3: User Features Complete
- Dashboard with balance, menu, order form
- Order placement with validations
- Order history page

### Checkpoint 4: Admin Features Complete
- Admin dashboard with stats
- User management + top-ups
- Menu CRUD
- Order management

### Checkpoint 5: Deployed
- Live on Vercel
- All env vars configured
