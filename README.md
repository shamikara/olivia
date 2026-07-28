# Olivia Glow

An original, responsive luxury skincare commerce platform built as an npm workspace monorepo with Next.js 16, React 19, and TypeScript.

## Workspace architecture

```
apps/
  storefront/    customer-facing Next.js storefront
  admin/         future dedicated Commerce Admin app
  api/           future REST/tRPC API app
  platform-os/   future jobs, workflows, and integrations
packages/
  commerce/      products, orders, inventory, customers, marketing, payments, shipping, reports
  ui/ auth/ database/ notifications/ analytics/
```

## Included experiences

- Editorial homepage with an original generated campaign image
- Brand mark integrated into the storefront navigation and footer
- Responsive product collection with client-side filters and add-to-bag feedback
- Product detail experience with quantity controls, collapsible ingredient and usage content, and recommended products
- Admin overview screen for daily ecommerce operations

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Brand storefront and discovery homepage |
| `/shop` | Product collection |
| `/product/morning-dew-serum` | Product detail page |
| `/admin` | Ecommerce operations overview |
| `/brands` | Curated brand directory |
| `/search` | Product discovery and search interface |
| `/wishlist` | Saved-product experience |
| `/cart` | Order-summary cart and coupon interaction |

## Run locally

```bash
npm install
npm run dev
```

Create an optimized production build with `npm run build`.

## Product direction

This release establishes the visual storefront and customer-product journey. Connecting checkout, authentication, inventory, CMS, payment processing, and analytics requires credentials and a chosen backend provider/database before those features can be deployed safely.
