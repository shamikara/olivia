-- Stock movement on orders.
--
-- Until now stockCount was only ever read: product cards, "only N left"
-- badges, reports. Nothing in the order flow touched it, so a customer could
-- buy the last unit and the site would keep offering it.
--
-- Stock is taken when an order is confirmed, not when it is placed. An
-- abandoned checkout or an order that turns out to be a duplicate should not
-- hold inventory, and a confirmed order is one the shop has actually looked
-- at. Cancelling a confirmed order gives the stock back.

alter table orders add column if not exists stock_adjusted boolean not null default false;

-- Doing this in one statement rather than read-modify-write in the
-- application: two admins confirming orders at the same moment would
-- otherwise both read the same stockCount and one decrement would be lost.
--
-- p_direction: 1 takes stock (confirmed), -1 returns it (cancelled).
-- Returns true only when it actually moved stock, so the caller can tell a
-- real adjustment from a repeated one.
create or replace function adjust_order_stock(p_order_id text, p_direction int)
returns boolean
language plpgsql
as $$
declare
  v_order orders%rowtype;
  v_line jsonb;
begin
  -- Locks the order row for the duration, so the stock_adjusted check and
  -- the write that follows cannot interleave with another call.
  select * into v_order from orders where id = p_order_id for update;
  if not found then
    return false;
  end if;

  -- Idempotent in both directions: confirming twice takes stock once, and
  -- cancelling an order whose stock was never taken returns nothing.
  if p_direction = 1 and v_order.stock_adjusted then return false; end if;
  if p_direction = -1 and not v_order.stock_adjusted then return false; end if;

  for v_line in select * from jsonb_array_elements(v_order.lines)
  loop
    update products
       set data = jsonb_set(
             data,
             '{stockCount}',
             to_jsonb(
               greatest(
                 0,
                 coalesce((data->>'stockCount')::int, 0)
                   - p_direction * coalesce((v_line->>'quantity')::int, 0)
               )
             )
           ),
           updated_at = now()
     where id = v_line->>'productId';
  end loop;

  update orders set stock_adjusted = (p_direction = 1) where id = p_order_id;
  return true;
end
$$;
