-- Revierte 34_seguridad_fase1.sql y deja permisos y funciones como estaban el 2026-11-03.
BEGIN;

GRANT INSERT, UPDATE, DELETE, TRUNCATE ON TABLE
  public.clientes, public.productos, public.campanas_config, public.campanas_envios
TO anon;
GRANT INSERT, UPDATE, DELETE ON TABLE
  public.mesas, public.items_pedido, public.items_pedido_customizacion, public.mesa_eventos,
  public.mesa_reservas, public.mesa_uniones, public.mesa_union_items,
  public.movimientos_ingredientes, public.pedido_divisiones
TO anon;
GRANT TRUNCATE ON TABLE
  public.usuarios, public.tenants, public.clientes, public.productos,
  public.campanas_config, public.campanas_envios
TO authenticated;

DROP TRIGGER IF EXISTS trg_guard_escritura ON public.usuarios;
DROP TRIGGER IF EXISTS trg_guard_escritura ON public.tenants;
DROP FUNCTION IF EXISTS public.guard_escritura_usuarios();
DROP FUNCTION IF EXISTS public.guard_escritura_tenants();

CREATE OR REPLACE FUNCTION public.regalar_puntos_campana(p_tenant_id uuid, p_cliente_ids uuid[], p_puntos integer, p_descripcion text)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $fn$
DECLARE
  v_cliente_id    UUID;
  v_saldo_anterior INTEGER;
  v_saldo_nuevo   INTEGER;
  v_count         INTEGER := 0;
BEGIN
  IF p_puntos <= 0 THEN
    RETURN 0;
  END IF;
  FOREACH v_cliente_id IN ARRAY p_cliente_ids
  LOOP
    SELECT puntos_totales INTO v_saldo_anterior
    FROM clientes
    WHERE id = v_cliente_id AND tenant_id = p_tenant_id AND is_deleted = false;
    IF FOUND THEN
      v_saldo_nuevo := v_saldo_anterior + p_puntos;
      UPDATE clientes SET puntos_totales = v_saldo_nuevo, updated_at = NOW()
       WHERE id = v_cliente_id AND tenant_id = p_tenant_id;
      INSERT INTO transacciones_puntos (tenant_id, cliente_id, tipo, puntos, saldo_anterior, saldo_nuevo, descripcion)
      VALUES (p_tenant_id, v_cliente_id, 'ajuste', p_puntos, v_saldo_anterior, v_saldo_nuevo, p_descripcion);
      v_count := v_count + 1;
    END IF;
  END LOOP;
  RETURN v_count;
END;
$fn$;
GRANT EXECUTE ON FUNCTION public.regalar_puntos_campana(uuid, uuid[], integer, text) TO PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_pos_ventas_por_producto(p_tenant_id uuid)
RETURNS TABLE(producto_id uuid, total_cantidad bigint) LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $fn$
  SELECT ip.producto_id, SUM(ip.cantidad)::BIGINT
  FROM items_pedido ip
  INNER JOIN pedidos p ON p.id = ip.pedido_id
    AND p.tenant_id = p_tenant_id
    AND p.estado IS DISTINCT FROM 'cancelado'
  WHERE ip.producto_id IS NOT NULL
  GROUP BY ip.producto_id
$fn$;
CREATE OR REPLACE FUNCTION public.get_pos_ventas_por_categoria(p_tenant_id uuid)
RETURNS TABLE(categoria_id uuid, total_cantidad bigint) LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $fn$
  SELECT pr.categoria_id, COALESCE(SUM(ip.cantidad), 0)::BIGINT
  FROM productos pr
  LEFT JOIN items_pedido ip ON ip.producto_id = pr.id
  LEFT JOIN pedidos p ON p.id = ip.pedido_id
    AND p.tenant_id = p_tenant_id
    AND p.estado IS DISTINCT FROM 'cancelado'
  WHERE pr.tenant_id = p_tenant_id
    AND (pr.is_deleted IS NOT TRUE)
    AND pr.categoria_id IS NOT NULL
  GROUP BY pr.categoria_id
$fn$;
GRANT EXECUTE ON FUNCTION public.get_pos_ventas_por_producto(uuid) TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_pos_ventas_por_categoria(uuid) TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.obtener_siguiente_numeracion_pedido(uuid) TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.obtener_siguiente_numero_pedido(uuid) TO PUBLIC;

COMMIT;
