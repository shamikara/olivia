-- A backup number for the courier.
--
-- Orders carried one phone number, so a delivery whose contact did not answer
-- had nowhere else to go but back to the depot. Couriers here routinely ask
-- for a second number, and customers already write one into the delivery
-- notes — this gives it a field of its own so it reaches the label.
--
-- Nullable, and stays nullable: it is optional at checkout, and every order
-- placed before this migration has only the one number.
alter table orders add column if not exists contact_phone_2 text;
