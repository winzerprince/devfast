# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

EarlyBird is a breakfast order and subscription management system for a small office team. An admin manages the menu and user balances (cash-based, no online payments), while users place/cancel orders, set up recurring schedules, and track their balance. Currency is UGX (Ugandan Shillings).

## Commands

```bash
npm run dev      # Start development server (Next.js)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint (flat config)
```

No test framework is configured.

## Tech Stack

- **Next.js 16** (App Router) with React 19 and TypeScript
- **Supabase** for auth (email+password), PostgreSQL database, and Row Level Security
- **Tailwind CSS v4** with **shadcn/ui** (new-york style) components
- **@supabase/ssr** for cookie-based auth across server/client/middleware
- Path alias: `@/*` maps to project root

## Architecture

### Data Flow Pattern

- **Server Components** (pages, layouts) fetch data directly from Supabase via `createClient()` from `lib/supabase/server.ts`
- **Client Components** (`"use client"`) handle interactivity and mutations via `createClient()` from `lib/supabase/client.ts`
- Business logic mutations use **Supabase RPC functions** (`supabase.rpc()`), not server actions or API routes
- After mutations, components use `window.location.reload()` for refresh

### Key RPC Functions (defined in Supabase, called from client)

- `place_multi_order` — Atomic multi-item order placement with balance deduction
- `cancel_order` — Cancel order + refund balance
- `admin_topup` — Admin tops up user balance + creates transaction record
- `set_my_drain_mode` — User toggles billing mode (automatic vs confirmation)
- `report_my_order_outcome` — User reports delivery received or failed
- `admin_review_order` — Admin confirms delivery / confirms failure (refund) / rejects claim
- `sync_my_recurring_orders` — Syncs recurring orders 14 days ahead

### Three Supabase Client Types

- `lib/supabase/client.ts` — Browser client for client components
- `lib/supabase/server.ts` — Server client (uses `cookies()`) for server components
- `lib/supabase/middleware.ts` — Middleware client for session refresh in `middleware.ts`

### Route Protection

- `middleware.ts` refreshes auth sessions on all non-static routes
- Public routes: `/`, `/auth/*`
- Protected route access without session → redirect to `/auth/signin`
- Admin pages (`/admin/*`) check `profile.role === "admin"` in layout, redirect to `/dashboard` if not admin
- Each protected layout (`/dashboard`, `/orders`, `/admin`) independently fetches the user profile

### Database (5 tables)

- `profiles` — Extends auth.users (role, balance, drain_mode)
- `menu_items` — Breakfast items with price, is_special, is_active flags
- `orders` — Individual orders with dual delivery confirmation (user + admin status)
- `recurring_orders` — Weekly schedules with days_of_week array
- `transactions` — Admin top-up audit trail

Schema reference: `docs/schema.sql`

### Business Rules

- **8 PM cutoff** (Africa/Kampala timezone) for next-day orders
- **Low balance threshold**: 5,000 UGX
- **Billing modes**: "automatic" (charged on order) or "confirmation" (charged after delivery)
- **Dual delivery confirmation**: Both user and admin must confirm/report delivery status
- Order statuses: pending → confirmed → delivered/cancelled/failed/failed_reported
- Charge statuses: pending, charged, refunded

## Conventions

- File names: kebab-case (`order-form.tsx`)
- Components: PascalCase (`OrderForm`)
- DB/type fields: snake_case matching database columns
- UI components live in `components/ui/` (shadcn primitives), business components in `components/`
- Toast notifications via `sonner` (`toast.success()` / `toast.error()`)
- Loading spinners use `Loader2` from lucide-react
- Status badges are color-coded (yellow=pending, blue=confirmed, green=delivered, red=cancelled/failed)

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=<supabase-project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase-anon-key>
```
