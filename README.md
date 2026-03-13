# EarlyBird

> Breakfast order & subscription management for your office team.

EarlyBird is a PWA-first web application that lets a small office team pre-order breakfast through a simple, cash-based wallet system. An admin manages the menu and tops up user balances; team members place orders before the 8 PM daily cutoff and track their breakfast history.

---

## Features

- **Wallet system** — prepaid balances topped up by admin; ordering blocked below –10,000 UGX
- **Multi-item orders** — place multiple items in a single transaction with optional packaging notes
- **Recurring schedules** — set weekly breakfast schedules that auto-sync 14 days ahead
- **Dual delivery confirmation** — both user and admin confirm delivery; discrepancies trigger a review flow
- **Three payment modes** — prepaid (wallet), pay on delivery, or pay later
- **Admin dashboard** — manage the menu, top up user balances, and review all orders
- **PWA-ready** — installable on iOS & Android with a maskable icon and offline service worker

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| UI | Tailwind CSS v4 + shadcn/ui (New York) |
| Auth | Supabase Auth (email + password) |
| Database | Supabase PostgreSQL with Row Level Security |
| PWA | Serwist service worker |
| Fonts | Geist (Vercel) |
| Currency | UGX (Ugandan Shillings) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project

### Setup

1. **Clone the repository**

   ```bash
   git clone <repo-url>
   cd devfast
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   Create a `.env.local` file in the project root:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=<your-supabase-project-url>
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
   ```

4. **Apply the database schema**

   Run the SQL in `docs/schema.sql` in your Supabase SQL editor to create all tables, RLS policies, and RPC functions.

5. **Start the development server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

---

## Project Structure

```
├── app/
│   ├── page.tsx              # Landing page
│   ├── manifest.ts           # PWA manifest
│   ├── auth/                 # Sign in / Sign up / Verify
│   ├── dashboard/            # User dashboard (Overview, New Order, Recurring, Upcoming tabs)
│   ├── orders/history/       # Order history
│   └── admin/                # Admin-only pages (Dashboard, Orders, Menu, Users)
├── components/
│   ├── ui/                   # shadcn/ui primitives
│   ├── sidebar.tsx           # Desktop fixed sidebar with gradient
│   ├── navbar.tsx            # Mobile top bar
│   ├── bottom-nav.tsx        # Mobile bottom navigation
│   ├── top-bar.tsx           # Desktop top bar (page title + date)
│   └── ...                   # Feature components (order form, balance card, etc.)
├── lib/
│   ├── supabase/             # Browser / server / middleware Supabase clients
│   └── types.ts              # TypeScript types matching DB schema
├── docs/
│   ├── schema.sql            # Database schema & migration history
│   └── ...
└── public/
    ├── logo.png              # App logo
    └── icons/                # PWA icons (192×192, 512×512, maskable, apple-touch)
```

---

## Key Business Rules

- Orders must be placed before **8 PM Africa/Kampala** for next-day delivery
- Low balance warning at **5,000 UGX**; ordering blocked below **–10,000 UGX**
- Currency: **UGX (Ugandan Shillings)**
- Delivery confirmed by **both** the user and admin independently
- No online payments — admin tops up balances manually after receiving cash

---

## License

Private — all rights reserved.
