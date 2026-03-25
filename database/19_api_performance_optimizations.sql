-- Optimización API/BD - fase inicial
-- 1) RPC transaccional para cancelación de pedidos (reduce roundtrips y evita N+1 en app)
-- 2) Índices de soporte para filtros calientes y búsqueda textual
-- 3) RPC agregada para dashboard (base para reducir overfetching mensual)

begin;

create extension if not exists pg_trgm;

create index if not exists idx_pedidos_tenant_estado_created_at
  on public.pedidos (tenant_id, estado_pedido, created_at desc);

create index if not exists idx_items_pedido_pedido_id
  on public.items_pedido (pedido_id);

create index if not exists idx_mov_ingredientes_pedido_tipo
  on public.movimientos_ingredientes (pedido_id, tipo);

create index if not exists idx_mov_inventario_pedido_tipo
  on public.movimientos_inventario (pedido_id, tipo);

create index if not exists idx_clientes_nombre_trgm
  on public.clientes using gin (nombre gin_trgm_ops);

create index if not exists idx_clientes_telefono_trgm
  on public.clientes using gin (telefono gin_trgm_ops);

create index if not exists idx_clientes_ci_trgm
  on public.clientes using gin (ci gin_trgm_ops);

create index if not exists idx_productos_nombre_trgm
  on public.productos using gin (nombre gin_trgm_ops);

create or replace function public.cancel_order_transactional(
  p_pedido_id uuid,
  p_tenant_id uuid,
  p_usuario_id uuid,
  p_motivo text default null
)
returns table(success boolean, error text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pedido record;
  v_cliente record;
  v_numero_pedido integer;
  v_stock_anterior numeric;
  v_stock_nuevo numeric;
begin
  select id, numero_pedido, estado_pedido, cliente_id, puntos_generados
  into v_pedido
  from pedidos
  where id = p_pedido_id
    and tenant_id = p_tenant_id
  for update;

  if not found then
    return query select false, 'Pedido no encontrado o no pertenece a este local.';
    return;
  end if;

  if v_pedido.estado_pedido = 'ANUL' then
    return query select false, 'El pedido ya está anulado.';
    return;
  end if;

  if v_pedido.estado_pedido <> 'FACT' then
    return query select false, 'Solo se pueden anular pedidos confirmados (FACT).';
    return;
  end if;

  v_numero_pedido := v_pedido.numero_pedido;

  if v_pedido.cliente_id is not null and coalesce(v_pedido.puntos_generados, 0) > 0 then
    select id, puntos_totales
    into v_cliente
    from clientes
    where id = v_pedido.cliente_id
    for update;

    if found then
      update clientes
      set puntos_totales = greatest(0, coalesce(v_cliente.puntos_totales, 0) - coalesce(v_pedido.puntos_generados, 0)),
          updated_at = now()
      where id = v_pedido.cliente_id;

      insert into transacciones_puntos (
        tenant_id,
        cliente_id,
        pedido_id,
        tipo,
        puntos,
        saldo_anterior,
        saldo_nuevo,
        descripcion
      ) values (
        p_tenant_id,
        v_pedido.cliente_id,
        p_pedido_id,
        'ajuste',
        -coalesce(v_pedido.puntos_generados, 0),
        coalesce(v_cliente.puntos_totales, 0),
        greatest(0, coalesce(v_cliente.puntos_totales, 0) - coalesce(v_pedido.puntos_generados, 0)),
        format('Anulación pedido #%s', v_numero_pedido)
      );
    end if;
  end if;

  with mov as (
    select ingrediente_id, sum(cantidad) as cantidad_total, min(tenant_id) as tenant_id
    from movimientos_ingredientes
    where pedido_id = p_pedido_id
      and tipo = 'salida'
    group by ingrediente_id
  ), upd as (
    update ingredientes i
    set stock_actual = coalesce(i.stock_actual, 0) + m.cantidad_total,
        updated_at = now()
    from mov m
    where i.id = m.ingrediente_id
    returning i.id, m.tenant_id, m.cantidad_total,
      (coalesce(i.stock_actual, 0) - m.cantidad_total) as stock_anterior,
      coalesce(i.stock_actual, 0) as stock_nuevo
  )
  insert into movimientos_ingredientes (
    tenant_id, ingrediente_id, pedido_id, tipo, cantidad, stock_anterior, stock_nuevo, motivo, usuario_id
  )
  select
    u.tenant_id, u.id, p_pedido_id, 'entrada', u.cantidad_total, u.stock_anterior, u.stock_nuevo,
    format('Anulación pedido #%s', v_numero_pedido), p_usuario_id
  from upd u;

  with mov as (
    select inventario_id, sum(abs(cantidad)) as cantidad_total, min(tenant_id) as tenant_id
    from movimientos_inventario
    where pedido_id = p_pedido_id
      and tipo = 'salida'
    group by inventario_id
  ), upd as (
    update inventario i
    set stock_actual = coalesce(i.stock_actual, 0) + m.cantidad_total,
        updated_at = now()
    from mov m
    where i.id = m.inventario_id
    returning i.id, m.tenant_id, m.cantidad_total,
      (coalesce(i.stock_actual, 0) - m.cantidad_total) as stock_anterior,
      coalesce(i.stock_actual, 0) as stock_nuevo
  )
  insert into movimientos_inventario (
    tenant_id, inventario_id, pedido_id, tipo, cantidad, stock_anterior, stock_nuevo, motivo, usuario_id
  )
  select
    u.tenant_id, u.id, p_pedido_id, 'entrada', u.cantidad_total, u.stock_anterior, u.stock_nuevo,
    format('Anulación pedido #%s', v_numero_pedido), p_usuario_id
  from upd u;

  update facturas
  set anulada = true,
      anulada_at = now(),
      anulada_por_id = p_usuario_id,
      updated_at = now()
  where pedido_id = p_pedido_id;

  update pedidos
  set estado_pedido = 'ANUL',
      estado = 'cancelado',
      cancelado_por_id = p_usuario_id,
      cancelado_at = now(),
      motivo_cancelacion = nullif(trim(coalesce(p_motivo, '')), ''),
      updated_at = now()
  where id = p_pedido_id
    and tenant_id = p_tenant_id;

  return query select true, null::text;
exception
  when others then
    return query select false, sqlerrm;
end;
$$;

create or replace function public.get_admin_dashboard_aggregates(
  p_tenant_id uuid,
  p_from timestamptz
)
returns table(
  total_orders bigint,
  total_revenue numeric,
  avg_ticket numeric,
  loyalty_points numeric
)
language sql
stable
as $$
  select
    count(*)::bigint as total_orders,
    coalesce(sum(total), 0)::numeric as total_revenue,
    coalesce(avg(total), 0)::numeric as avg_ticket,
    coalesce(sum(puntos_generados), 0)::numeric as loyalty_points
  from pedidos
  where tenant_id = p_tenant_id
    and created_at >= p_from;
$$;

commit;
