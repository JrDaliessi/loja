create or replace function public.create_order_with_items(
  cart_items jsonb,
  user_id_input uuid,
  shipping_cost_input numeric default 0,
  coupon_code_input text default null,
  coupon_discount_input numeric default 0
) returns uuid as $$
declare
  new_order_id uuid;
  cart_item record;
  total_items_price numeric := 0;
  total_items_count int := 0;
begin
  -- Calcular o preço total e a contagem de itens
  for cart_item in select * from jsonb_to_recordset(cart_items) as x(variant_id bigint, quantity int, price numeric, name text, color text, size text)
  loop
    total_items_price := total_items_price + cart_item.price * cart_item.quantity;
    total_items_count := total_items_count + cart_item.quantity;
  end loop;

  -- 1. Criar o pedido na tabela 'orders'
  insert into public.orders (user_id, status, total_paid, total_discount, shipping_cost, payment_status)
  values (user_id_input, 'awaiting_payment', total_items_price + shipping_cost_input - coupon_discount_input, coupon_discount_input, shipping_cost_input, 'pending')
  returning id into new_order_id;

  -- 2. Inserir itens do pedido e reservar estoque
  for cart_item in select * from jsonb_to_recordset(cart_items) as x(variant_id bigint, quantity int, price numeric, name text, color text, size text)
  loop
    -- Inserir em order_items
    insert into public.order_items (order_id, variant_id, quantity, unit_price, name_snapshot, color_snapshot, size_snapshot)
    values (new_order_id, cart_item.variant_id, cart_item.quantity, cart_item.price, cart_item.name, cart_item.color, cart_item.size);

    -- Inserir em inventory_movements para reservar o estoque
    insert into public.inventory_movements (variant_id, type, quantity, order_id, reason)
    values (cart_item.variant_id, 'reserve', -cart_item.quantity, new_order_id, 'Checkout reservation');

    -- Opcional: Atualizar a tabela de variantes (se houver uma coluna de estoque)
    -- update public.variants set stock = stock - cart_item.quantity where id = cart_item.variant_id;
  end loop;

  return new_order_id;
end;
$$ language plpgsql volatile security definer;