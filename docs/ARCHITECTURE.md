# EarlyBird Architecture

## Folder Structure
```
devfast/
├── app/
│   ├── layout.tsx              # Root layout (fonts, providers, navbar)
│   ├── page.tsx                # Landing page
│   ├── globals.css             # Tailwind + custom styles
│   ├── auth/
│   │   ├── signin/page.tsx     # Sign-in form
│   │   ├── signup/page.tsx     # Sign-up form
│   │   ├── verify/page.tsx     # Email verification message
│   │   ├── callback/route.ts   # Auth callback handler
│   │   └── confirm/route.ts    # Email confirm redirect
│   ├── dashboard/
│   │   ├── page.tsx            # User dashboard
│   │   └── layout.tsx          # Dashboard layout (protected)
│   ├── orders/
│   │   └── history/page.tsx    # Order history
│   ├── admin/
│   │   ├── layout.tsx          # Admin layout (role check)
│   │   ├── dashboard/page.tsx  # Admin dashboard
│   │   ├── users/page.tsx      # User management
│   │   ├── menu/page.tsx       # Menu CRUD
│   │   └── orders/page.tsx     # Order management
│   └── api/                    # API routes if needed
├── components/
│   ├── ui/                     # shadcn/ui components
│   ├── navbar.tsx              # Top navigation
│   ├── order-form.tsx          # Order placement form
│   ├── menu-card.tsx           # Menu item display
│   ├── balance-card.tsx        # Balance display + warning
│   ├── top-up-form.tsx         # Admin top-up form
│   └── ...
├── lib/
│   ├── supabase/
│   │   ├── client.ts           # Browser client
│   │   ├── server.ts           # Server component client
│   │   └── middleware.ts       # Middleware client
│   ├── types.ts                # TypeScript types (DB types)
│   └── utils.ts                # Utility functions
├── middleware.ts                # Auth middleware
├── .env.local                  # Supabase URL + anon key
└── docs/
    ├── PROGRESS.md             # This progress tracker
    ├── ARCHITECTURE.md         # This file
    └── schema.sql              # DB schema reference
```

## Key Design Decisions
1. **Server Components by default** — Client Components only for interactive forms
2. **Server Actions** for mutations (place order, top-up, CRUD) — no API routes needed
3. **@supabase/ssr** for cookie-based auth in middleware + server components
4. **RLS enforced at DB level** — even if app code has bugs, data is protected
5. **Balance managed via DB function** — atomic deduction on order placement
6. **8 PM cutoff** enforced both client-side (UI) and server-side (RLS + server action)
7. **Mobile-first** — all layouts designed for phone screens first

## Auth Flow
1. User signs up → Supabase creates auth.users entry
2. DB trigger creates profiles row with role='user', balance=0
3. Email verification sent → user clicks link → /auth/callback handles token
4. Middleware checks session on every protected route
5. Admin role checked in admin layout (redirect if not admin)

## Order Flow
1. User views menu on dashboard
2. Selects item + quantity → sees total
3. Submits → Server Action checks: balance >= total, order_date > today, time < 8 PM
4. If valid → inserts order + deducts balance atomically
5. User can cancel before cutoff → balance refunded

## Balance Flow
1. Admin goes to /admin/users → sees user list with balances
2. Clicks top-up → enters amount + description
3. Server Action: updates profile.balance + inserts transaction record
4. All in a single DB transaction for consistency
