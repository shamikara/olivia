-- Real admin accounts.
--
-- Until now there was one hardcoded administrator: the login route compared a
-- plaintext password against an env var that defaulted to "admin123", then
-- issued a token for a fixed "Olivia Chen" user whoever signed in. An unset
-- env var therefore meant a publicly known password on a public domain, and
-- nothing recorded who did what.
--
-- Passwords here are scrypt hashes in the same `salt:hash` form customers use
-- (lib/password.ts). Nothing stores or can recover the plaintext.

create table if not exists admin_users (
  id text primary key,
  -- Lowercased by the application before it gets here; the unique constraint
  -- is what actually stops two accounts sharing an address.
  email text not null unique,
  name text not null,
  password_hash text not null,
  role text not null default 'admin'
    check (role in ('super_admin', 'admin', 'store_manager', 'inventory_manager',
                    'marketing_manager', 'customer_support', 'content_editor')),
  -- Set on a seeded or reset account. The panel nags until it is cleared; it
  -- is not a hard gate, so an admin locked out mid-task can still work.
  must_change_password boolean not null default false,
  -- Preserves the audit trail: a departing admin is disabled, not deleted,
  -- so their id keeps resolving.
  disabled boolean not null default false,
  last_login_at timestamptz,
  created_at timestamptz not null default now()
);

-- Password resets.
--
-- Only the SHA-256 of the token is stored. The token itself exists once, in
-- the email — so a leak of this table cannot be used to take over an account,
-- which is the whole reason not to store it directly.
create table if not exists admin_password_resets (
  token_hash text primary key,
  admin_id text not null references admin_users(id) on delete cascade,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists admin_password_resets_admin_idx on admin_password_resets (admin_id);

-- The first administrator.
--
-- Password is "admin123", hashed — chosen deliberately as a temporary value
-- and flagged must_change_password, so the panel prompts for a real one on
-- first sign-in. Change it before this account is reachable by anyone else.
insert into admin_users (id, email, name, password_hash, role, must_change_password)
values (
  'adm_olivia_root',
  'oliviaglowlk@gmail.com',
  'oliviaAdmin',
  '5b0ebeccf0bcc66891f66be3622d11c1:073bf37f164b05ac18d2346b145ba80b1f982b49484418e2b94561222c8d89faaec9047d320c167aaeb19f25034533c72739105e348161c2291555d6984e6619',
  'super_admin',
  true
)
on conflict (email) do nothing;

alter table admin_users enable row level security;
alter table admin_password_resets enable row level security;
-- No policies: reached only with the service-role key from server code. These
-- tables hold password hashes and reset tokens and must never be exposed to
-- a publishable key.
