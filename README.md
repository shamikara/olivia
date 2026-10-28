# Olivia Glow

A K-beauty and luxury skincare store for the Sri Lankan market — storefront,
customer accounts, checkout and a full admin back office. Next.js 16, React 19,
TypeScript, Supabase Postgres. Prices are LKR; delivery is islandwide.

## Where the code is

Everything that runs is in `apps/storefront`. It serves both the storefront and
the admin panel (at `/admin`) from one Next.js app.

```
apps/
  storefront/    the application — storefront, admin, API routes
  admin/         NOT IMPLEMENTED — a static mock dashboard, wired to nothing
  api/           NOT IMPLEMENTED — a README placeholder
  platform-os/   NOT IMPLEMENTED — a README placeholder
packages/
  auth/          real: jose JWT sign/verify and the UserRole union
  commerce/*     NOT IMPLEMENTED — one-line type aliases, imported by nothing
  ui/ database/ notifications/ analytics/
                 NOT IMPLEMENTED — same
```

Only `@olivia/auth` is imported by the application. The rest of `packages/` and
the three stub apps are scaffolding from the original project skeleton, kept
only because removing them hasn't been decided. Treat them as empty: in
particular `packages/commerce/products` exports a `Product` type that is **not**
the product type this app uses, and `apps/admin` renders hardcoded USD figures
that have nothing to do with the real store.

The real product type is `BeautyProduct` in
`apps/storefront/app/data/products.ts`. Products are flat — one price, one stock
count, no variants or SKUs.

## Stack

| Concern | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router), React 19 |
| Database | Supabase Postgres via `@supabase/supabase-js` — no ORM |
| Media | Supabase Storage, images optimised on upload with `sharp` |
| Sessions | JWT cookies (`jose`), separate admin and customer secrets |
| Passwords | scrypt, constant-time comparison |
| Email | Resend — order confirmations, invoices, status updates |
| Payments | Koko, Mintpay, PayPal, cash on delivery, bank transfer |
| Styling | Hand-written CSS with custom properties. No Tailwind |
| Motion | Lenis smooth scroll, GSAP |

PayPal does not settle in LKR, so those orders are charged in USD converted from
the LKR total at a rate fetched at checkout time. Koko and Mintpay are Sri
Lankan instalment providers.

## What works

Storefront — editorial homepage, catalogue with category and brand filters,
search across names, brands, ingredients and concerns, product detail with
galleries, quick view, cart drawer, wishlist, side-by-side comparison, and a
scripted skin concierge that answers from the live catalogue and hands off to
WhatsApp. The concierge is a decision tree, not a language model; see
`app/lib/chat-script.ts` for why.

Comparison — products are picked from the cards into a docked tray and lined up
at `/compare`, up to four at a time. The table can collapse to only the rows
where the products actually differ, which is what makes it useful on a shelf
carrying six near-identical capsule creams.

Accounts — registration, sign in, profile, saved addresses with Sri Lankan
postal lookup, order history, and a wishlist that merges a guest's saved items
into their account on sign in.

Checkout — discount codes, a Koko payment surcharge, stock synced down on
order, order references, confirmation email, and an order status page.

Admin (`/admin`) — overview, orders, products with image upload, inventory,
customers, marketing, reports, payments, email, settings, and printable
delivery labels. Every module in the sidebar is backed by real data; modules
from the original scaffold that had nothing behind them were removed rather
than left as dead links.

Not built: customer-submitted reviews, loyalty or referrals. Product `rating`
and `reviewsCount` are static fields on the product record, shown only when set.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Homepage |
| `/shop` | Catalogue, filtered by `?category=` and `?brand=` |
| `/product/[id]` | Product detail |
| `/search` | Search across the catalogue |
| `/compare` | Side-by-side comparison of up to four products |
| `/brands` | Brand directory |
| `/cart`, `/checkout` | Cart and checkout |
| `/order/[reference]` | Order status |
| `/wishlist` | Saved products |
| `/account` | Profile, addresses, orders — `/login`, `/register` |
| `/admin` | Admin panel — `/login`, `/labels` |

API routes live under `app/api/` in matching groups: `account/`, `admin/`,
`payments/`, plus `orders`, `discount`, `address` and `store-settings`.

## Run locally

```bash
npm install
npm run dev          # storefront + admin on :3000
```

The app needs a Supabase project before it will serve anything — there is no
file-based fallback, and an unconfigured database throws rather than quietly
returning an empty shop.

1. Copy `apps/storefront/.env.example` to `apps/storefront/.env.local` and fill
   in `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET` and
   `CUSTOMER_JWT_SECRET`. Generate the secrets with `openssl rand -base64 32`;
   both fall back to publicly known defaults, which means forgeable sessions.
2. Apply `apps/storefront/supabase/migrations/*.sql` in order to that project.
3. Start the app. The `products` table seeds itself from the catalogue checked
   in at `app/data/products.ts` on first run.

Payment gateways, email and media storage are optional in development — without
credentials the gateways are switched off and email sends are skipped with a
warning rather than failing the request. `.env.example` documents every variable
and what breaks without it.

Admin accounts are not configured by environment. They live in the
`admin_users` table with scrypt-hashed passwords, the first seeded by migration
0004. There is no default password and no env fallback.

## Build and deploy

```bash
npm run build        # storefront and admin
npm run typecheck
```

Deployed on Vercel from `vercel.json`, which builds the storefront workspace and
registers a nightly cron at `/api/admin/media/cleanup/cron` to purge replaced
images after their grace period. That endpoint authenticates with `CRON_SECRET`.

## Data

The catalogue in `app/data/products.ts` is imported from the client's existing
hibeauty.lk catalogue and is the seed, not the live copy — once seeded, products
are edited through the admin panel and stored in Postgres. Regenerate the file
rather than hand-editing it if the source catalogue changes.

`apps/storefront/data/` is gitignored runtime state left over from the
file-backed era. Nothing reads it now.
