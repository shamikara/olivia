-- Wishlists belong to the customer, not the browser.
--
-- Saved items lived only in localStorage, so a shopper who hearted products
-- on their phone found an empty list on a laptop, and clearing site data lost
-- them entirely. Nothing was ever sent to the server, which also meant the
-- shop could not see the clearest demand signal it gets.
--
-- Product ids, in the order they were saved. Not a child table: the list is
-- always read and written whole, and nothing queries across it.
alter table customers add column if not exists wishlist jsonb not null default '[]'::jsonb;
