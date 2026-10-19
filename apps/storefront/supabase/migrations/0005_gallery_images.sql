-- Products can carry a gallery, not just a main and a second image.
--
-- A gallery image is role 'gallery'; there are several per product, so
-- nothing may assume one active asset per role any more. Which assets are
-- live is decided by whether the product still references their URL, not by
-- which slot they were uploaded into — slots stop being stable the moment
-- the shop reorders the gallery.
--
-- 'secondary' stays in the constraint: rows written before this exist, and
-- retiring them on read would discard images the site is still serving.

alter table media_assets drop constraint if exists media_assets_image_role_check;

alter table media_assets add constraint media_assets_image_role_check
  check (image_role in ('main', 'secondary', 'gallery', 'unassigned'));
