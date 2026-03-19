-- ============================================
-- POS: orden por más pedidos (categorías y productos)
-- ============================================
-- RPCs para que el punto de venta ordene categorías y productos
-- por cantidad vendida (más pedidos primero), excluyendo pedidos cancelados.

-- Ventas por producto (suma de cantidades en items_pedido)
CREATE OR REPLACE FUNCTION public.get_pos_ventas_por_producto(p_tenant_id UUID)
RETURNS TABLE(producto_id UUID, total_cantidad BIGINT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ip.producto_id, SUM(ip.cantidad)::BIGINT
  FROM items_pedido ip
  INNER JOIN pedidos p ON p.id = ip.pedido_id
    AND p.tenant_id = p_tenant_id
    AND p.estado IS DISTINCT FROM 'cancelado'
  WHERE ip.producto_id IS NOT NULL
  GROUP BY ip.producto_id
$$;

COMMENT ON FUNCTION public.get_pos_ventas_por_producto(UUID) IS
  'Devuelve total de unidades vendidas por producto para un tenant (pedidos no cancelados). Usado para ordenar productos en POS.';

-- Ventas por categoría (suma de cantidades de productos de esa categoría)
CREATE OR REPLACE FUNCTION public.get_pos_ventas_por_categoria(p_tenant_id UUID)
RETURNS TABLE(categoria_id UUID, total_cantidad BIGINT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

COMMENT ON FUNCTION public.get_pos_ventas_por_categoria(UUID) IS
  'Devuelve total de unidades vendidas por categoría para un tenant (pedidos no cancelados). Usado para ordenar categorías en POS.';

-- Permitir a usuarios autenticados ejecutar las funciones
GRANT EXECUTE ON FUNCTION public.get_pos_ventas_por_producto(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_pos_ventas_por_producto(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_pos_ventas_por_categoria(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_pos_ventas_por_categoria(UUID) TO service_role;
