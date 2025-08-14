create or replace function public.handle_payment_update(
  order_id_input uuid,
  payment_status_input text
) returns void as $$
declare
  new_order_status order_status;
  new_payment_status payment_status;
begin
  -- Mapear o status do Mercado Pago para os enums do nosso banco
  case payment_status_input
    when 'approved' then
      new_order_status := 'paid';
      new_payment_status := 'approved';
    when 'rejected' then
      new_order_status := 'canceled';
      new_payment_status := 'rejected';
    when 'cancelled' then
      new_order_status := 'canceled';
      new_payment_status := 'refunded'; -- ou 'cancelled', dependendo do seu enum
    else
      -- Ignorar outros status ou registrar para análise
      return;
  end case;

  -- Atualizar o status do pedido
  update public.orders
  set 
    status = new_order_status,
    payment_status = new_payment_status
  where id = order_id_input;

  -- Lógica de inventário
  if new_order_status = 'paid' then
    -- Mudar a reserva para confirmação de baixa de estoque
    update public.inventory_movements
    set type = 'confirm'
    where order_id = order_id_input and type = 'reserve';

  elsif new_order_status = 'canceled' then
    -- Reverter a reserva de estoque
    -- Isso pode ser feito criando um movimento de cancelamento
    -- ou deletando o movimento de reserva original.
    -- Criar um novo movimento é melhor para fins de auditoria.
    insert into public.inventory_movements (variant_id, type, quantity, order_id, reason)
    select variant_id, 'cancel', -quantity, order_id, 'Order canceled'
    from public.inventory_movements
    where order_id = order_id_input and type = 'reserve';

    -- E então, talvez deletar a reserva original para não ser contada duas vezes
    delete from public.inventory_movements
    where order_id = order_id_input and type = 'reserve';

  end if;

end;
$$ language plpgsql volatile security definer;