-- Core application data: what used to live in apps/storefront/data/*.json.
--
-- Those files worked on a host with a writable disk, but Vercel's filesystem
-- is read-only outside /tmp and ephemeral per invocation, so every write was
-- either failing or being discarded between requests: orders were taken and
-- lost, customer sign-ups vanished, and admin edits never persisted.
--
-- Shapes are kept deliberately close to the JSON they replace so the store
-- modules keep their existing signatures. Where a field was a nested object or
-- array in the file (order lines, saved addresses, the product record itself)
-- it stays jsonb rather than being normalised into child tables — the app
-- reads and writes those as whole documents and never queries inside them.

create extension if not exists pgcrypto;

-- Store settings. Exactly one row, enforced by the primary key check, because
-- the settings file it replaces was a single JSON object.
create table if not exists app_settings (
  id int primary key default 1 check (id = 1),
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- Products. `data` is the whole BeautyProduct record as the admin panel and
-- the catalogue seed already shape it; nothing queries inside it, the app
-- loads the full catalogue and filters in memory.
--
-- sort_order preserves the array order the JSON file had, which the admin
-- panel relies on: a newly created product appears at the top of the list.
create table if not exists products (
  id text primary key,
  sort_order int not null default 0,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_sort_order_idx on products (sort_order);

create table if not exists discounts (
  code text primary key,
  type text not null default 'percent' check (type in ('percent', 'fixed')),
  -- A percentage (10 = 10%) or a flat LKR amount, depending on `type`.
  value numeric not null default 0 check (value >= 0),
  min_spend_lkr numeric not null default 0 check (min_spend_lkr >= 0),
  active boolean not null default true,
  usage_count int not null default 0 check (usage_count >= 0),
  -- Null means unlimited.
  usage_limit int,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists customers (
  id text primary key,
  -- Normalised to lowercase by the application before it ever reaches here;
  -- the unique constraint is what actually prevents a duplicate sign-up, which
  -- the file store could not do under concurrent requests.
  email text not null unique,
  name text not null,
  phone text,
  -- scrypt hash, never a password. See lib/customer-auth.ts.
  password_hash text not null,
  addresses jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- Human-friendly order references (OG-1001, OG-1002, ...). A sequence rather
-- than "highest existing number + 1": the latter re-derives the same reference
-- for two orders placed at the same moment, which the unique constraint below
-- would then reject.
create sequence if not exists order_reference_seq start 1001;

create table if not exists orders (
  id text primary key,
  -- Defaulted rather than supplied by the application, so the number is drawn
  -- inside the same statement that inserts the row.
  reference text not null unique default ('OG-' || nextval('order_reference_seq')),
  -- Not a foreign key to customers: guest checkout leaves this null, and an
  -- order must survive the customer record being removed. Same reasoning as
  -- media_assets.product_id in 0001.
  customer_id text,
  contact_name text not null,
  contact_phone text not null,
  contact_email text,
  -- OrderLine[]: productId, name, brand, image, quantity, unitPriceLKR,
  -- lineTotalLKR. Snapshotted at checkout so a later price or name change
  -- never rewrites what the customer actually ordered.
  lines jsonb not null default '[]'::jsonb,
  subtotal_lkr integer not null default 0,
  discount_lkr integer not null default 0,
  shipping_lkr integer not null default 0,
  total_lkr integer not null default 0,
  discount_code text,
  address jsonb,
  note text,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'packing', 'shipped', 'delivered', 'cancelled')),
  created_at timestamptz not null default now(),

  -- Payment state is tracked separately from fulfilment: a Koko order can be
  -- paid while still pending, and a COD order ships while still unpaid.
  payment_method text not null default 'whatsapp'
    check (payment_method in ('cod', 'whatsapp', 'koko', 'mintpay', 'paypal')),
  payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid', 'pending', 'paid', 'failed', 'cancelled')),
  gateway_reference text,
  transaction_id text,
  payment_evidence text
    check (payment_evidence is null or payment_evidence in ('signed-callback', 'order-view', 'return-hash', 'manual')),
  paid_at timestamptz
);

create index if not exists orders_created_at_idx on orders (created_at desc);
create index if not exists orders_customer_id_idx on orders (customer_id);
create index if not exists orders_payment_status_idx on orders (payment_status);

-- Redeeming a code is read-modify-write in the application, which loses
-- increments when two shoppers check out at once. Doing it in one statement
-- makes the count accurate under concurrency.
create or replace function increment_discount_usage(p_code text)
returns void
language sql
as $$
  update discounts set usage_count = usage_count + 1 where code = upper(trim(p_code));
$$;

-- Settling a payment is the one operation that must not race. Koko delivers
-- its callback more than once by design, and the browser-return path can be
-- resolving the same order at the same moment; read-then-write in the
-- application lets both pass the "not settled yet" check.
--
-- The guard lives in the WHERE clause instead, so exactly one caller updates
-- the row and the rest get no rows back. Returning zero rows therefore means
-- "unknown order, or already settled" — which is precisely when the caller
-- should do nothing.
create or replace function settle_order_payment(
  p_reference text,
  p_status text,
  p_transaction_id text,
  p_evidence text
)
returns setof orders
language sql
as $$
  update orders set
    payment_status = p_status,
    transaction_id = coalesce(p_transaction_id, transaction_id),
    payment_evidence = p_evidence,
    paid_at = case when p_status = 'paid' then now() else paid_at end,
    -- A paid order is one the shop should act on; leave any later
    -- fulfilment state (packing, shipped) alone.
    status = case when p_status = 'paid' and status = 'pending' then 'confirmed' else status end
  where reference = p_reference
    and payment_status not in ('paid', 'cancelled')
  returning *;
$$;

alter table app_settings enable row level security;
alter table products enable row level security;
alter table discounts enable row level security;
alter table customers enable row level security;
alter table orders enable row level security;
-- No policies, matching 0001: these are reached only with the service-role
-- key from server code, which bypasses RLS. The browser never talks to
-- Supabase directly, and customers/orders hold personal data and password
-- hashes that must never be exposed to an anon key.
